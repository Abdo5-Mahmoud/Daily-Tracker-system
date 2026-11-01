import type { PaymentMethod, PriceBreakdown, PricingConfig, Selection } from "./types";

export function calculatePricing(
  selection: Selection,
  pricing: PricingConfig,
  paymentMethod: PaymentMethod = "COD",
): PriceBreakdown {
  const totalUnits = Object.values(selection).reduce((sum, quantity) => sum + quantity, 0);

  if (totalUnits < 1) {
    return { totalUnits: 0, bundleLabel: "", productSubtotal: 0, shipping: 0, prepaidDiscount: 0, total: 0 };
  }

  const productSubtotal =
    totalUnits === 1
      ? pricing.singlePrice
      : totalUnits === 2
        ? pricing.twoPrice
        : pricing.threePrice + (totalUnits - 3) * pricing.additionalUnitPrice;

  const shipping = totalUnits >= pricing.freeShippingThreshold ? 0 : pricing.shippingFee;
  const prepaidDiscount = paymentMethod === "InstaPay" ? pricing.prepaidDiscount : 0;
  const total = Math.max(0, productSubtotal + shipping - prepaidDiscount);

  return {
    totalUnits,
    bundleLabel: totalUnits === 1 ? "قطعة واحدة" : totalUnits === 2 ? "عرض قطعتين" : "العرض البطل",
    productSubtotal,
    shipping,
    prepaidDiscount,
    total,
  };
}
