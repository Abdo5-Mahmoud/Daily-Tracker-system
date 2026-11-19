import type { GatewayOrderResult, OrderInput, PaymentMethod, RemoteCatalog, Selection } from "./types";

export class GatewayError extends Error {
  constructor(
    message: string,
    public readonly code: "not_configured" | "out_of_stock" | "duplicate_order" | "store_disabled" | "pricing_not_approved" | "payment_not_configured" | "remote_error",
  ) {
    super(message);
  }
}

type CatalogResponse = {
  ok: true;
  pricing: RemoteCatalog["pricing"];
  settings: RemoteCatalog["settings"];
  inventory: RemoteCatalog["inventory"];
};

type ExistingOrder = {
  orderId: string;
  status: GatewayOrderResult["status"];
  paymentMethod?: PaymentMethod;
  pricing?: GatewayOrderResult["pricing"];
};

function gatewayConfig(): { url: string; secret: string } | null {
  const url = process.env.APPS_SCRIPT_GATEWAY_URL?.trim();
  const secret = process.env.APPS_SCRIPT_SHARED_SECRET?.trim();
  return url && secret ? { url, secret } : null;
}

async function callGateway<T>(action: string, payload: Record<string, unknown> = {}): Promise<T> {
  const config = gatewayConfig();
  if (!config) throw new GatewayError("Order gateway is not configured.", "not_configured");

  const response = await fetch(config.url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    body: JSON.stringify({ action, secret: config.secret, ...payload }),
  });

  if (!response.ok) throw new GatewayError("Order gateway returned an error.", "remote_error");

  const body = (await response.json()) as { ok?: boolean; code?: string; message?: string } & T;
  if (!body.ok) {
    const code = body.code === "OUT_OF_STOCK"
      ? "out_of_stock"
      : body.code === "DUPLICATE_ORDER"
        ? "duplicate_order"
        : body.code === "STORE_DISABLED"
          ? "store_disabled"
          : body.code === "PRICING_NOT_APPROVED"
            ? "pricing_not_approved"
            : body.code === "PAYMENT_NOT_CONFIGURED"
              ? "payment_not_configured"
            : "remote_error";
    throw new GatewayError(body.message || "Order gateway rejected the request.", code);
  }

  return body;
}

export async function findOrderByIdempotencyKey(idempotencyKey: string): Promise<ExistingOrder | null> {
  const response = await callGateway<{ exists: boolean; orderId?: string; status?: GatewayOrderResult["status"]; paymentMethod?: PaymentMethod; pricing?: GatewayOrderResult["pricing"] }>("findOrder", { idempotencyKey });
  return response.exists && response.orderId && response.status
    ? { orderId: response.orderId, status: response.status, paymentMethod: response.paymentMethod, pricing: response.pricing }
    : null;
}

export async function reserveOrder(input: OrderInput): Promise<GatewayOrderResult> {
  return callGateway<GatewayOrderResult>("reserveOrder", {
    order: input,
    queueNotifications: true,
  });
}

export async function fetchStoreCatalog(): Promise<RemoteCatalog> {
  const response = await callGateway<CatalogResponse>("getCatalog");
  return {
    pricing: response.pricing,
    settings: response.settings,
    inventory: response.inventory,
  };
}

export function hasRequestedStock(selection: Selection, inventory: RemoteCatalog["inventory"]): boolean {
  return (Object.keys(selection) as Array<keyof Selection>).every((shape) => {
    const requested = selection[shape];
    return Number.isInteger(requested) && requested >= 0 && requested <= (inventory[shape]?.availableStock ?? 0);
  });
}
