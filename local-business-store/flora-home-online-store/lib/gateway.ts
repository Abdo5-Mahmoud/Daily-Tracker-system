import type { GatewayOrderResult, OrderInput, Selection } from "./types";
import { Buffer } from "node:buffer";

const PROOF_CHUNK_BYTES = 1024 * 1024;
export type ProofUploadSession = { uploadId: string; uploadToken: string };

export class GatewayError extends Error {
  constructor(
    message: string,
    public readonly code: "not_configured" | "out_of_stock" | "duplicate_order" | "remote_error" | "proof_upload_failed",
  ) {
    super(message);
  }
}

type InventoryResponse = {
  ok: true;
  inventory: Record<keyof Selection, { directStock: number; availableStock: number; amazonInbound: number }>;
};

function gatewayConfig(): { url: string; secret: string } | null {
  const url = process.env.APPS_SCRIPT_GATEWAY_URL?.trim();
  const secret = process.env.APPS_SCRIPT_SHARED_SECRET?.trim();
  return url && secret ? { url, secret } : null;
}

async function callGateway<T>(action: string, payload: Record<string, unknown> = {}): Promise<T> {
  const config = gatewayConfig();
  if (!config) throw new GatewayError("Order gateway is not configured.", "not_configured");

  const response = await fetch(config.url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    body: JSON.stringify({ action, secret: config.secret, ...payload }),
  });

  if (!response.ok) throw new GatewayError("Order gateway returned an error.", "remote_error");

  const body = (await response.json()) as { ok?: boolean; code?: string; message?: string } & T;
  if (!body.ok) {
    const code = body.code === "OUT_OF_STOCK"
      ? "out_of_stock"
      : body.code === "DUPLICATE_ORDER"
        ? "duplicate_order"
        : body.code === "PROOF_UPLOAD_FAILED"
          ? "proof_upload_failed"
          : "remote_error";
    throw new GatewayError(body.message || "Order gateway rejected the request.", code);
  }

  return body;
}

export async function findOrderByIdempotencyKey(idempotencyKey: string): Promise<{ orderId: string; status: GatewayOrderResult["status"] } | null> {
  const response = await callGateway<{ exists: boolean; orderId?: string; status?: GatewayOrderResult["status"] }>("findOrder", { idempotencyKey });
  return response.exists && response.orderId && response.status
    ? { orderId: response.orderId, status: response.status }
    : null;
}

export async function startProofUpload(): Promise<ProofUploadSession> {
  return callGateway<ProofUploadSession>("startProofUpload");
}

export async function uploadProofChunk(
  session: ProofUploadSession,
  file: File,
  index: number,
  chunkCount: number,
): Promise<void> {
  const bytes = Buffer.from(await file.arrayBuffer());
  if (bytes.byteLength > PROOF_CHUNK_BYTES) throw new GatewayError("Proof chunk is too large.", "proof_upload_failed");
  await callGateway("uploadProofChunk", {
    uploadId: session.uploadId,
    uploadToken: session.uploadToken,
    index,
    chunkCount,
    data: bytes.toString("base64"),
  });
}

export async function finalizeProofUpload(session: ProofUploadSession, chunkCount: number, fileType: string): Promise<string> {
  const result = await callGateway<{ fileId: string }>("finalizeProofUpload", {
    uploadId: session.uploadId,
    uploadToken: session.uploadToken,
    chunkCount,
    fileType,
  });
  return result.fileId;
}

export async function uploadProofFile(file: File): Promise<{ uploadId: string; uploadToken: string; fileId: string }> {
  const bytes = Buffer.from(await file.arrayBuffer());
  const session = await startProofUpload();
  const chunkCount = Math.ceil(bytes.byteLength / PROOF_CHUNK_BYTES);
  try {
    for (let index = 0; index < chunkCount; index += 1) {
      const start = index * PROOF_CHUNK_BYTES;
      const chunk = bytes.subarray(start, Math.min(start + PROOF_CHUNK_BYTES, bytes.byteLength));
      await callGateway("uploadProofChunk", {
        uploadId: session.uploadId,
        uploadToken: session.uploadToken,
        index,
        chunkCount,
        data: chunk.toString("base64"),
      });
    }
    const fileId = await finalizeProofUpload(session, chunkCount, file.type);
    return { uploadId: session.uploadId, uploadToken: session.uploadToken, fileId };
  } catch {
    await deleteProofUpload(session.uploadId, session.uploadToken).catch(() => undefined);
    throw new GatewayError("Payment proof could not be stored.", "proof_upload_failed");
  }
}

export async function deleteProofUpload(uploadId: string, uploadToken: string): Promise<void> {
  await callGateway("cleanupProofUpload", { uploadId, uploadToken });
}

export async function reserveOrder(
  input: OrderInput,
  proofFileId?: string,
  proofUploadSession?: { uploadId: string; uploadToken: string },
): Promise<GatewayOrderResult> {
  return callGateway<GatewayOrderResult>("reserveOrder", {
    order: input,
    proofFileId: proofFileId || "",
    proofUploadId: proofUploadSession?.uploadId || "",
    proofUploadToken: proofUploadSession?.uploadToken || "",
    queueNotifications: true,
  });
}

export async function fetchDirectInventory(): Promise<InventoryResponse["inventory"]> {
  const response = await callGateway<InventoryResponse>("getInventory");
  return response.inventory;
}
