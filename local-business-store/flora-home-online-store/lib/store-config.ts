import type { StoreSettings } from "./types";

function envValue(name: string): string {
  return process.env[name]?.trim() || "";
}

export function normalizeWhatsappNumber(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.startsWith("0020")) return digits.slice(2);
  if (digits.startsWith("20")) return digits;
  if (digits.startsWith("0")) return `20${digits.slice(1)}`;
  return digits;
}

export function getStoreSettings(): StoreSettings {
  const instaPayIdentifier = envValue("INSTAPAY_IDENTIFIER");
  const instaPayRecipient = envValue("INSTAPAY_RECIPIENT");

  return {
    instaPayIdentifier,
    instaPayRecipient,
    supportWhatsapp: normalizeWhatsappNumber(envValue("SUPPORT_WHATSAPP")),
    deliveryEstimate: envValue("DELIVERY_ESTIMATE"),
    instaPayProofRequired: process.env.INSTAPAY_PROOF_REQUIRED === "true",
    instaPayConfigured: Boolean(instaPayIdentifier && instaPayRecipient),
  };
}
