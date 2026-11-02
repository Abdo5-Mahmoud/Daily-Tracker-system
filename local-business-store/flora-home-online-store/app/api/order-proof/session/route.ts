import { startProofUpload } from "@/lib/gateway";
import { checkProofSessionRateLimit, getClientKey, RateLimitUnavailableError } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const rateLimit = await checkProofSessionRateLimit(getClientKey(request));
    if (!rateLimit.allowed) {
      return Response.json(
        { code: "rate_limited", message: "تم استلام محاولات كثيرة. حاول مرة أخرى بعد قليل." },
        { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } },
      );
    }
    return Response.json(await startProofUpload(), { status: 201 });
  } catch (error) {
    if (!(error instanceof RateLimitUnavailableError)) console.error("Proof upload session could not be started.");
    return Response.json(
      { code: "proof_upload_failed", message: "تعذر بدء رفع الصورة. حاول مرة أخرى." },
      { status: 503 },
    );
  }
}
