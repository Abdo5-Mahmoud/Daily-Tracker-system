import assert from "node:assert/strict";
import { MAX_ORDER_BODY_BYTES, RequestBodyTooLargeError, readBoundedFormData } from "../lib/request-body";

async function run(): Promise<void> {
  const form = new FormData();
  form.set("customerName", "عبدالله");
  const encoded = new Request("https://store.test/orders", { method: "POST", body: form });
  const headers = new Headers(encoded.headers);
  headers.delete("content-length");
  const requestWithoutLength = new Request(encoded.url, {
    method: "POST",
    headers,
    body: encoded.body,
    duplex: "half",
  } as RequestInit);
  assert.equal(requestWithoutLength.headers.has("content-length"), false);
  const parsed = await readBoundedFormData(requestWithoutLength);
  assert.equal(parsed.get("customerName"), "عبدالله");

  const checkoutForm = new FormData();
  checkoutForm.set("addressDetails", "شارع تجريبي بجوار علامة واضحة");
  checkoutForm.set("bubbleQty", "1");
  const encodedCheckout = new Request("https://store.test/orders", { method: "POST", body: checkoutForm });
  const parsedCheckout = await readBoundedFormData(encodedCheckout);
  assert.equal(parsedCheckout.get("addressDetails"), "شارع تجريبي بجوار علامة واضحة");

  const tooLarge = new Request("https://store.test/orders", {
    method: "POST",
    headers: { "content-type": "application/octet-stream" },
    body: new Uint8Array(MAX_ORDER_BODY_BYTES + 1),
  });
  assert.equal(tooLarge.headers.has("content-length"), false);
  await assert.rejects(() => readBoundedFormData(tooLarge), RequestBodyTooLargeError);

  const declaredTooLarge = new Request("https://store.test/orders", {
    method: "POST",
    headers: { "content-type": "application/octet-stream", "content-length": String(MAX_ORDER_BODY_BYTES + 1) },
    body: "small",
  });
  await assert.rejects(() => readBoundedFormData(declaredTooLarge), RequestBodyTooLargeError);
}

void run().then(() => console.log("Request-body tests passed."));
