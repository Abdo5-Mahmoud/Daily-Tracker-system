import assert from "node:assert/strict";
import { createOrderRateLimiter, createLocalRateLimitStore } from "../lib/rate-limit";

async function run(): Promise<void> {
  const redisStore = createLocalRateLimitStore();
  const seenIdentifiers: string[] = [];
  const sharedLimit = async (identifier: string, now = Date.now()) => {
    seenIdentifiers.push(identifier);
    const result = redisStore.limit(identifier, now);
    return { success: result.allowed, reset: now + (result.allowed ? 10 * 60 * 1000 : result.retryAfterSeconds * 1000) };
  };
  const firstAppInstance = createOrderRateLimiter({
    hashSecret: "test-hash-secret",
    production: true,
    upstashConfigured: true,
    upstashLimit: sharedLimit,
  });
  const secondAppInstance = createOrderRateLimiter({
    hashSecret: "test-hash-secret",
    production: true,
    upstashConfigured: true,
    upstashLimit: sharedLimit,
  });

  for (let attempt = 0; attempt < 4; attempt += 1) {
    assert.equal((await firstAppInstance("192.0.2.10", attempt)).allowed, true);
  }
  assert.equal((await secondAppInstance("192.0.2.10", 4)).allowed, true);
  const blocked = await firstAppInstance("192.0.2.10", 5);
  assert.equal(blocked.allowed, false);
  assert.ok(blocked.retryAfterSeconds > 0);
  assert.equal((await firstAppInstance("192.0.2.10", 10 * 60 * 1000 + 1)).allowed, true);
  assert.equal(seenIdentifiers.every((identifier) => /^[a-f0-9]{64}$/.test(identifier)), true);
  assert.equal(seenIdentifiers.includes("192.0.2.10"), false);

  const unavailable = createOrderRateLimiter({
    hashSecret: "test-hash-secret",
    production: true,
    upstashConfigured: false,
  });
  await assert.rejects(() => unavailable("192.0.2.11"), { name: "RateLimitUnavailableError" });

  const missingHashSecret = createOrderRateLimiter({
    hashSecret: "",
    production: true,
    upstashConfigured: true,
    upstashLimit: async () => ({ success: true, reset: Date.now() + 1000 }),
  });
  await assert.rejects(() => missingHashSecret("192.0.2.11"), { name: "RateLimitUnavailableError" });

  const failingProductionStore = createOrderRateLimiter({
    hashSecret: "test-hash-secret",
    production: true,
    upstashConfigured: true,
    upstashLimit: async () => { throw new Error("redis offline"); },
  });
  await assert.rejects(() => failingProductionStore("192.0.2.12"), { name: "RateLimitUnavailableError" });

  const timedOutProductionStore = createOrderRateLimiter({
    hashSecret: "test-hash-secret",
    production: true,
    upstashConfigured: true,
    upstashLimit: async () => ({ success: true, reset: Date.now() + 1000, reason: "timeout" }),
  });
  await assert.rejects(() => timedOutProductionStore("192.0.2.14"), { name: "RateLimitUnavailableError" });

  const localDevelopmentStore = createLocalRateLimitStore();
  const developmentLimiter = createOrderRateLimiter({
    hashSecret: "development-secret",
    production: false,
    upstashConfigured: false,
    localLimit: (identifier, now) => localDevelopmentStore.limit(identifier, now),
  });
  for (let attempt = 0; attempt < 5; attempt += 1) {
    assert.equal((await developmentLimiter("192.0.2.13", attempt)).allowed, true);
  }
  assert.equal((await developmentLimiter("192.0.2.13", 6)).allowed, false);

  const proofSessionLimiter = createOrderRateLimiter({
    hashSecret: "proof-session-secret",
    production: false,
    upstashConfigured: false,
    maxRequests: 10,
  });
  for (let attempt = 0; attempt < 10; attempt += 1) {
    assert.equal((await proofSessionLimiter("192.0.2.15", attempt)).allowed, true);
  }
  assert.equal((await proofSessionLimiter("192.0.2.15", 11)).allowed, false);

  const proofChunkLimiter = createOrderRateLimiter({
    hashSecret: "proof-chunk-secret",
    production: false,
    upstashConfigured: false,
    maxRequests: 30,
  });
  for (let attempt = 0; attempt < 30; attempt += 1) {
    assert.equal((await proofChunkLimiter("192.0.2.16", attempt)).allowed, true);
  }
  assert.equal((await proofChunkLimiter("192.0.2.16", 31)).allowed, false);
}

void run().then(() => console.log("Rate-limit tests passed."));
