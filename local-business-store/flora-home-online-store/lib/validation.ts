import type { OrderInput, PaymentMethod, Selection } from "./types";

const allowedGovernorates = new Set(["Cairo", "Giza"]);
const arabicDigits = "٠١٢٣٤٥٦٧٨٩";

function normalizeDigits(value: string): string {
  return value.replace(/[٠-٩]/g, (digit) => String(arabicDigits.indexOf(digit)));
}

function textValue(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}

function integerValue(value: FormDataEntryValue | null): number {
  const parsed = Number.parseInt(normalizeDigits(textValue(value)), 10);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : 0;
}

function isValidPhone(value: string): boolean {
  return /^01[0-25-9][0-9]{8}$/.test(value);
}

function validIdempotencyKey(value: string): boolean {
  return /^[a-zA-Z0-9_-]{16,100}$/.test(value);
}

export type ParsedOrder =
  | { ok: true; input: Omit<OrderInput, "pricing">; proofImage: File | null }
  | { ok: false; message: string };

export function parseOrderFormData(formData: FormData): ParsedOrder {
  const idempotencyKey = textValue(formData.get("idempotencyKey"));
  const customerName = textValue(formData.get("customerName"));
  const phonePrimary = normalizeDigits(textValue(formData.get("phonePrimary")));
  const phoneSecondary = normalizeDigits(textValue(formData.get("phoneSecondary")));
  const governorate = textValue(formData.get("governorate"));
  const addressDetails = textValue(formData.get("addressDetails"));
  const paymentMethod = textValue(formData.get("paymentMethod")) as PaymentMethod;
  const paymentReference = normalizeDigits(textValue(formData.get("paymentReference")));
  const source = textValue(formData.get("source")) || "direct";

  const selection: Selection = {
    bubble: integerValue(formData.get("bubbleQty")),
    diamond: integerValue(formData.get("diamondQty")),
    fluted: integerValue(formData.get("flutedQty")),
  };

  if (!validIdempotencyKey(idempotencyKey)) return { ok: false, message: "بيانات الإرسال غير صالحة. حاول مرة أخرى." };
  if (customerName.length < 3) return { ok: false, message: "اكتب الاسم بالكامل." };
  if (!isValidPhone(phonePrimary)) return { ok: false, message: "اكتب رقم موبايل مصري صحيح." };
  if (phoneSecondary && !isValidPhone(phoneSecondary)) return { ok: false, message: "رقم الموبايل البديل غير صحيح." };
  if (!allowedGovernorates.has(governorate)) return { ok: false, message: "الشحن متاح حاليًا للقاهرة والجيزة فقط." };
  if (addressDetails.length < 10) return { ok: false, message: "اكتب العنوان بالتفصيل مع أقرب علامة مميزة." };
  if (paymentMethod !== "COD" && paymentMethod !== "InstaPay") return { ok: false, message: "اختار طريقة دفع صحيحة." };
  if (paymentMethod === "InstaPay" && !/^\d{4}$/.test(paymentReference)) return { ok: false, message: "اكتب آخر أربعة أرقام من مرجع التحويل." };
  if (Object.values(selection).every((quantity) => quantity === 0)) return { ok: false, message: "اختار قطعة واحدة على الأقل." };

  const proofEntry = formData.get("proofImage");
  const proofImage = proofEntry instanceof File && proofEntry.size > 0 ? proofEntry : null;
  if (proofImage && (!proofImage.type.startsWith("image/") || proofImage.size > 5 * 1024 * 1024)) {
    return { ok: false, message: "صورة التحويل يجب أن تكون صورة وألا تتجاوز خمسة ميجابايت." };
  }

  return {
    ok: true,
    input: {
      idempotencyKey,
      customerName,
      phonePrimary,
      phoneSecondary,
      governorate: governorate as "Cairo" | "Giza",
      addressDetails,
      selection,
      paymentMethod,
      paymentReference,
      source,
    },
    proofImage,
  };
}
