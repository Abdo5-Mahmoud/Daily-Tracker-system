import assert from "node:assert/strict";
import { calculatePricing } from "../lib/pricing";
import type { PricingConfig, Selection } from "../lib/types";

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

const selection = (bubble: number, diamond: number, fluted: number): Selection => ({ bubble, diamond, fluted });

const onePiece = calculatePricing(selection(1, 0, 0), pricing, "COD");
assert.equal(onePiece.total, 279);
assert.equal(onePiece.shipping, 60);

const twoPieces = calculatePricing(selection(1, 1, 0), pricing, "COD");
assert.equal(twoPieces.productSubtotal, 399);
assert.equal(twoPieces.total, 459);

const threePiecesPrepaid = calculatePricing(selection(1, 1, 1), pricing, "InstaPay");
assert.equal(threePiecesPrepaid.shipping, 0);
assert.equal(threePiecesPrepaid.total, 519);

const fourPieces = calculatePricing(selection(2, 1, 1), pricing, "COD");
assert.equal(fourPieces.productSubtotal, 732);

console.log("Domain pricing tests passed.");
