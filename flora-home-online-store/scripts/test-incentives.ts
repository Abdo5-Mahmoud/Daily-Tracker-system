import assert from "node:assert/strict";
import { getIncentiveMessage } from "../lib/incentives";
import type { PricingConfig } from "../lib/types";

const pricing: PricingConfig = {
  approved: true,
  singlePrice: 219,
  twoPrice: 399,
  threePrice: 549,
  additionalUnitPrice: 183,
  shippingFee: 60,
  prepaidDiscount: 30,
  freeShippingThreshold: 3,
};

assert.match(getIncentiveMessage(0, pricing), /اختار فازتك/);
assert.match(getIncentiveMessage(1, pricing), /39 ج\.م/);
assert.match(getIncentiveMessage(2, pricing), /ثالثة/);
assert.match(getIncentiveMessage(3, pricing), /الشحن المجاني/);

const customPricing = { ...pricing, singlePrice: 250, twoPrice: 460, freeShippingThreshold: 4 };
assert.match(getIncentiveMessage(1, customPricing), /40 ج\.م/);
assert.match(getIncentiveMessage(3, customPricing), /رابعة/);

console.log("Incentive message tests passed.");
