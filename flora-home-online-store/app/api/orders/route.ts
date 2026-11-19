import { getCatalog } from "@/lib/catalog";
import { findOrderByIdempotencyKey, GatewayError, hasRequestedStock, reserveOrder } from "@/lib/gateway";
import { calculatePricing } from "@/lib/pricing";
import { buildWhatsappOrderUrl } from "@/lib/whatsapp";
import { checkOrderRateLimit, getClientKey, RateLimitUnavailableError } from "@/lib/rate-limit";
import { getStoreSettings } from "@/lib/store-config";
import { MAX_ORDER_BODY_BYTES, readBoundedFormData, RequestBodyTooLargeError } from "@/lib/request-body";
import { parseOrderFormData } from "@/lib/validation";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: Request) {
  try {
    const rateLimit = await checkOrderRateLimit(getClientKey(request));
    if (!rateLimit.allowed) {
      return Response.json(
        { code: "rate_limited", message: "حاول مرة أخرى بعد قليل." },
        { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } },
      );
    }
  } catch (error) {
    if (!(error instanceof RateLimitUnavailableError)) console.error("Order rate-limit check failed.");
    return Response.json(
      { code: "rate_limit_unavailable", message: "استقبال الطلبات متوقف مؤقتًا. حاول مرة أخرى بعد قليل." },
      { status: 503 },
    );
  }

  let formData: FormData;
  try {
    formData = await readBoundedFormData(request, MAX_ORDER_BODY_BYTES);
  } catch (error) {
    if (error instanceof RequestBodyTooLargeError) {
      return Response.json({ code: "request_too_large", message: "حجم الطلب أكبر من المسموح." }, { status: 413 });
    }
    return Response.json({ code: "validation_error", message: "بيانات الطلب غير صالحة." }, { status: 400 });
  }

  const localSettings = getStoreSettings();
  const parsed = parseOrderFormData(formData, {
    instaPayConfigured: Boolean(process.env.APPS_SCRIPT_GATEWAY_URL && process.env.APPS_SCRIPT_SHARED_SECRET) || localSettings.instaPayConfigured,
  });
  if (!parsed.ok) {
    return Response.json(
      { code: parsed.code, message: parsed.message },
      { status: parsed.code === "payment_not_configured" ? 409 : 400 },
    );
  }

  try {
    const existingOrder = await findOrderByIdempotencyKey(parsed.input.idempotencyKey);
    if (existingOrder) {
      const catalog = await getCatalog();
      const pricing = existingOrder.pricing || calculatePricing(parsed.input.selection, catalog.pricing, parsed.input.paymentMethod);
      const whatsappUrl = buildWhatsappOrderUrl(catalog.settings.supportWhatsapp, {
        orderId: existingOrder.orderId,
        paymentMethod: existingOrder.paymentMethod || parsed.input.paymentMethod,
        total: pricing.total,
        shippingDeposit: pricing.shippingDeposit,
        codRemaining: pricing.codRemaining,
      });
      return Response.json({
        ok: true,
        orderId: existingOrder.orderId,
        status: existingOrder.status,
        pricing,
        shippingDeposit: pricing.shippingDeposit,
        codRemaining: pricing.codRemaining,
        whatsappUrl,
        duplicate: true,
      }, { status: 200 });
    }

    const catalog = await getCatalog();
    if (catalog.inventoryStatus !== "live") {
      return Response.json({ code: "inventory_unavailable", message: "المخزون المباشر غير متاح حاليًا." }, { status: 503 });
    }
    if (!catalog.settings.storeEnabled) {
      return Response.json({ code: "store_disabled", message: catalog.settings.sitePausedMessage }, { status: 409 });
    }
    if (!catalog.pricing.approved) {
      return Response.json({ code: "pricing_not_approved", message: "الأسعار ما زالت تحت المراجعة." }, { status: 409 });
    }
    const liveInventory = {
      bubble: catalog.variants.find((variant) => variant.id === "bubble")!,
      diamond: catalog.variants.find((variant) => variant.id === "diamond")!,
      fluted: catalog.variants.find((variant) => variant.id === "fluted")!,
    };
    if (!hasRequestedStock(parsed.input.selection, liveInventory)) {
      return Response.json({ code: "out_of_stock", message: "الكمية المطلوبة لم تعد متاحة." }, { status: 409 });
    }

    const pricing = calculatePricing(parsed.input.selection, catalog.pricing, parsed.input.paymentMethod);
    const result = await reserveOrder({ ...parsed.input, pricing });
    const whatsappUrl = buildWhatsappOrderUrl(catalog.settings.supportWhatsapp, {
      orderId: result.orderId,
      paymentMethod: parsed.input.paymentMethod,
      total: result.pricing.total,
      shippingDeposit: result.pricing.shippingDeposit,
      codRemaining: result.pricing.codRemaining,
    });

    return Response.json({
      ok: true,
      orderId: result.orderId,
      status: result.status,
      pricing: result.pricing,
      shippingDeposit: result.pricing.shippingDeposit,
      codRemaining: result.pricing.codRemaining,
      whatsappUrl,
      duplicate: result.duplicate || false,
    }, { status: result.duplicate ? 200 : 201 });
  } catch (error) {
    if (error instanceof GatewayError) return gatewayFailure(error);
    console.error("Order submission failed.");
    return Response.json({ code: "internal_error", message: "حصل خطأ مؤقت. أعد المحاولة بنفس البيانات." }, { status: 503 });
  }
}

function gatewayFailure(error: GatewayError): Response {
  const status = error.code === "out_of_stock" || error.code === "duplicate_order" || error.code === "store_disabled" || error.code === "pricing_not_approved" || error.code === "payment_not_configured"
    ? 409
    : error.code === "not_configured"
      ? 503
      : 502;
  const code = error.code;
  const message = error.code === "not_configured"
    ? "نظام الطلبات لم يتم ربطه بعد."
    : error.code === "out_of_stock"
      ? "الكمية المطلوبة لم تعد متاحة."
      : error.code === "store_disabled"
        ? "الطلبات متوقفة مؤقتًا. حاول مرة أخرى بعد قليل."
        : error.code === "pricing_not_approved"
          ? "الأسعار ما زالت تحت المراجعة."
          : error.code === "payment_not_configured"
            ? "بيانات الدفع المسبق غير مكتملة حاليًا."
          : error.code === "duplicate_order"
            ? "الطلب تم استقباله بالفعل."
            : "تعذر تسجيل الطلب حاليًا.";
  console.error("Order gateway rejected request", { code });
  return Response.json({ code, message }, { status });
}
