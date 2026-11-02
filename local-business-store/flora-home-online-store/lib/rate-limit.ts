import { createHmac } from "node:crypto";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS = 5;

export type RateLimitResult = {
  allowed: boolean;
  retryAfterSeconds: number;
};

type StoreEntry = { count: number; windowStartedAt: number };

export type RateLimitStore = {
  limit: (key: string, now?: number) => RateLimitResult;
};

export function createLocalRateLimitStore(maxRequests = MAX_REQUESTS, windowMs = WINDOW_MS): RateLimitStore {
  const entries = new Map<string, StoreEntry>();
  return {
    limit(key, now = Date.now()) {
      for (const [entryKey, entry] of entries) {
        if (now - entry.windowStartedAt >= windowMs) entries.delete(entryKey);
      }
      const current = entries.get(key);
      if (!current || now - current.windowStartedAt >= windowMs) {
        entries.set(key, { count: 1, windowStartedAt: now });
        return { allowed: true, retryAfterSeconds: 0 };
      }
      if (current.count >= maxRequests) {
        return {
          allowed: false,
          retryAfterSeconds: Math.max(1, Math.ceil((windowMs - (now - current.windowStartedAt)) / 1000)),
        };
      }
      current.count += 1;
      return { allowed: true, retryAfterSeconds: 0 };
    },
  };
}

export class RateLimitUnavailableError extends Error {
  constructor() {
    super("The shared rate-limit store is unavailable.");
    this.name = "RateLimitUnavailableError";
  }
}

export type OrderRateLimiterDependencies = {
  hashSecret: string;
  production: boolean;
  upstashConfigured: boolean;
  maxRequests?: number;
  windowMs?: number;
  upstashLimit?: (hashedIdentifier: string, now?: number) => Promise<{ success: boolean; reset: number; reason?: string }>;
  localLimit?: (hashedIdentifier: string, now?: number) => RateLimitResult;
};

export function hashRateLimitIdentifier(clientKey: string, secret: string): string {
  return createHmac("sha256", secret).update(clientKey).digest("hex");
}

export function createOrderRateLimiter(dependencies: OrderRateLimiterDependencies) {
  const localStore = createLocalRateLimitStore(dependencies.maxRequests || MAX_REQUESTS, dependencies.windowMs || WINDOW_MS);
  return async (clientKey: string, now = Date.now()): Promise<RateLimitResult> => {
    if (!dependencies.hashSecret || (dependencies.production && !dependencies.upstashConfigured)) {
      if (dependencies.production) throw new RateLimitUnavailableError();
      return (dependencies.localLimit || ((key, timestamp) => localStore.limit(key, timestamp)))(
        hashRateLimitIdentifier(clientKey, dependencies.hashSecret || "local-only-rate-limit-key"),
        now,
      );
    }

    const identifier = hashRateLimitIdentifier(clientKey, dependencies.hashSecret);
    try {
      if (!dependencies.upstashLimit) throw new RateLimitUnavailableError();
      const result = await dependencies.upstashLimit(identifier, now);
      if (result.reason === "timeout") throw new RateLimitUnavailableError();
      return {
        allowed: result.success,
        retryAfterSeconds: result.success ? 0 : Math.max(1, Math.ceil((result.reset - now) / 1000)),
      };
    } catch {
      if (dependencies.production) throw new RateLimitUnavailableError();
      return (dependencies.localLimit || ((key, timestamp) => localStore.limit(key, timestamp)))(identifier, now);
    }
  };
}

const localStores = new Map<string, RateLimitStore>();
const sharedRateLimiters = new Map<string, Ratelimit>();
const scopedLimiters = new Map<string, ReturnType<typeof createOrderRateLimiter>>();

function createSharedLimiter(prefix: string, maxRequests: number): ((hashedIdentifier: string) => Promise<{ success: boolean; reset: number; reason?: string }>) | null {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) return null;

  if (!sharedRateLimiters.has(prefix)) {
    const redis = new Redis({ url, token });
    sharedRateLimiters.set(prefix, new Ratelimit({
      redis,
      limiter: Ratelimit.fixedWindow(maxRequests, "10 m"),
      prefix,
      ephemeralCache: false,
      timeout: 1000,
    }));
  }
  return async (identifier) => {
    const result = await sharedRateLimiters.get(prefix)!.limit(identifier);
    return { success: result.success, reset: result.reset, reason: result.reason };
  };
}

export function getClientKey(request: Request): string {
  const realIp = request.headers.get("x-real-ip")?.trim();
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return realIp || forwarded || "unknown-client";
}

async function checkScopedRateLimit(clientKey: string, scope: "orders" | "proof-sessions" | "proof-chunks", maxRequests: number): Promise<RateLimitResult> {
  const production = process.env.NODE_ENV === "production";
  const hashSecret = process.env.RATE_LIMIT_HASH_SECRET?.trim() || (production ? "" : "local-development-rate-limit-key");
  const prefix = `flora-home:${scope}`;
  const upstashLimit = createSharedLimiter(prefix, maxRequests);
  if (!scopedLimiters.has(scope)) {
    localStores.set(scope, createLocalRateLimitStore(maxRequests));
    scopedLimiters.set(scope, createOrderRateLimiter({
      hashSecret,
      production,
      upstashConfigured: Boolean(upstashLimit),
      upstashLimit: upstashLimit || undefined,
      maxRequests,
      localLimit: (identifier, now) => localStores.get(scope)!.limit(identifier, now),
    }));
  }
  return scopedLimiters.get(scope)!(clientKey);
}

export function checkOrderRateLimit(clientKey: string): Promise<RateLimitResult> {
  return checkScopedRateLimit(clientKey, "orders", MAX_REQUESTS);
}

export function checkProofSessionRateLimit(clientKey: string): Promise<RateLimitResult> {
  return checkScopedRateLimit(clientKey, "proof-sessions", 10);
}

export function checkProofChunkRateLimit(clientKey: string): Promise<RateLimitResult> {
  return checkScopedRateLimit(clientKey, "proof-chunks", 30);
}
