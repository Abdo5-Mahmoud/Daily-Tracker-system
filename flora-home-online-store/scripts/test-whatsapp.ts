import assert from "node:assert/strict";
import { buildWhatsappOrderUrl } from "../lib/whatsapp";

const url = buildWhatsappOrderUrl("010 1234 5678", {
  orderId: "ART-20261119-120000-ABCD",
  paymentMethod: "COD",
  total: 279,
  shippingDeposit: 60,
  codRemaining: 219,
});

assert.match(url, /^https:\/\/wa\.me\/201012345678\?text=/);
const text = decodeURIComponent(url.split("?text=")[1]);
assert.match(text, /ART-20261119-120000-ABCD/);
assert.match(text, /عربون الشحن: ٦٠ جنيه/);
assert.match(text, /المتبقي عند التسليم: ٢١٩ جنيه/);

assert.equal(buildWhatsappOrderUrl("", {
  orderId: "ART-1",
  paymentMethod: "COD",
  total: 279,
  shippingDeposit: 60,
  codRemaining: 219,
}), "");

console.log("WhatsApp order-link tests passed.");
