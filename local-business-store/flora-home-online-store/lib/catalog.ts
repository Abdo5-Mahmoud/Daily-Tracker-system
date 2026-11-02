import { fetchDirectInventory } from "./gateway";
import { getStoreSettings } from "./store-config";
import type { Catalog, CatalogVariant, PricingConfig, VariantId } from "./types";

const variantDefinitions: Omit<CatalogVariant, "directStock" | "availableStock" | "amazonInbound">[] = [
  { id: "bubble", label: "بابلز", description: "فازة بيضاء بنقشة دائرية ناعمة.", asin: "B0HNFBPLGG", image: "/products/bubble/hero.jpg", lifestyleImage: "/products/bubble/lifestyle.jpg", dimensionsImage: "/products/bubble/dimensions.png" },
  { id: "diamond", label: "ألماس", description: "فازة بيضاء بملمس هندسي بارز.", asin: "B0HNFC2MDD", image: "/products/diamond/hero.jpg", lifestyleImage: "/products/diamond/lifestyle.jpg", dimensionsImage: "/products/diamond/dimensions.png" },
  { id: "fluted", label: "مضلع", description: "فازة بيضاء بخطوط طولية واضحة.", asin: "B0HNF8SBZ7", image: "/products/fluted/hero.jpg", lifestyleImage: "/products/fluted/lifestyle.jpg", dimensionsImage: "/products/fluted/dimensions.png" },
];

function numberEnv(name: string, fallback: number): number {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value >= 0 ? value : fallback;
}

function localInventory(): Record<VariantId, { directStock: number; availableStock: number; amazonInbound: number }> {
  const safetyStock = numberEnv("D2C_SAFETY_STOCK", 2);
  const stock = (name: string, inbound: number) => {
    const directStock = numberEnv(name, 0);
    return { directStock, availableStock: Math.max(0, directStock - safetyStock), amazonInbound: inbound };
  };

  return {
    bubble: stock("D2C_STOCK_BUBBLE", 8),
    diamond: stock("D2C_STOCK_DIAMOND", 7),
    fluted: stock("D2C_STOCK_FLUTED", 4),
  };
}

function emptyInventory(): Record<VariantId, { directStock: number; availableStock: number; amazonInbound: number }> {
  return {
    bubble: { directStock: 0, availableStock: 0, amazonInbound: 0 },
    diamond: { directStock: 0, availableStock: 0, amazonInbound: 0 },
    fluted: { directStock: 0, availableStock: 0, amazonInbound: 0 },
  };
}

function isCompleteInventory(value: unknown): value is Record<VariantId, { directStock: number; availableStock: number; amazonInbound: number }> {
  if (!value || typeof value !== "object") return false;
  return variantDefinitions.every(({ id }) => {
    const item = (value as Record<string, unknown>)[id];
    if (!item || typeof item !== "object") return false;
    const record = item as Record<string, unknown>;
    return ["directStock", "availableStock", "amazonInbound"].every((key) => typeof record[key] === "number" && Number.isFinite(record[key]));
  });
}

function pricingConfig(): PricingConfig {
  return {
    approved: process.env.PRICING_APPROVED === "true",
    singlePrice: numberEnv("D2C_SINGLE_PRICE", 219),
    twoPrice: numberEnv("D2C_TWO_PRICE", 399),
    threePrice: numberEnv("D2C_THREE_PRICE", 549),
    additionalUnitPrice: numberEnv("D2C_ADDITIONAL_UNIT_PRICE", 183),
    shippingFee: numberEnv("D2C_SHIPPING_FEE", 60),
    prepaidDiscount: numberEnv("D2C_PREPAID_DISCOUNT", 30),
    freeShippingThreshold: Math.max(1, numberEnv("D2C_FREE_SHIPPING_THRESHOLD", 3)),
  };
}

export async function getCatalog(): Promise<Catalog> {
  let inventory = localInventory();
  let inventoryStatus: Catalog["inventoryStatus"] = "local";

  if (process.env.APPS_SCRIPT_GATEWAY_URL && process.env.APPS_SCRIPT_SHARED_SECRET) {
    try {
      const remoteInventory = await fetchDirectInventory();
      if (!isCompleteInventory(remoteInventory)) throw new Error("Incomplete inventory response.");
      inventory = remoteInventory;
      inventoryStatus = "live";
    } catch {
      inventory = emptyInventory();
      inventoryStatus = "unavailable";
    }
  } else if (process.env.NODE_ENV === "production") {
    inventory = emptyInventory();
    inventoryStatus = "unavailable";
  }

  return {
    productName: "تنسيق ليليام جاهز للعرض",
    brandName: "Flora Home",
    priceSource: process.env.PRICING_APPROVED === "true" ? "approved" : "draft",
    pricing: pricingConfig(),
    settings: getStoreSettings(),
    inventoryStatus,
    variants: variantDefinitions.map((definition) => ({ ...definition, ...inventory[definition.id] })),
    amazonLinkEnabled: process.env.NEXT_PUBLIC_AMAZON_LINK_ENABLED === "true" && Boolean(process.env.NEXT_PUBLIC_AMAZON_URL),
    amazonUrl: process.env.NEXT_PUBLIC_AMAZON_URL || "",
  };
}
