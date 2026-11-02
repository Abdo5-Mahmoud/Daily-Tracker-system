export type VariantId = "bubble" | "diamond" | "fluted";

export type PaymentMethod = "COD" | "InstaPay";

export type OrderStatus =
  | "New"
  | "New - Check InstaPay"
  | "Confirmed"
  | "Shipped"
  | "Delivered"
  | "Cancelled"
  | "Expired";

export type Selection = Record<VariantId, number>;

export type CatalogVariant = {
  id: VariantId;
  label: string;
  description: string;
  asin: string;
  image: string;
  lifestyleImage: string;
  dimensionsImage: string;
  directStock: number;
  availableStock: number;
  amazonInbound: number;
};

export type PricingConfig = {
  approved: boolean;
  singlePrice: number;
  twoPrice: number;
  threePrice: number;
  additionalUnitPrice: number;
  shippingFee: number;
  prepaidDiscount: number;
  freeShippingThreshold: number;
};

export type StoreSettings = {
  instaPayIdentifier: string;
  instaPayRecipient: string;
  supportWhatsapp: string;
  deliveryEstimate: string;
  instaPayProofRequired: boolean;
  instaPayConfigured: boolean;
};

export type Catalog = {
  productName: string;
  brandName: string;
  priceSource: "draft" | "approved";
  pricing: PricingConfig;
  settings: StoreSettings;
  inventoryStatus: "live" | "local" | "unavailable";
  variants: CatalogVariant[];
  amazonLinkEnabled: boolean;
  amazonUrl: string;
};

export type PriceBreakdown = {
  totalUnits: number;
  bundleLabel: string;
  productSubtotal: number;
  shipping: number;
  prepaidDiscount: number;
  total: number;
};

export type OrderInput = {
  idempotencyKey: string;
  customerName: string;
  phonePrimary: string;
  phoneSecondary: string;
  governorate: "Cairo" | "Giza";
  addressDetails: string;
  selection: Selection;
  paymentMethod: PaymentMethod;
  paymentReference: string;
  source: string;
  pricing: PriceBreakdown;
};

export type GatewayOrderResult = {
  orderId: string;
  status: OrderStatus;
  pricing: PriceBreakdown;
};
