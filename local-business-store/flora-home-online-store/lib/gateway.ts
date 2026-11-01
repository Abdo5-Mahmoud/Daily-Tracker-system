import type { GatewayOrderResult, OrderInput, Selection } from "./types";

export class GatewayError extends Error {
  constructor(
    message: string,
    public readonly code: "not_configured" | "out_of_stock" | "duplicate_order" | "remote_error",
  ) {
    super(message);
  }
}

type InventoryResponse = {
  ok: true;
  inventory: Record<keyof Selection, { directStock: number; availableStock: number; amazonInbound: number }>;
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
    const code = body.code === "OUT_OF_STOCK" ? "out_of_stock" : body.code === "DUPLICATE_ORDER" ? "duplicate_order" : "remote_error";
    throw new GatewayError(body.message || "Order gateway rejected the request.", code);
  }

  return body;
}

export async function reserveOrder(input: OrderInput): Promise<GatewayOrderResult> {
  return callGateway<GatewayOrderResult>("reserveOrder", { order: input });
}

export async function fetchDirectInventory(): Promise<InventoryResponse["inventory"]> {
  const response = await callGateway<InventoryResponse>("getInventory");
  return response.inventory;
}
