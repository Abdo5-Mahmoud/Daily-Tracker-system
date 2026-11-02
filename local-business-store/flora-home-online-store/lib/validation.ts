import type { OrderInput, PaymentMethod, Selection } from "./types";

const allowedGovernorates = new Set(["Cairo", "Giza"]);
const arabicDigits = "٠١٢٣٤٥٦٧٨٩";
export const ORDER_FIELD_LIMITS = { customerName: 120, addressDetails: 1000, source: 100 } as const;

function normalizeDigits(value: string): string {
  return value.replace(/[٠-٩]/g, (digit) => String(arabicDigits.indexOf(digit)));
}

function textValue(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}

function integerValue(value: FormDataEntryValue | null): number {
  const parsed = Number(normalizeDigits(textValue(value)));
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : 0;
}

export function normalizeEgyptianPhone(value: string): string {
  const digits = normalizeDigits(value).replace(/\D/g, "");
  if (digits.startsWith("0020")) return `0${digits.slice(4)}`;
  if (digits.startsWith("20")) return `0${digits.slice(2)}`;
  return digits;
}

function isValidPhone(value: string): boolean {
  return /^01[0-25-9][0-9]{8}$/.test(value);
}

function validIdempotencyKey(value: string): boolean {
  return /^[a-zA-Z0-9_-]{16,100}$/.test(value);
}

export type ValidationErrorCode = "validation_error" | "payment_not_configured";

export type ParsedOrder =
  | { ok: true; input: Omit<OrderInput, "pricing">; proofImage: File | null; proofUpload: { uploadId: string; uploadToken: string; chunkCount: number; fileType: string } | null }
  | { ok: false; code: ValidationErrorCode; message: string };

export type ValidationOptions = {
  instaPayConfigured: boolean;
  instaPayProofRequired: boolean;
};

function invalid(message: string, code: ValidationErrorCode = "validation_error"): ParsedOrder {
  return { ok: false, code, message };
}

export function parseOrderFormData(
  formData: FormData,
  options: ValidationOptions = { instaPayConfigured: true, instaPayProofRequired: false },
): ParsedOrder {
  const idempotencyKey = textValue(formData.get("idempotencyKey"));
  const customerName = textValue(formData.get("customerName"));
  const phonePrimary = normalizeEgyptianPhone(textValue(formData.get("phonePrimary")));
  const phoneSecondary = normalizeEgyptianPhone(textValue(formData.get("phoneSecondary")));
  const governorate = textValue(formData.get("governorate"));
  const addressDetails = textValue(formData.get("addressDetails"));
  const paymentMethod = textValue(formData.get("paymentMethod")) as PaymentMethod;
  const paymentReference = normalizeDigits(textValue(formData.get("paymentReference")));
  const source = textValue(formData.get("source")) || "direct";
  const honeypot = textValue(formData.get("website"));
  const proofUploadId = textValue(formData.get("proofUploadId"));
  const proofUploadToken = textValue(formData.get("proofUploadToken"));
  const proofUploadChunkCount = integerValue(formData.get("proofUploadChunkCount"));
  const proofUploadFileType = textValue(formData.get("proofUploadFileType"));

  const selection: Selection = {
    bubble: integerValue(formData.get("bubbleQty")),
    diamond: integerValue(formData.get("diamondQty")),
    fluted: integerValue(formData.get("flutedQty")),
  };

  if (honeypot) return invalid("بيانات الإرسال غير صالحة. حاول مرة أخرى.");
  if (!validIdempotencyKey(idempotencyKey)) return invalid("بيانات الإرسال غير صالحة. حاول مرة أخرى.");
  if (customerName.length < 3) return invalid("اكتب الاسم بالكامل.");
  if (customerName.length > ORDER_FIELD_LIMITS.customerName) return invalid("الاسم أطول من الحد المسموح.");
  if (!isValidPhone(phonePrimary)) return invalid("اكتب رقم موبايل مصري صحيح.");
  if (phoneSecondary && !isValidPhone(phoneSecondary)) return invalid("رقم الموبايل البديل غير صحيح.");
  if (!allowedGovernorates.has(governorate)) return invalid("الشحن متاح حاليًا للقاهرة والجيزة فقط.");
  if (addressDetails.length < 10) return invalid("اكتب العنوان بالتفصيل مع أقرب علامة مميزة.");
  if (addressDetails.length > ORDER_FIELD_LIMITS.addressDetails) return invalid("العنوان أطول من الحد المسموح.");
  if (source.length > ORDER_FIELD_LIMITS.source) return invalid("مصدر الزيارة غير صالح.");
  if (paymentMethod !== "COD" && paymentMethod !== "InstaPay") return invalid("اختار طريقة دفع صحيحة.");
  if (paymentMethod === "InstaPay" && !options.instaPayConfigured) {
    return invalid("الدفع المسبق غير متاح حاليًا.", "payment_not_configured");
  }
  if (paymentMethod === "InstaPay" && !/^\d{4}$/.test(paymentReference)) return invalid("اكتب آخر أربعة أرقام من مرجع التحويل.");
  if (Object.values(selection).every((quantity) => quantity === 0)) return invalid("اختار قطعة واحدة على الأقل.");

  const proofEntry = formData.get("proofImage");
  const proofImage = proofEntry instanceof File && proofEntry.size > 0 ? proofEntry : null;
  const hasProofUploadFields = Boolean(proofUploadId || proofUploadToken || formData.get("proofUploadChunkCount") || proofUploadFileType);
  const validProofUpload = /^[a-f0-9-]{36}$/i.test(proofUploadId)
    && /^[a-zA-Z0-9_-]{32,100}$/.test(proofUploadToken)
    && proofUploadChunkCount >= 1 && proofUploadChunkCount <= 5
    && /^image\/[a-z0-9.+-]+$/i.test(proofUploadFileType);
  if (hasProofUploadFields && !validProofUpload) return invalid("جلسة رفع صورة التحويل غير صالحة.");
  if (proofImage && validProofUpload) return invalid("ارفع صورة التحويل مرة واحدة فقط.");
  if (validProofUpload && paymentMethod !== "InstaPay") return invalid("صورة التحويل لا تتوافق مع طريقة الدفع.");
  if (proofImage && (!/^image\/[a-z0-9.+-]+$/i.test(proofImage.type) || proofImage.size > 5 * 1024 * 1024)) {
    return invalid("صورة التحويل يجب أن تكون صورة وألا تتجاوز خمسة ميجابايت.");
  }
  if (paymentMethod === "InstaPay" && options.instaPayProofRequired && !proofImage && !validProofUpload) {
    return invalid("ارفع صورة التحويل لإكمال الدفع المسبق.");
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
    proofUpload: validProofUpload
      ? { uploadId: proofUploadId, uploadToken: proofUploadToken, chunkCount: proofUploadChunkCount, fileType: proofUploadFileType }
      : null,
  };
}
