import { getCatalog } from "@/lib/catalog";
import { GatewayError, reserveOrder } from "@/lib/gateway";
import { calculatePricing } from "@/lib/pricing";
import { notifyTelegram } from "@/lib/telegram";
import { parseOrderFormData } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const formData = await request.formData();
  const parsed = parseOrderFormData(formData);

  if (!parsed.ok) return Response.json({ code: "validation_error", message: parsed.message }, { status: 400 });

  const catalog = await getCatalog();
  if (!catalog.pricing.approved) {
    return Response.json({ code: "pricing_not_approved", message: "الأسعار ما زالت تحت المراجعة." }, { status: 409 });
  }

  for (const variant of catalog.variants) {
    if (parsed.input.selection[variant.id] > variant.availableStock) {
      return Response.json({ code: "out_of_stock", message: `الكمية المطلوبة من نسخة ${variant.label} غير متاحة.` }, { status: 409 });
    }
  }

  const pricing = calculatePricing(parsed.input.selection, catalog.pricing, parsed.input.paymentMethod);
  const order = { ...parsed.input, pricing };

  try {
    const result = await reserveOrder(order);
    const notificationStatus = await notifyTelegram(order, result, parsed.proofImage);
    return Response.json({ ok: true, orderId: result.orderId, status: result.status, pricing: result.pricing, notificationStatus }, { status: 201 });
  } catch (error) {
    if (error instanceof GatewayError) {
      const status = error.code === "out_of_stock" || error.code === "duplicate_order" ? 409 : error.code === "not_configured" ? 503 : 502;
      const message = error.code === "not_configured" ? "نظام الطلبات لم يتم ربطه بعد." : error.code === "out_of_stock" ? "الكمية المطلوبة لم تعد متاحة." : error.message;
      return Response.json({ code: error.code, message }, { status });
    }

    return Response.json({ code: "internal_error", message: "حصل خطأ مؤقت. حاول مرة أخرى." }, { status: 500 });
  }
}
