import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const oldOrderHeaders = [
  "Order_ID", "Timestamp", "Status", "Customer_Name", "Phone_Primary", "Phone_Secondary",
  "Governorate", "Address_Details", "Shape_A_Qty", "Shape_B_Qty", "Shape_C_Qty", "Bundle_Tier",
  "Payment_Method", "Total_EGP", "Notes_Ref", "Idempotency_Key", "Reservation_Expires_At",
  "Confirmed_At", "Updated_At", "Notification_Status", "Attribution_Source",
];
const inventoryHeaders = ["Shape_ID", "Direct_Stock", "Reserved_Qty", "Available_Qty", "Safety_Stock", "Amazon_Inbound_Qty"];

class FakeRange {
  constructor(sheet, row, column, rows = 1, columns = 1) {
    Object.assign(this, { sheet, row, column, rows, columns });
  }
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

class FakeBlob {
  constructor(bytes, type = "application/octet-stream", name = "blob") {
    this.bytes = Buffer.from(bytes.map((byte) => byte < 0 ? byte + 256 : byte));
    this.type = type;
    this.name = name;
  }
  getBytes() { return Array.from(this.bytes, (byte) => byte > 127 ? byte - 256 : byte); }
  getName() { return this.name; }
  getContentType() { return this.type; }
}

class FakeFile {
  constructor(folder, id, blob, createdAt = new Date()) {
    Object.assign(this, { folder, id, blob, name: blob.getName(), createdAt, description: "", trashed: false });
  }
  getId() { return this.id; }
  getName() { return this.name; }
  getBlob() { return this.blob; }
  getDateCreated() { return this.createdAt; }
  getSharingAccess() { return this.folder.access; }
  getDescription() { return this.description; }
  setDescription(value) { this.description = value; return this; }
  setTrashed(value) { this.trashed = value; return this; }
  getParents() { return iterator([this.folder]); }
}

class FakeFolder {
  constructor(id = "private-folder", access = "PRIVATE") { Object.assign(this, { id, access, files: [] }); }
  getId() { return this.id; }
  getSharingAccess() { return this.access; }
  createFile(blob) {
    const file = new FakeFile(this, `file-${this.files.length + 1}`, blob);
    this.files.push(file);
    return file;
  }
  getFiles() { return iterator(this.files.filter((file) => !file.trashed)); }
  getFilesByName(name) { return iterator(this.files.filter((file) => !file.trashed && file.name === name)); }
}

function iterator(items) {
  let index = 0;
  return { hasNext: () => index < items.length, next: () => items[index++] };
}

function oldOrderRow({ id, status, bubble = 0, expiry = "", key = "" }) {
  const row = Array(oldOrderHeaders.length).fill("");
  row[oldOrderHeaders.indexOf("Order_ID")] = id;
  row[oldOrderHeaders.indexOf("Timestamp")] = new Date();
  row[oldOrderHeaders.indexOf("Status")] = status;
  row[oldOrderHeaders.indexOf("Shape_A_Qty")] = bubble;
  row[oldOrderHeaders.indexOf("Reservation_Expires_At")] = expiry;
  row[oldOrderHeaders.indexOf("Idempotency_Key")] = key;
  row[oldOrderHeaders.indexOf("Notification_Status")] = "pending";
  row[oldOrderHeaders.indexOf("Attribution_Source")] = "direct";
  return row;
}

function createEnvironment({ orderRows = [], folderAccess = "PRIVATE", telegramResponseCode = 200 } = {}) {
  const orders = new FakeSheet([oldOrderHeaders, ...orderRows]);
  const inventory = new FakeSheet([inventoryHeaders, ["bubble", 20, 0, 20, 0, 19], ["diamond", 10, 0, 10, 0, 0], ["fluted", 10, 0, 10, 0, 0]]);
  const spreadsheet = {
    getSheetByName(name) { return name === "Orders" ? orders : inventory; },
    insertSheet() { throw new Error("Unexpected sheet creation."); },
  };
  const folder = new FakeFolder("private-folder", folderAccess);
  let uuid = 0;
  const properties = new Map([
    ["SPREADSHEET_ID", "test-spreadsheet"],
    ["SHARED_SECRET", "test-secret"],
    ["PROOF_DRIVE_FOLDER_ID", folder.getId()],
    ["TELEGRAM_BOT_TOKEN", "test-token"],
    ["TELEGRAM_CHAT_ID", "test-chat"],
  ]);
  const cache = new Map();
  const context = {
    console,
    Date,
    Math,
    JSON,
    Object,
    Array,
    String,
    Number,
    Error,
    isNaN,
    PropertiesService: { getScriptProperties: () => ({ getProperty: (key) => properties.get(key) || null }) },
    CacheService: { getScriptCache: () => ({
      get: (key) => cache.get(key) || null,
      put: (key, value) => cache.set(key, value),
      remove: (key) => cache.delete(key),
    }) },
    SpreadsheetApp: { openById: () => spreadsheet },
    LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
    Session: { getScriptTimeZone: () => "UTC" },
    Utilities: {
      formatDate(date) {
        const iso = date.toISOString().replace(/[-:]/g, "");
        return `${iso.slice(0, 8)}-${iso.slice(9, 15)}`;
      },
      getUuid: () => `00000000-0000-0000-0000-${String(++uuid).padStart(12, "0")}`,
      base64Decode: (value) => Array.from(Buffer.from(value, "base64"), (byte) => byte > 127 ? byte - 256 : byte),
      newBlob: (bytes, type, name) => new FakeBlob(bytes, type, name),
    },
    DriveApp: {
      Access: { PRIVATE: "PRIVATE" },
      getFolderById: (id) => { if (id !== folder.getId()) throw new Error("Unknown folder."); return folder; },
      getFileById: (id) => {
        const file = folder.files.find((candidate) => candidate.id === id && !candidate.trashed);
        if (!file) throw new Error("Unknown file.");
        return file;
      },
    },
    UrlFetchApp: {
      fetch: () => ({ getResponseCode: () => telegramResponseCode, getContentText: () => JSON.stringify({ ok: telegramResponseCode === 200 }) }),
    },
    ScriptApp: { getProjectTriggers: () => [], newTrigger: () => ({ timeBased: () => ({ everyMinutes: () => ({ create() {} }) }) }) },
    ContentService: { MimeType: { JSON: "application/json" }, createTextOutput: (value) => ({ value, setMimeType() { return this; } }) },
  };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(__dirname, "apps-script", "Code.gs"), "utf8"), context);
  return { context, orders, inventory, folder, properties };
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
    pricing: { bundleLabel: "قطعة واحدة", total: 219 },
    paymentMethod: "COD",
    paymentReference: "",
    source: "direct",
  };
}

function testAppendOnlyMigrationAndInventoryExpiry() {
  const past = new Date(Date.now() - 25 * 60 * 60 * 1000);
  const { context, orders } = createEnvironment({ orderRows: [
    oldOrderRow({ id: "new", status: "New", bubble: 1, expiry: past }),
    oldOrderRow({ id: "instapay", status: "New - Check InstaPay", bubble: 1, expiry: past }),
    oldOrderRow({ id: "confirmed", status: "Confirmed", bubble: 1, expiry: past }),
    oldOrderRow({ id: "shipped", status: "Shipped", bubble: 1, expiry: past }),
    oldOrderRow({ id: "delivered", status: "Delivered", bubble: 1, expiry: past }),
    oldOrderRow({ id: "cancelled", status: "Cancelled", bubble: 1, expiry: past }),
    oldOrderRow({ id: "expired", status: "Expired", bubble: 1, expiry: past }),
  ] });
  const originalCustomer = orders.rows[1][3];
  const inventory = context.readInventory_();
  assert.equal(inventory.bubble.availableStock, 17);
  assert.equal(orders.rows[1][2], "Expired");
  assert.equal(orders.rows[2][2], "Expired");
  assert.equal(orders.rows[3][2], "Confirmed");
  assert.equal(orders.rows[1][3], originalCustomer);
  assert.equal(orders.rows[0].length, 28);
  assert.equal(orders.rows[0][20], "Attribution_Source");
  assert.equal(orders.rows[0][21], "Notification_Queued_At");
}

function testIdempotencyAndFormulaSafeText() {
  const { context, orders } = createEnvironment();
  const order = validOrder();
  order.customerName = "=HYPERLINK(\"https://bad.test\")";
  order.addressDetails = "+SUM(1,1) عنوان طويل للاختبار";
  order.source = "@SUM(1,1)";
  const first = context.reserveOrder_(order, "", true);
  const rowCount = orders.rows.length;
  const second = context.reserveOrder_(order, "", true);
  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
  assert.equal(second.duplicate, true);
  assert.equal(second.orderId, first.orderId);
  assert.equal(orders.rows.length, rowCount);
  const headers = orders.rows[0];
  const row = orders.rows[rowCount - 1];
  assert.equal(row[headers.indexOf("Customer_Name")], "'=HYPERLINK(\"https://bad.test\")");
  assert.equal(row[headers.indexOf("Address_Details")], "'+SUM(1,1) عنوان طويل للاختبار");
  assert.equal(row[headers.indexOf("Attribution_Source")], "'@SUM(1,1)");
  assert.equal(context.safeSheetText_("-1+1"), "'-1+1");
  assert.equal(context.findOrderAction_(order.idempotencyKey).orderId, first.orderId);
}

function testUnknownHeadersFailWithoutMutation() {
  const { context, orders } = createEnvironment();
  [orders.rows[0][0], orders.rows[0][1]] = [orders.rows[0][1], orders.rows[0][0]];
  const before = JSON.stringify(orders.rows);
  assert.throws(() => context.readInventory_(), /append-only schema/);
  assert.equal(JSON.stringify(orders.rows), before);
}

function testLegacyNotificationsAreIgnoredAndRetriesStopAfterFive() {
  const legacy = oldOrderRow({ id: "legacy", status: "New", bubble: 1 });
  const { context, orders } = createEnvironment({ orderRows: [legacy] });
  assert.equal(context.claimNotifications_().length, 0);
  context.reserveOrder_(validOrder(), "", true);
  let claim = context.claimNotifications_()[0];
  assert.equal(claim.attempt, 1);
  context.completeNotification_(claim, false, "TEST_FAIL");
  let headers = orders.rows[0];
  let row = orders.rows[orders.rows.length - 1];
  assert.equal(row[headers.indexOf("Notification_Status")], "pending");
  assert.ok(new Date(row[headers.indexOf("Notification_Next_Attempt_At")]).getTime() - Date.now() >= 14 * 60 * 1000);

  for (let attempt = 2; attempt <= 5; attempt += 1) {
    row[headers.indexOf("Notification_Next_Attempt_At")] = new Date(Date.now() - 1000);
    claim = context.claimNotifications_()[0];
    assert.equal(claim.attempt, attempt);
    context.completeNotification_(claim, false, "TEST_FAIL");
  }
  assert.equal(row[headers.indexOf("Notification_Status")], "failed");
  assert.equal(row[headers.indexOf("Notification_Next_Attempt_At")], "");
  assert.equal(orders.rows[1][headers.indexOf("Notification_Queued_At")] || "", "");
}

function testLegacyGatewayCallDoesNotEnterNewQueue() {
  const { context, orders } = createEnvironment();
  const legacyOrder = context.reserveOrder_(validOrder("legacy-client-key-0001"), "", false);
  const headers = orders.rows[0];
  const row = orders.rows[1];
  assert.equal(legacyOrder.ok, true);
  assert.equal(row[headers.indexOf("Notification_Status")], "pending");
  assert.equal(row[headers.indexOf("Notification_Queued_At")] || "", "");
  assert.equal(context.claimNotifications_().length, 0);
}

function testOrderCommitSurvivesTelegramFailure() {
  const { context, orders } = createEnvironment({ telegramResponseCode: 500 });
  const saved = context.reserveOrder_(validOrder(), "", true);
  assert.equal(saved.ok, true);
  context.processNotificationQueue_();
  const headers = orders.rows[0];
  const row = orders.rows[1];
  assert.equal(row[headers.indexOf("Order_ID")], saved.orderId);
  assert.equal(row[headers.indexOf("Status")], "New");
  assert.equal(row[headers.indexOf("Notification_Status")], "pending");
  assert.equal(row[headers.indexOf("Notification_Attempts")], 1);
  assert.ok(new Date(row[headers.indexOf("Notification_Next_Attempt_At")]).getTime() > Date.now());
}

function testOrderCommitRevokesProofCleanupToken() {
  const { context, folder, orders } = createEnvironment();
  const session = context.startProofUpload_();
  context.uploadProofChunk_({ uploadId: session.uploadId, uploadToken: session.uploadToken, index: 0, chunkCount: 1, data: "AQ==" });
  const finalized = context.finalizeProofUpload_({ uploadId: session.uploadId, uploadToken: session.uploadToken, chunkCount: 1, fileType: "image/jpeg" });
  const saved = context.reserveOrder_(validOrder("proof-token-order-key"), finalized.fileId, true, session.uploadId, session.uploadToken);
  const proof = folder.files.find((file) => file.id === finalized.fileId);
  const headers = orders.rows[0];
  assert.equal(saved.ok, true);
  assert.equal(orders.rows[1][headers.indexOf("Proof_File_ID")], finalized.fileId);
  assert.equal(proof.trashed, false);
  assert.throws(() => context.cleanupProofUpload_(session.uploadId, session.uploadToken), /session expired/);
}

function testPrivateProofUploadAtMaximumAndRetention() {
  const { context, folder } = createEnvironment();
  const chunkBytes = Buffer.alloc(1024 * 1024, 0x5a);
  const session = context.startProofUpload_();
  const uploadId = session.uploadId;
  assert.throws(() => context.uploadProofChunk_({ uploadId, uploadToken: "wrong-token", index: 0, chunkCount: 5, data: "AQ==" }), /token is invalid/);
  for (let index = 0; index < 5; index += 1) {
    const data = chunkBytes.toString("base64");
    assert.equal(context.uploadProofChunk_({ uploadId, uploadToken: session.uploadToken, index, chunkCount: 5, data }).ok, true);
    if (index === 0) {
      assert.equal(context.uploadProofChunk_({ uploadId, uploadToken: session.uploadToken, index, chunkCount: 5, data }).duplicate, true);
    }
  }
  const finalized = context.finalizeProofUpload_({ uploadId, uploadToken: session.uploadToken, chunkCount: 5, fileType: "image/jpeg" });
  const proof = folder.files.find((file) => file.id === finalized.fileId);
  assert.equal(proof.getSharingAccess(), "PRIVATE");
  assert.equal(proof.blob.bytes.length, 5 * 1024 * 1024);
  assert.equal(folder.files.filter((file) => file.name.startsWith("flora-chunk-") && !file.trashed).length, 0);
  assert.throws(() => context.cleanupProofUpload_(uploadId, "wrong-token"), /token is invalid/);
  assert.equal(proof.trashed, false);

  proof.createdAt = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000);
  context.cleanupExpiredProofFiles_();
  assert.equal(proof.trashed, true);

  const cleanupSession = context.startProofUpload_();
  context.uploadProofChunk_({ uploadId: cleanupSession.uploadId, uploadToken: cleanupSession.uploadToken, index: 0, chunkCount: 1, data: "AQ==" });
  const cleanupProof = context.finalizeProofUpload_({ uploadId: cleanupSession.uploadId, uploadToken: cleanupSession.uploadToken, chunkCount: 1, fileType: "image/jpeg" });
  const cleanupFile = folder.files.find((file) => file.id === cleanupProof.fileId);
  assert.equal(context.cleanupProofUpload_(cleanupSession.uploadId, cleanupSession.uploadToken).ok, true);
  assert.equal(cleanupFile.trashed, true);

  const { context: publicContext } = createEnvironment({ folderAccess: "ANYONE" });
  const publicSession = publicContext.startProofUpload_();
  assert.throws(() => publicContext.uploadProofChunk_({ uploadId: publicSession.uploadId, uploadToken: publicSession.uploadToken, index: 0, chunkCount: 1, data: "AQ==" }), /private/);
}

testAppendOnlyMigrationAndInventoryExpiry();
testIdempotencyAndFormulaSafeText();
testUnknownHeadersFailWithoutMutation();
testLegacyNotificationsAreIgnoredAndRetriesStopAfterFive();
testLegacyGatewayCallDoesNotEnterNewQueue();
testOrderCommitSurvivesTelegramFailure();
testOrderCommitRevokesProofCleanupToken();
testPrivateProofUploadAtMaximumAndRetention();
console.log("Apps Script operation tests passed.");
