import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const orderHeaders = [
  "Order_ID", "Timestamp", "Status", "Customer_Name", "Phone_Primary", "Phone_Secondary",
  "Governorate", "Address_Details", "Shape_A_Qty", "Shape_B_Qty", "Shape_C_Qty", "Bundle_Tier",
  "Payment_Method", "Product_Subtotal_EGP", "Shipping_EGP", "Shipping_Deposit_EGP", "COD_Remaining_EGP", "Total_EGP",
  "Deposit_Sender", "Deposit_Reference_Last4", "Deposit_Verified_At", "Deposit_Verified_By", "Notes_Ref", "Idempotency_Key",
  "Reservation_Expires_At", "Confirmed_At", "Updated_At", "Notification_Status", "Attribution_Source",
  "Notification_Queued_At", "Notification_Attempts", "Notification_Next_Attempt_At", "Notification_Claim_Expires_At", "Notification_Last_Error",
];
const inventoryHeaders = ["Shape_ID", "Direct_Stock", "Reserved_Qty", "Available_Qty", "Safety_Stock", "Amazon_Inbound_Qty"];
const settingsHeaders = ["Key", "Value", "Description", "Updated_At"];

class FakeRange {
  constructor(sheet, row, column, rows = 1, columns = 1) { Object.assign(this, { sheet, row, column, rows, columns }); }
  getValues() {
    return Array.from({ length: this.rows }, (_, rowOffset) =>
      Array.from({ length: this.columns }, (_, columnOffset) =>
        this.sheet.rows[this.row - 1 + rowOffset]?.[this.column - 1 + columnOffset] ?? ""));
  }
  setValues(values) {
    values.forEach((rowValues, rowOffset) => rowValues.forEach((value, columnOffset) => {
      this.sheet.ensureCell(this.row - 1 + rowOffset, this.column - 1 + columnOffset);
      this.sheet.rows[this.row - 1 + rowOffset][this.column - 1 + columnOffset] = value;
    }));
  }
  getValue() { return this.getValues()[0][0]; }
  setValue(value) { this.setValues([[value]]); }
}

class FakeSheet {
  constructor(rows = []) { this.rows = rows.map((row) => [...row]); }
  ensureCell(row, column) {
    while (this.rows.length <= row) this.rows.push([]);
    while (this.rows[row].length <= column) this.rows[row].push("");
  }
  getLastRow() { return this.rows.length; }
  getLastColumn() { return Math.max(0, ...this.rows.map((row) => row.reduce((last, value, index) => value !== "" && value != null ? index + 1 : last, 0))); }
  getRange(row, column, rows = 1, columns = 1) { return new FakeRange(this, row, column, rows, columns); }
  getDataRange() { return this.getRange(1, 1, Math.max(1, this.getLastRow()), Math.max(1, this.getLastColumn())); }
  appendRow(row) { this.rows.push([...row]); }
}

function defaultSettings() {
  return [
    settingsHeaders,
    ["store_enabled", "true", "تشغيل استقبال الطلبات", ""],
    ["pricing_approved", "true", "اعتماد الأسعار", ""],
    ["single_price", "219", "سعر القطعة الواحدة", ""],
    ["two_price", "399", "سعر قطعتين", ""],
    ["three_price", "549", "سعر ثلاث قطع", ""],
    ["additional_unit_price", "183", "سعر القطعة الإضافية", ""],
    ["shipping_fee", "60", "قيمة الشحن", ""],
    ["prepaid_discount", "30", "خصم التحويل الكامل", ""],
    ["free_shipping_threshold", "3", "حد الشحن المجاني", ""],
    ["safety_stock", "2", "مخزون الأمان", ""],
    ["instapay_identifier", "flora@instapay", "معرف التحويل", ""],
    ["instapay_recipient", "Flora Home", "اسم المستلم", ""],
    ["support_whatsapp", "201012345678", "رقم واتساب الدعم", ""],
    ["delivery_estimate", "خلال يومين إلى ثلاثة أيام", "مدة التوصيل", ""],
    ["site_paused_message", "الطلبات متوقفة مؤقتًا.", "رسالة إيقاف الموقع", ""],
  ];
}

function createEnvironment({ orderRows = [], inventoryRows, settingsRows = defaultSettings(), telegramResponseCode = 200 } = {}) {
  const orders = new FakeSheet([orderHeaders, ...orderRows]);
  const inventory = new FakeSheet([inventoryHeaders, ...(inventoryRows || [
    ["bubble", 20, 0, 0, 2, 19],
    ["diamond", 10, 0, 0, 2, 0],
    ["fluted", 10, 0, 0, 2, 0],
  ])]);
  const settings = new FakeSheet(settingsRows);
  const sheets = { Orders: orders, Inventory: inventory, Settings: settings };
  const spreadsheet = {
    getSheetByName(name) { return sheets[name] || null; },
    insertSheet(name) { sheets[name] = new FakeSheet(); return sheets[name]; },
  };
  let uuid = 0;
  const properties = new Map([["SPREADSHEET_ID", "test-spreadsheet"], ["SHARED_SECRET", "test-secret"], ["TELEGRAM_BOT_TOKEN", "test-token"], ["TELEGRAM_CHAT_ID", "test-chat"]]);
  const cache = new Map();
  const context = {
    console, Date, Math, JSON, Object, Array, String, Number, Error, isNaN,
    PropertiesService: { getScriptProperties: () => ({ getProperty: (key) => properties.get(key) || null }) },
    CacheService: { getScriptCache: () => ({ get: (key) => cache.get(key) || null, put: (key, value) => cache.set(key, value), remove: (key) => cache.delete(key) }) },
    SpreadsheetApp: { openById: () => spreadsheet },
    LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
    Session: { getScriptTimeZone: () => "UTC" },
    Utilities: {
      formatDate(date) { const iso = date.toISOString().replace(/[-:]/g, ""); return `${iso.slice(0, 8)}-${iso.slice(9, 15)}`; },
      getUuid: () => `00000000-0000-0000-0000-${String(++uuid).padStart(12, "0")}`,
    },
    UrlFetchApp: { fetch: () => ({ getResponseCode: () => telegramResponseCode, getContentText: () => JSON.stringify({ ok: telegramResponseCode === 200 }) }) },
    ScriptApp: { getProjectTriggers: () => [], newTrigger: () => ({ timeBased: () => ({ everyMinutes: () => ({ create() {} }) }) }) },
    ContentService: { MimeType: { JSON: "application/json" }, createTextOutput: (value) => ({ value, setMimeType() { return this; } }) },
  };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(__dirname, "apps-script", "Code.gs"), "utf8"), context);
  return { context, orders, inventory, settings, properties };
}

function validOrder(key = "idempotency-key-0001") {
  return {
    idempotencyKey: key,
    customerName: "عبدالله",
    phonePrimary: "01234567890",
    phoneSecondary: "",
    governorate: "Cairo",
    addressDetails: "شارع تجريبي بجوار علامة واضحة",
    selection: { bubble: 1, diamond: 0, fluted: 0 },
    pricing: { bundleLabel: "مزيف", total: 1 },
    paymentMethod: "COD",
    paymentReference: "",
    source: "direct",
  };
}

function testSettingsAndCatalog() {
  const { context, inventory } = createEnvironment();
  const first = context.getCatalogAction_();
  const second = context.getCatalogAction_();
  assert.equal(first.settings.storeEnabled, true);
  assert.equal(first.pricing.singlePrice, 219);
  assert.equal(first.inventory.bubble.availableStock, 18);
  assert.equal(first.inventory.bubble.amazonInbound, 19);
  assert.equal(JSON.stringify(second), JSON.stringify(first));
  assert.equal(inventory.rows[1][inventoryHeaders.indexOf("Reserved_Qty")], 0);
}

function testServerPricingAndDeposit() {
  const { context, orders } = createEnvironment();
  const saved = context.reserveOrder_(validOrder(), true);
  const headers = orders.rows[0];
  const row = orders.rows[1];
  assert.equal(saved.status, "Awaiting_Deposit");
  assert.equal(saved.pricing.total, 279);
  assert.equal(saved.pricing.shippingDeposit, 60);
  assert.equal(saved.pricing.codRemaining, 219);
  assert.equal(row[headers.indexOf("Shipping_Deposit_EGP")], 60);
  assert.equal(row[headers.indexOf("COD_Remaining_EGP")], 219);
}

function testIdempotencyAndFormulaSafeText() {
  const { context, orders } = createEnvironment();
  const order = validOrder();
  order.customerName = "=HYPERLINK(\"https://bad.test\")";
  order.addressDetails = "+SUM(1,1) عنوان طويل للاختبار";
  order.source = "@SUM(1,1)";
  const first = context.reserveOrder_(order, true);
  const rowCount = orders.rows.length;
  const second = context.reserveOrder_(order, true);
  const headers = orders.rows[0];
  const row = orders.rows[rowCount - 1];
  assert.equal(second.duplicate, true);
  assert.equal(second.orderId, first.orderId);
  assert.equal(second.paymentMethod, "COD");
  assert.equal(orders.rows.length, rowCount);
  assert.equal(row[headers.indexOf("Customer_Name")], "'=HYPERLINK(\"https://bad.test\")");
  assert.equal(row[headers.indexOf("Address_Details")], "'+SUM(1,1) عنوان طويل للاختبار");
  assert.equal(row[headers.indexOf("Attribution_Source")], "'@SUM(1,1)");
}

function testExpiryPreservesConfirmedOrders() {
  const { context, orders } = createEnvironment();
  const past = new Date(Date.now() - 25 * 60 * 60 * 1000);
  const saved = context.reserveOrder_(validOrder("expiry-key-0001"), true);
  const headers = orders.rows[0];
  const row = orders.rows[1];
  row[headers.indexOf("Reservation_Expires_At")] = past;
  context.readInventory_();
  assert.equal(row[headers.indexOf("Status")], "Expired");
  row[headers.indexOf("Status")] = "Confirmed";
  row[headers.indexOf("Reservation_Expires_At")] = past;
  context.readInventory_();
  assert.equal(row[headers.indexOf("Status")], "Confirmed");
  assert.equal(saved.orderId.startsWith("ART-"), true);
}

function testUnknownHeadersFailWithoutMutation() {
  const { context, orders } = createEnvironment();
  [orders.rows[0][0], orders.rows[0][1]] = [orders.rows[0][1], orders.rows[0][0]];
  const before = JSON.stringify(orders.rows);
  assert.throws(() => context.readInventory_(), /append-only schema/);
  assert.equal(JSON.stringify(orders.rows), before);
}

function testDisabledStoreAndUnapprovedPricing() {
  const disabled = createEnvironment();
  disabled.settings.rows[1][1] = "false";
  assert.throws(() => disabled.context.reserveOrder_(validOrder("disabled-key-0001"), true), (error) => error.code === "STORE_DISABLED");

  const unapproved = createEnvironment();
  unapproved.settings.rows[2][1] = "false";
  assert.throws(() => unapproved.context.reserveOrder_(validOrder("unapproved-key-0001"), true), (error) => error.code === "PRICING_NOT_APPROVED");
}

function testDepositPaymentConfiguration() {
  const unavailable = createEnvironment();
  unavailable.settings.rows[11][1] = "";
  unavailable.settings.rows[12][1] = "";
  assert.throws(
    () => unavailable.context.reserveOrder_(validOrder("payment-config-key-0001"), true),
    (error) => error.code === "PAYMENT_NOT_CONFIGURED",
  );
}

function testNotificationRetryDoesNotChangeOrderState() {
  const { context, orders } = createEnvironment({ telegramResponseCode: 500 });
  const saved = context.reserveOrder_(validOrder("notify-key-0001"), true);
  context.processNotificationQueue_();
  const headers = orders.rows[0];
  const row = orders.rows[1];
  assert.equal(row[headers.indexOf("Order_ID")], saved.orderId);
  assert.equal(row[headers.indexOf("Status")], "Awaiting_Deposit");
  assert.equal(row[headers.indexOf("Notification_Status")], "pending");
  assert.equal(row[headers.indexOf("Notification_Attempts")], 1);
}

testSettingsAndCatalog();
testServerPricingAndDeposit();
testIdempotencyAndFormulaSafeText();
testExpiryPreservesConfirmedOrders();
testUnknownHeadersFailWithoutMutation();
testDisabledStoreAndUnapprovedPricing();
testDepositPaymentConfiguration();
testNotificationRetryDoesNotChangeOrderState();
console.log("Apps Script operation tests passed.");
