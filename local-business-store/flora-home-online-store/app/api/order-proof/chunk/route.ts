import { deleteProofUpload, GatewayError, uploadProofChunk } from "@/lib/gateway";
import { checkProofChunkRateLimit, getClientKey, RateLimitUnavailableError } from "@/lib/rate-limit";
import { readBoundedFormData, readBoundedJson, RequestBodyTooLargeError } from "@/lib/request-body";

export const runtime = "nodejs";
export const maxDuration = 60;
const MAX_CHUNK_REQUEST_BYTES = 1024 * 1024 + 64 * 1024;
const uploadIdPattern = /^[a-f0-9-]{36}$/i;
const uploadTokenPattern = /^[a-zA-Z0-9_-]{32,100}$/;

export async function POST(request: Request) {
  try {
    const rateLimit = await checkProofChunkRateLimit(getClientKey(request));
    if (!rateLimit.allowed) {
      return Response.json(
        { code: "rate_limited", message: "تم استلام محاولات رفع كثيرة. حاول مرة أخرى بعد قليل." },
        { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } },
      );
    }
  } catch (error) {
    if (!(error instanceof RateLimitUnavailableError)) console.error("Proof chunk rate-limit check failed.");
    return Response.json({ code: "rate_limit_unavailable", message: "رفع الصور متوقف مؤقتًا." }, { status: 503 });
  }

  let formData: FormData;
  try {
    formData = await readBoundedFormData(request, MAX_CHUNK_REQUEST_BYTES);
  } catch (error) {
    const tooLarge = error instanceof RequestBodyTooLargeError;
    return Response.json(
      { code: tooLarge ? "request_too_large" : "proof_upload_failed", message: "تعذر قراءة جزء الصورة." },
      { status: tooLarge ? 413 : 400 },
    );
  }
  const uploadId = String(formData.get("uploadId") || "");
  const uploadToken = String(formData.get("uploadToken") || "");
  const index = Number(formData.get("index"));
  const chunkCount = Number(formData.get("chunkCount"));
  const file = formData.get("proofChunk");
  if (!uploadIdPattern.test(uploadId) || !uploadTokenPattern.test(uploadToken)
    || !Number.isInteger(index) || !Number.isInteger(chunkCount) || chunkCount < 1 || chunkCount > 5
    || index < 0 || index >= chunkCount || !(file instanceof File) || file.size < 1 || file.size > 1024 * 1024) {
    return Response.json({ code: "proof_upload_failed", message: "جزء الصورة غير صالح." }, { status: 400 });
  }

  try {
    await uploadProofChunk({ uploadId, uploadToken }, file, index, chunkCount);
    return Response.json({ ok: true }, { status: 200 });
  } catch (error) {
    if (!(error instanceof GatewayError)) console.error("Proof image chunk could not be stored.");
    return Response.json({ code: "proof_upload_failed", message: "تعذر حفظ جزء الصورة. أعد المحاولة." }, { status: 503 });
  }
}

export async function DELETE(request: Request) {
  let body: { uploadId?: string; uploadToken?: string };
  try {
    body = await readBoundedJson<{ uploadId?: string; uploadToken?: string }>(request, 2048);
  } catch {
    return Response.json({ code: "proof_upload_failed", message: "بيانات التنظيف غير صالحة." }, { status: 400 });
  }
  if (!uploadIdPattern.test(body.uploadId || "") || !uploadTokenPattern.test(body.uploadToken || "")) {
    return Response.json({ code: "proof_upload_failed", message: "بيانات التنظيف غير صالحة." }, { status: 400 });
  }
  try {
    await deleteProofUpload(body.uploadId!, body.uploadToken!);
    return Response.json({ ok: true }, { status: 200 });
  } catch {
    return Response.json({ code: "proof_upload_failed", message: "تعذر تنظيف الصورة المؤقتة." }, { status: 503 });
  }
}
