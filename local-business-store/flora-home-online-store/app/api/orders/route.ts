import { getCatalog } from "@/lib/catalog";
import { deleteProofUpload, finalizeProofUpload, GatewayError, findOrderByIdempotencyKey, reserveOrder, uploadProofFile } from "@/lib/gateway";
import { calculatePricing } from "@/lib/pricing";
import { checkOrderRateLimit, getClientKey, RateLimitUnavailableError } from "@/lib/rate-limit";
import { getStoreSettings } from "@/lib/store-config";
import { MAX_ORDER_BODY_BYTES, readBoundedFormData, RequestBodyTooLargeError } from "@/lib/request-body";
import { parseOrderFormData } from "@/lib/validation";

export const runtime = "nodejs";
export const maxDuration = 60;

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

  const settings = getStoreSettings();
  const parsed = parseOrderFormData(formData, {
    instaPayConfigured: settings.instaPayConfigured,
    instaPayProofRequired: settings.instaPayProofRequired,
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
      if (parsed.proofUpload) await deleteProofUpload(parsed.proofUpload.uploadId, parsed.proofUpload.uploadToken).catch(() => undefined);
      return Response.json({ ok: true, ...existingOrder, duplicate: true }, { status: 200 });
    }
  } catch (error) {
    if (error instanceof GatewayError) {
      return gatewayFailure(error);
    }
    console.error("Order idempotency lookup failed.");
    return Response.json({ code: "internal_error", message: "حصل خطأ مؤقت. حاول مرة أخرى." }, { status: 503 });
  }

  const catalog = await getCatalog();
  if (catalog.inventoryStatus !== "live") {
    if (parsed.proofUpload) await deleteProofUpload(parsed.proofUpload.uploadId, parsed.proofUpload.uploadToken).catch(() => undefined);
    return Response.json({ code: "inventory_unavailable", message: "المخزون المباشر غير متاح حاليًا." }, { status: 503 });
  }
  if (!catalog.pricing.approved) {
    if (parsed.proofUpload) await deleteProofUpload(parsed.proofUpload.uploadId, parsed.proofUpload.uploadToken).catch(() => undefined);
    return Response.json({ code: "pricing_not_approved", message: "الأسعار ما زالت تحت المراجعة." }, { status: 409 });
  }

  for (const variant of catalog.variants) {
    if (parsed.input.selection[variant.id] > variant.availableStock) {
      if (parsed.proofUpload) await deleteProofUpload(parsed.proofUpload.uploadId, parsed.proofUpload.uploadToken).catch(() => undefined);
      return Response.json({ code: "out_of_stock", message: `الكمية المطلوبة من نسخة ${variant.label} غير متاحة.` }, { status: 409 });
    }
  }

  const pricing = calculatePricing(parsed.input.selection, catalog.pricing, parsed.input.paymentMethod);
  const order = { ...parsed.input, pricing };
  let proofUpload: { uploadId: string; uploadToken: string; fileId: string } | null = null;
  let reservationAttempted = false;

  try {
    if (parsed.proofUpload) {
      const fileId = await finalizeProofUpload(
        { uploadId: parsed.proofUpload.uploadId, uploadToken: parsed.proofUpload.uploadToken },
        parsed.proofUpload.chunkCount,
        parsed.proofUpload.fileType,
      );
      proofUpload = { uploadId: parsed.proofUpload.uploadId, uploadToken: parsed.proofUpload.uploadToken, fileId };
    } else if (parsed.proofImage) {
      proofUpload = await uploadProofFile(parsed.proofImage);
    }
    reservationAttempted = true;
    const result = await reserveOrder(
      order,
      proofUpload?.fileId,
      proofUpload ? { uploadId: proofUpload.uploadId, uploadToken: proofUpload.uploadToken } : undefined,
    );
    return Response.json(
      { ok: true, orderId: result.orderId, status: result.status, pricing: result.pricing, duplicate: result.duplicate || false },
      { status: result.duplicate ? 200 : 201 },
    );
  } catch (error) {
    const definiteReservationFailure = error instanceof GatewayError
      && ["out_of_stock", "not_configured", "duplicate_order"].includes(error.code);
    if (proofUpload && (!reservationAttempted || definiteReservationFailure)) {
      await deleteProofUpload(proofUpload.uploadId, proofUpload.uploadToken).catch(() => undefined);
    } else if (parsed.proofUpload && !reservationAttempted) {
      await deleteProofUpload(parsed.proofUpload.uploadId, parsed.proofUpload.uploadToken).catch(() => undefined);
    }
    if (error instanceof GatewayError) return gatewayFailure(error);

    // A network failure can happen after the gateway has committed the row; keep the same key for safe retry.
    console.error("Order submission failed after gateway call.");
    return Response.json({ code: "internal_error", message: "حصل خطأ مؤقت. أعد المحاولة بنفس البيانات." }, { status: 503 });
  }
}

function gatewayFailure(error: GatewayError): Response {
  const status = error.code === "out_of_stock" || error.code === "duplicate_order"
    ? 409
    : error.code === "not_configured" || error.code === "proof_upload_failed"
      ? 503
      : 502;
  const code = error.code === "proof_upload_failed" ? "proof_upload_failed" : error.code;
  const message = error.code === "not_configured"
    ? "نظام الطلبات لم يتم ربطه بعد."
    : error.code === "out_of_stock"
      ? "الكمية المطلوبة لم تعد متاحة."
      : error.code === "proof_upload_failed"
        ? "تعذر حفظ صورة التحويل. حاول مرة أخرى قبل تسجيل الطلب."
        : error.code === "duplicate_order"
          ? "الطلب تم استقباله بالفعل."
          : "تعذر تسجيل الطلب حاليًا.";
  console.error("Order gateway rejected request", { code });
  return Response.json({ code, message }, { status });
}
