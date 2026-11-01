import type { GatewayOrderResult, OrderInput } from "./types";

function orderCaption(order: OrderInput, result: GatewayOrderResult): string {
  return [
    `طلب جديد ${result.orderId}`,
    `الاسم: ${order.customerName}`,
    `الهاتف: ${order.phonePrimary}`,
    `المحافظة: ${order.governorate}`,
    `الإجمالي: ${result.pricing.total} جنيه`,
    `الدفع: ${order.paymentMethod}`,
    `الحالة: ${result.status}`,
  ].join("\n");
}

export async function notifyTelegram(order: OrderInput, result: GatewayOrderResult, proofImage: File | null): Promise<string> {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = process.env.TELEGRAM_CHAT_ID?.trim();
  if (!token || !chatId) return "not_configured";

  const baseUrl = `https://api.telegram.org/bot${token}`;
  const caption = orderCaption(order, result);

  if (proofImage) {
    const photoForm = new FormData();
    photoForm.append("chat_id", chatId);
    photoForm.append("caption", caption);
    photoForm.append("photo", proofImage, proofImage.name || "payment-proof.jpg");
    const photoResponse = await fetch(`${baseUrl}/sendPhoto`, { method: "POST", body: photoForm });
    if (photoResponse.ok) return "sent";
  }

  const messageResponse = await fetch(`${baseUrl}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text: caption }),
  });

  return messageResponse.ok ? "fallback_sent" : "failed";
}
