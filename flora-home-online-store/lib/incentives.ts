import type { PricingConfig } from "./types";

const ordinals: Record<number, string> = {
  2: "ثانية",
  3: "ثالثة",
  4: "رابعة",
  5: "خامسة",
  6: "سادسة",
};

function ordinalFor(unitCount: number): string {
  return ordinals[unitCount] || "إضافية";
}

export function getIncentiveMessage(totalUnits: number, pricing: PricingConfig): string {
  if (totalUnits <= 0) return "✨ اختار فازتك المفضلة لمكتبك أو منزلك";
  if (totalUnits >= pricing.freeShippingThreshold) return "🎉 تهانينا! حصلت على الشحن المجاني بالكامل";

  const nextUnitCount = totalUnits + 1;
  if (nextUnitCount === pricing.freeShippingThreshold) {
    return `🚚 أضف قطعة ${ordinalFor(nextUnitCount)} واحصل على شحن مجاني بالكامل!`;
  }

  const twoPieceSavings = Math.max(0, pricing.singlePrice * 2 - pricing.twoPrice);
  if (totalUnits === 1 && twoPieceSavings > 0) {
    return `💡 أضف قطعة ثانية ووفر ${twoPieceSavings} ج.م في عرض القطعتين!`;
  }

  return `✨ أضف قطعة ${ordinalFor(nextUnitCount)} واستفد من العرض التالي`;
}
