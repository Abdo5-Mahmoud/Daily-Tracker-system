import assert from "node:assert/strict";
import { checkOrderRateLimit } from "../lib/rate-limit";

const key = `test-client-${Date.now()}`;
for (let attempt = 0; attempt < 5; attempt += 1) {
  assert.equal(checkOrderRateLimit(key, attempt).allowed, true);
}

const blocked = checkOrderRateLimit(key, 5);
assert.equal(blocked.allowed, false);
assert.ok(blocked.retryAfterSeconds > 0);
assert.equal(checkOrderRateLimit(key, 10 * 60 * 1000 + 1).allowed, true);

console.log("Rate-limit tests passed.");
