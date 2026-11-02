import { getCatalog } from "@/lib/catalog";
import { GatewayError, reserveOrder } from "@/lib/gateway";
import { calculatePricing } from "@/lib/pricing";
import { checkOrderRateLimit, getClientKey } from "@/lib/rate-limit";
import { getStoreSettings } from "@/lib/store-config";
import { notifyTelegram } from "@/lib/telegram";
import { parseOrderFormData } from "@/lib/validation";

export const runtime = "nodejs";

const MAX_ORDER_BODY_BYTES = 6 * 1024 * 1024;

export async function POST(request: Request) {
  const rateLimit = checkOrderRateLimit(getClientKey(request));
  if (!rateLimit.allowed) {
    return Response.json(
      { code: "rate_limited", message: "حاول مرة أخرى بعد قليل." },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } },
    );
  }

  const contentLength = Number(request.headers.get("content-length") || 0);
  if (Number.isFinite(contentLength) && contentLength > MAX_ORDER_BODY_BYTES) {
    return Response.json({ code: "request_too_large", message: "حجم الطلب أكبر من المسموح." }, { status: 413 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return Response.json({ code: "validation_error", message: "بيانات الطلب غير صالحة." }, { status: 400 });
  }

  const settings = getStoreSettings();
  const parsed = parseOrderFormData(formData, {
    instaPayConfigured: settings.instaPayConfigured,
    instaPayProofRequired: settings.instaPayProofRequired,
  });

  if (!parsed.ok) return Response.json({ code: parsed.code, message: parsed.message }, { status: parsed.code === "payment_not_configured" ? 409 : 400 });

  const catalog = await getCatalog();
  if (catalog.inventoryStatus === "unavailable") {
    return Response.json({ code: "inventory_unavailable", message: "المخزون غير متاح حاليًا." }, { status: 503 });
  }

  if (!catalog.pricing.approved) {
    return Response.json({ code: "pricing_not_approved", message: "الأسعار ما زالت تحت المراجعة." }, { status: 409 });
  }

  for (const variant of catalog.variants) {
    if (parsed.input.selection[variant.id] > variant.availableStock) {
      return Response.json({ code: "out_of_stock", message: `الكمية المطلوبة من نسخة ${variant.label} غير متاحة.` }, { status: 409 });
    }
  }

  const pricing = calculatePricing(parsed.input.selection, catalog.pricing, parsed.input.paymentMethod);
  const order = { ...parsed.input, pricing };

  try {
    const result = await reserveOrder(order);
    const notificationStatus = await notifyTelegram(order, result, parsed.proofImage);
    return Response.json({ ok: true, orderId: result.orderId, status: result.status, pricing: result.pricing, notificationStatus }, { status: 201 });
  } catch (error) {
    if (error instanceof GatewayError) {
      const status = error.code === "out_of_stock" || error.code === "duplicate_order" ? 409 : error.code === "not_configured" ? 503 : 502;
      const message =
        error.code === "not_configured"
          ? "نظام الطلبات لم يتم ربطه بعد."
          : error.code === "out_of_stock"
            ? "الكمية المطلوبة لم تعد متاحة."
            : error.code === "duplicate_order"
              ? "الطلب تم استقباله بالفعل."
              : "تعذر تسجيل الطلب حاليًا.";
      console.error("Order gateway failure", { code: error.code });
      return Response.json({ code: error.code, message }, { status });
    }

    console.error("Unexpected order failure", error);
    return Response.json({ code: "internal_error", message: "حصل خطأ مؤقت. حاول مرة أخرى." }, { status: 500 });
  }
}
