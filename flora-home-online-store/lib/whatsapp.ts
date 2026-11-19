import { normalizeWhatsappNumber } from "./store-config";
import type { PaymentMethod } from "./types";

type OrderLinkDetails = {
  orderId: string;
  paymentMethod: PaymentMethod;
  total: number;
  shippingDeposit: number;
  codRemaining: number;
};

function money(value: number): string {
  return new Intl.NumberFormat("ar-EG", { maximumFractionDigits: 0 }).format(value);
}

export function buildWhatsappOrderUrl(phone: string, details: OrderLinkDetails): string {
  const recipient = normalizeWhatsappNumber(phone);
  if (!recipient) return "";

  const paymentLine = details.paymentMethod === "COD"
    ? `عربون الشحن: ${money(details.shippingDeposit)} جنيه`
    : `المبلغ المحول بالكامل: ${money(details.total)} جنيه`;
  const remainingLine = details.paymentMethod === "COD"
    ? `المتبقي عند التسليم: ${money(details.codRemaining)} جنيه`
    : "لا يوجد مبلغ متبقٍ عند التسليم";
  const message = [
    "مرحبًا فلورا هوم،",
    `أرغب في تأكيد الحجز رقم ${details.orderId}.`,
    paymentLine,
    remainingLine,
    "سأرسل صورة التحويل وبيانات الراسل هنا للمطابقة.",
  ].join("\n");

  return `https://wa.me/${recipient}?text=${encodeURIComponent(message)}`;
}
