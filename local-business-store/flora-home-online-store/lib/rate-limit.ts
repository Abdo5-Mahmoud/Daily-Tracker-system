type RateLimitEntry = {
  count: number;
  windowStartedAt: number;
};

const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS = 5;
const entries = new Map<string, RateLimitEntry>();

export type RateLimitResult = {
  allowed: boolean;
  retryAfterSeconds: number;
};

export function getClientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip")?.trim() || "unknown-client";
}

export function checkOrderRateLimit(key: string, now = Date.now()): RateLimitResult {
  for (const [entryKey, entry] of entries) {
    if (now - entry.windowStartedAt >= WINDOW_MS) entries.delete(entryKey);
  }

  const current = entries.get(key);
  if (!current || now - current.windowStartedAt >= WINDOW_MS) {
    entries.set(key, { count: 1, windowStartedAt: now });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (current.count >= MAX_REQUESTS) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((WINDOW_MS - (now - current.windowStartedAt)) / 1000)),
    };
  }

  current.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}
