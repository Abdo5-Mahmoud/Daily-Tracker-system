export const MAX_ORDER_BODY_BYTES = 6 * 1024 * 1024;

export class RequestBodyTooLargeError extends Error {
  constructor() {
    super("Order request body exceeded the configured limit.");
    this.name = "RequestBodyTooLargeError";
  }
}

export async function readBoundedBytes(
  request: Request,
  maxBytes = MAX_ORDER_BODY_BYTES,
): Promise<Uint8Array> {
  const declaredLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    throw new RequestBodyTooLargeError();
  }
  if (!request.body) throw new TypeError("Request body is missing.");

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > maxBytes) {
        await reader.cancel().catch(() => undefined);
        throw new RequestBodyTooLargeError();
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const body = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return body;
}

export async function readBoundedFormData(
  request: Request,
  maxBytes = MAX_ORDER_BODY_BYTES,
): Promise<FormData> {
  const body = await readBoundedBytes(request, maxBytes);
  const headers = new Headers(request.headers);
  headers.delete("content-length");
  const blobBody = new ArrayBuffer(body.byteLength);
  new Uint8Array(blobBody).set(body);
  const boundedRequest = new Request(request.url, {
    method: "POST",
    headers,
    body: new Blob([blobBody]),
  });
  return boundedRequest.formData();
}

export async function readBoundedJson<T>(request: Request, maxBytes = 4096): Promise<T> {
  const body = await readBoundedBytes(request, maxBytes);
  return JSON.parse(new TextDecoder().decode(body)) as T;
}
