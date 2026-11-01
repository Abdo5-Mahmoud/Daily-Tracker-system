const ORDER_HEADERS = [
  'Order_ID', 'Timestamp', 'Status', 'Customer_Name', 'Phone_Primary', 'Phone_Secondary',
  'Governorate', 'Address_Details', 'Shape_A_Qty', 'Shape_B_Qty', 'Shape_C_Qty',
  'Bundle_Tier', 'Payment_Method', 'Total_EGP', 'Notes_Ref', 'Idempotency_Key',
  'Reservation_Expires_At', 'Confirmed_At', 'Updated_At', 'Notification_Status', 'Attribution_Source'
];

const INVENTORY_HEADERS = [
  'Shape_ID', 'Direct_Stock', 'Reserved_Qty', 'Available_Qty', 'Safety_Stock', 'Amazon_Inbound_Qty'
];

function doPost(event) {
  try {
    const payload = JSON.parse(event.postData.contents || '{}');
    assertSecret_(payload.secret);

    if (payload.action === 'getInventory') return json_({ ok: true, inventory: readInventory_() });
    if (payload.action === 'reserveOrder') return json_(reserveOrder_(payload.order));
    return json_({ ok: false, code: 'UNKNOWN_ACTION', message: 'Unknown gateway action.' });
  } catch (error) {
    return json_({ ok: false, code: error.code || 'GATEWAY_ERROR', message: error.message || 'Gateway error.' });
  }
}

function reserveOrder_(order) {
  const lock = LockService.getScriptLock();
  lock.waitLock(5000);

  try {
    const sheets = sheets_();
    const existing = findOrderByIdempotency_(sheets.orders, order.idempotencyKey);
    if (existing) return { ok: false, code: 'DUPLICATE_ORDER', message: 'Order already exists.', orderId: existing.orderId };

    const inventory = readInventory_();
    ['bubble', 'diamond', 'fluted'].forEach(function (shape) {
      if (!inventory[shape] || order.selection[shape] > inventory[shape].availableStock) {
        const error = new Error('Requested stock is not available.');
        error.code = 'OUT_OF_STOCK';
        throw error;
      }
    });

    const now = new Date();
    const expires = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const orderId = 'ART-' + Utilities.formatDate(now, Session.getScriptTimeZone(), 'yyyyMMdd-HHmmss') + '-' + Utilities.getUuid().slice(0, 4).toUpperCase();
    const status = order.paymentMethod === 'InstaPay' ? 'New - Check InstaPay' : 'New';

    sheets.orders.appendRow([
      orderId, now, status, order.customerName, order.phonePrimary, order.phoneSecondary || '', order.governorate,
      order.addressDetails, order.selection.bubble, order.selection.diamond, order.selection.fluted,
      order.pricing.bundleLabel, order.paymentMethod, order.pricing.total, order.paymentReference || '', order.idempotencyKey,
      expires, '', now, 'pending', order.source || 'direct'
    ]);

    return { ok: true, orderId: orderId, status: status, pricing: order.pricing };
  } finally {
    lock.releaseLock();
  }
}

function readInventory_() {
  const sheet = sheets_().inventory;
  ensureHeaders_(sheet, INVENTORY_HEADERS);
  const values = sheet.getDataRange().getValues();
  const orders = readActiveReservations_();
  const result = {};

  for (let row = 1; row < values.length; row += 1) {
    const shape = String(values[row][0] || '').toLowerCase();
    if (!shape) continue;

    const directStock = Number(values[row][1] || 0);
    const safetyStock = Number(values[row][4] || 2);
    const reservedQty = orders[shape] || 0;
    result[shape] = {
      directStock: directStock,
      availableStock: Math.max(0, directStock - reservedQty - safetyStock),
      amazonInbound: Number(values[row][5] || 0)
    };
  }

  return result;
}

function readActiveReservations_() {
  const sheet = sheets_().orders;
  ensureHeaders_(sheet, ORDER_HEADERS);
  const values = sheet.getDataRange().getValues();
  const headers = headerMap_(values[0]);
  const result = { bubble: 0, diamond: 0, fluted: 0 };
  const now = new Date();

  for (let row = 1; row < values.length; row += 1) {
    const status = String(values[row][headers.Status] || '');
    const expiry = values[row][headers.Reservation_Expires_At];
    if (status === 'Cancelled' || status === 'Expired' || (expiry && new Date(expiry).getTime() < now.getTime())) continue;
    result.bubble += Number(values[row][headers.Shape_A_Qty] || 0);
    result.diamond += Number(values[row][headers.Shape_B_Qty] || 0);
    result.fluted += Number(values[row][headers.Shape_C_Qty] || 0);
  }

  return result;
}

function findOrderByIdempotency_(sheet, key) {
  ensureHeaders_(sheet, ORDER_HEADERS);
  const values = sheet.getDataRange().getValues();
  const headers = headerMap_(values[0]);
  for (let row = 1; row < values.length; row += 1) {
    if (String(values[row][headers.Idempotency_Key] || '') === String(key)) return { orderId: values[row][headers.Order_ID] };
  }
  return null;
}

function sheets_() {
  const id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if (!id) throw new Error('Missing SPREADSHEET_ID script property.');
  const spreadsheet = SpreadsheetApp.openById(id);
  return {
    orders: spreadsheet.getSheetByName('Orders') || spreadsheet.insertSheet('Orders'),
    inventory: spreadsheet.getSheetByName('Inventory') || spreadsheet.insertSheet('Inventory')
  };
}

function ensureHeaders_(sheet, expected) {
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, expected.length).setValues([expected]);
    return;
  }
  const firstRow = sheet.getRange(1, 1, 1, expected.length).getValues()[0];
  if (!expected.every(function (header, index) { return firstRow[index] === header; })) throw new Error('Spreadsheet headers do not match the launch schema.');
}

function headerMap_(headers) {
  return headers.reduce(function (map, header, index) { map[header] = index; return map; }, {});
}

function assertSecret_(provided) {
  const expected = PropertiesService.getScriptProperties().getProperty('SHARED_SECRET');
  if (!expected || provided !== expected) {
    const error = new Error('Unauthorized gateway request.');
    error.code = 'UNAUTHORIZED';
    throw error;
  }
}

function json_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
}
