import assert from "node:assert/strict";
import { normalizeWhatsappNumber } from "../lib/store-config";
import { normalizeEgyptianPhone, parseOrderFormData } from "../lib/validation";

const options = { instaPayConfigured: true, instaPayProofRequired: false };

function validForm(): FormData {
  const form = new FormData();
  form.set("idempotencyKey", "validation-test-key-001");
  form.set("customerName", "عبدالله محمود");
  form.set("phonePrimary", "010 1234 5678");
  form.set("phoneSecondary", "");
  form.set("governorate", "Cairo");
  form.set("addressDetails", "شارع تجريبي بجوار علامة واضحة");
  form.set("paymentMethod", "COD");
  form.set("paymentReference", "");
  form.set("bubbleQty", "1");
  form.set("diamondQty", "0");
  form.set("flutedQty", "0");
  form.set("website", "");
  return form;
}

assert.equal(normalizeEgyptianPhone("+20 12 82798824"), "01282798824");
assert.equal(normalizeEgyptianPhone("0020-12-8279-8824"), "01282798824");
assert.equal(normalizeEgyptianPhone("٠١٢٨٢٧٩٨٨٢٤"), "٠١٢٨٢٧٩٨٨٢٤".replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit))));
assert.equal(normalizeWhatsappNumber("+20 12 82798824"), "201282798824");

const parsed = parseOrderFormData(validForm(), options);
assert.equal(parsed.ok, true);
if (parsed.ok) assert.equal(parsed.input.phonePrimary, "01012345678");

const invalidPhone = validForm();
invalidPhone.set("phonePrimary", "010 123");
assert.equal(parseOrderFormData(invalidPhone, options).ok, false);

const unsupportedGovernorate = validForm();
unsupportedGovernorate.set("governorate", "Alexandria");
assert.equal(parseOrderFormData(unsupportedGovernorate, options).ok, false);

const noSelection = validForm();
noSelection.set("bubbleQty", "0");
assert.equal(parseOrderFormData(noSelection, options).ok, false);

const instaPayWithoutReference = validForm();
instaPayWithoutReference.set("paymentMethod", "InstaPay");
assert.equal(parseOrderFormData(instaPayWithoutReference, options).ok, false);

const instaPayWithoutConfiguration = validForm();
instaPayWithoutConfiguration.set("paymentMethod", "InstaPay");
instaPayWithoutConfiguration.set("paymentReference", "1234");
const unavailablePayment = parseOrderFormData(instaPayWithoutConfiguration, { ...options, instaPayConfigured: false });
assert.equal(unavailablePayment.ok, false);
if (!unavailablePayment.ok) assert.equal(unavailablePayment.code, "payment_not_configured");

const honeypot = validForm();
honeypot.set("website", "bot-value");
assert.equal(parseOrderFormData(honeypot, options).ok, false);

const requiredProof = validForm();
requiredProof.set("paymentMethod", "InstaPay");
requiredProof.set("paymentReference", "1234");
assert.equal(parseOrderFormData(requiredProof, { ...options, instaPayProofRequired: true }).ok, false);

const optionalProof = validForm();
optionalProof.set("paymentMethod", "InstaPay");
optionalProof.set("paymentReference", "1234");
assert.equal(parseOrderFormData(optionalProof, options).ok, true);

console.log("Validation tests passed.");
