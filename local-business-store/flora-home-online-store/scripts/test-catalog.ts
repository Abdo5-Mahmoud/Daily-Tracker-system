import assert from "node:assert/strict";
import { getCatalog } from "../lib/catalog";

async function run(): Promise<void> {
  const savedEnv = { ...process.env };
  const env = process.env as Record<string, string | undefined>;
  try {
    env.NODE_ENV = "production";
    delete env.APPS_SCRIPT_GATEWAY_URL;
    delete env.APPS_SCRIPT_SHARED_SECRET;
    env.D2C_STOCK_BUBBLE = "50";
    const productionPreview = await getCatalog();
    assert.equal(productionPreview.inventoryStatus, "unavailable");
    assert.equal(productionPreview.variants.every((variant) => variant.availableStock === 0 && variant.directStock === 0), true);

    env.NODE_ENV = "development";
    const localPreview = await getCatalog();
    assert.equal(localPreview.inventoryStatus, "local");
    assert.equal(localPreview.variants.find((variant) => variant.id === "bubble")?.directStock, 50);

    env.APPS_SCRIPT_GATEWAY_URL = "https://gateway.test";
    env.APPS_SCRIPT_SHARED_SECRET = "test-secret";
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => Response.json({
      ok: true,
      inventory: {
        bubble: { directStock: 4, availableStock: 3, amazonInbound: 19 },
        diamond: { directStock: 5, availableStock: 4, amazonInbound: 0 },
        fluted: { directStock: 6, availableStock: 5, amazonInbound: 2 },
      },
    });
    const liveCatalog = await getCatalog();
    globalThis.fetch = originalFetch;
    assert.equal(liveCatalog.inventoryStatus, "live");
    assert.equal(liveCatalog.variants.find((variant) => variant.id === "bubble")?.availableStock, 3);
    assert.equal(liveCatalog.variants.find((variant) => variant.id === "bubble")?.amazonInbound, 19);
  } finally {
    for (const key of Object.keys(process.env)) if (!(key in savedEnv)) delete process.env[key];
    Object.assign(process.env, savedEnv);
  }
}

void run().then(() => console.log("Catalog safety-gate tests passed."));
