const ORDER_HEADERS = [
  'Order_ID', 'Timestamp', 'Status', 'Customer_Name', 'Phone_Primary', 'Phone_Secondary',
  'Governorate', 'Address_Details', 'Shape_A_Qty', 'Shape_B_Qty', 'Shape_C_Qty', 'Bundle_Tier',
  'Payment_Method', 'Product_Subtotal_EGP', 'Shipping_EGP', 'Shipping_Deposit_EGP', 'COD_Remaining_EGP', 'Total_EGP',
  'Deposit_Sender', 'Deposit_Reference_Last4', 'Deposit_Verified_At', 'Deposit_Verified_By', 'Notes_Ref', 'Idempotency_Key',
  'Reservation_Expires_At', 'Confirmed_At', 'Updated_At', 'Notification_Status', 'Attribution_Source',
  'Notification_Queued_At', 'Notification_Attempts', 'Notification_Next_Attempt_At', 'Notification_Claim_Expires_At', 'Notification_Last_Error'
];

const INVENTORY_HEADERS = [
  'Shape_ID', 'Direct_Stock', 'Reserved_Qty', 'Available_Qty', 'Safety_Stock', 'Amazon_Inbound_Qty'
];

const SETTINGS_HEADERS = ['Key', 'Value', 'Description', 'Updated_At'];
const DEFAULT_SETTINGS = [
  ['store_enabled', 'false', 'تشغيل استقبال الطلبات'],
  ['pricing_approved', 'false', 'اعتماد الأسعار'],
  ['single_price', '219', 'سعر القطعة الواحدة'],
  ['two_price', '399', 'سعر قطعتين'],
  ['three_price', '549', 'سعر ثلاث قطع'],
  ['additional_unit_price', '183', 'سعر القطعة الإضافية'],
  ['shipping_fee', '60', 'قيمة الشحن'],
  ['prepaid_discount', '30', 'خصم التحويل الكامل'],
  ['free_shipping_threshold', '3', 'حد الشحن المجاني'],
  ['safety_stock', '2', 'مخزون الأمان'],
  ['instapay_identifier', '', 'معرف التحويل'],
  ['instapay_recipient', '', 'اسم المستلم'],
  ['support_whatsapp', '', 'رقم واتساب الدعم'],
  ['delivery_estimate', '', 'مدة التوصيل'],
  ['site_paused_message', 'الطلبات متوقفة مؤقتًا. حاول مرة أخرى بعد قليل.', 'رسالة إيقاف الموقع']
];

const RESERVATION_TTL_MS = 24 * 60 * 60 * 1000;
const CLAIM_TTL_MS = 10 * 60 * 1000;
const MAX_NOTIFICATION_ATTEMPTS = 5;
const NOTIFICATION_RETRY_DELAYS_MS = [15 * 60 * 1000, 60 * 60 * 1000, 6 * 60 * 60 * 1000, 24 * 60 * 60 * 1000];
const MAX_NOTIFICATIONS_PER_RUN = 10;
const CATALOG_CACHE_KEY = 'flora-home:catalog:v2';
const CATALOG_CACHE_TTL_SECONDS = 60;

function doPost(event) {
  try {
    const rawBody = event && event.postData && event.postData.contents || '{}';
    if (rawBody.length > 256 * 1024) return json_({ ok: false, code: 'REQUEST_TOO_LARGE' });
    const payload = JSON.parse(rawBody);
    assertSecret_(payload.secret);

    if (payload.action === 'getCatalog') return json_(getCatalogAction_());
    if (payload.action === 'getInventory') return json_({ ok: true, inventory: readInventory_() });
    if (payload.action === 'findOrder') return json_(findOrderAction_(payload.idempotencyKey));
    if (payload.action === 'reserveOrder') return json_(reserveOrder_(payload.order, payload.queueNotifications === true));
    return json_({ ok: false, code: 'UNKNOWN_ACTION', message: 'Unknown gateway action.' });
  } catch (error) {
    return json_({ ok: false, code: error.code || 'GATEWAY_ERROR', message: error.message || 'Gateway error.' });
  }
}

function getCatalogAction_() {
  return withScriptLock_(function () {
    const cache = CacheService.getScriptCache();
    const cached = cache.get(CATALOG_CACHE_KEY);
    if (cached) {
      try { return JSON.parse(cached); } catch (error) { cache.remove(CATALOG_CACHE_KEY); }
    }
    const catalog = readCatalogUnlocked_();
    cache.put(CATALOG_CACHE_KEY, JSON.stringify(catalog), CATALOG_CACHE_TTL_SECONDS);
    return catalog;
  });
}

function readCatalogUnlocked_() {
  const sheets = sheets_();
  ensureHeaders_(sheets.orders, ORDER_HEADERS);
  ensureHeaders_(sheets.inventory, INVENTORY_HEADERS);
  ensureSettings_(sheets.settings);
  expireUnconfirmedReservations_(sheets.orders, new Date());
  const config = readStoreConfig_(sheets.settings);
  return { ok: true, pricing: config.pricing, settings: config.settings, inventory: readInventoryFromSheets_(sheets) };
}

function reserveOrder_(order, queueNotifications) {
  return withScriptLock_(function () {
    const sheets = sheets_();
    ensureHeaders_(sheets.orders, ORDER_HEADERS);
    ensureHeaders_(sheets.inventory, INVENTORY_HEADERS);
    ensureSettings_(sheets.settings);
    expireUnconfirmedReservations_(sheets.orders, new Date());

    const config = readStoreConfig_(sheets.settings);
    if (!config.settings.storeEnabled) throw codedError_('STORE_DISABLED', config.settings.sitePausedMessage);
    if (!config.pricing.approved) throw codedError_('PRICING_NOT_APPROVED', 'Pricing is not approved.');
    validateOrder_(order, config.settings);

    const existing = findOrderByIdempotency_(sheets.orders, order.idempotencyKey);
    if (existing) return { ok: true, duplicate: true, orderId: existing.orderId, status: existing.status, paymentMethod: existing.paymentMethod, pricing: existing.pricing };

    const inventory = readInventoryFromSheets_(sheets);
    ['bubble', 'diamond', 'fluted'].forEach(function (shape) {
      if (!inventory[shape] || order.selection[shape] > inventory[shape].availableStock) {
        throw codedError_('OUT_OF_STOCK', 'Requested stock is not available.');
      }
    });

    const pricing = calculatePricing_(order.selection, config.pricing, order.paymentMethod);
    const now = new Date();
    const expires = new Date(now.getTime() + RESERVATION_TTL_MS);
    const orderId = 'ART-' + Utilities.formatDate(now, Session.getScriptTimeZone(), 'yyyyMMdd-HHmmss') + '-' + Utilities.getUuid().slice(0, 4).toUpperCase();
    const status = 'Awaiting_Deposit';

    sheets.orders.appendRow([
      orderId, now, status, safeSheetText_(order.customerName), safeSheetText_(order.phonePrimary), safeSheetText_(order.phoneSecondary || ''),
      safeSheetText_(order.governorate), safeSheetText_(order.addressDetails), order.selection.bubble, order.selection.diamond, order.selection.fluted,
      safeSheetText_(pricing.bundleLabel), safeSheetText_(order.paymentMethod), pricing.productSubtotal, pricing.shipping, pricing.shippingDeposit, pricing.codRemaining, pricing.total,
      '', safeSheetText_(order.paymentReference || ''), '', '', '', order.idempotencyKey,
      expires, '', now, 'pending', safeSheetText_(order.source || 'direct'),
      queueNotifications ? now : '', queueNotifications ? 0 : '', queueNotifications ? now : '', '', ''
    ]);
    CacheService.getScriptCache().remove(CATALOG_CACHE_KEY);
    return { ok: true, duplicate: false, orderId: orderId, status: status, pricing: pricing };
  });
}

function findOrderAction_(idempotencyKey) {
  return withScriptLock_(function () {
    if (!idempotencyKey) return { ok: false, code: 'VALIDATION_ERROR' };
    const sheet = sheets_().orders;
    ensureHeaders_(sheet, ORDER_HEADERS);
    const existing = findOrderByIdempotency_(sheet, idempotencyKey);
    return existing
      ? { ok: true, exists: true, orderId: existing.orderId, status: existing.status, paymentMethod: existing.paymentMethod, pricing: existing.pricing }
      : { ok: true, exists: false };
  });
}

function readInventory_() {
  return withScriptLock_(function () {
    const sheets = sheets_();
    ensureHeaders_(sheets.orders, ORDER_HEADERS);
    ensureHeaders_(sheets.inventory, INVENTORY_HEADERS);
    expireUnconfirmedReservations_(sheets.orders, new Date());
    CacheService.getScriptCache().remove(CATALOG_CACHE_KEY);
    return readInventoryFromSheets_(sheets);
  });
}

function readInventoryFromSheets_(sheets) {
  const values = sheets.inventory.getDataRange().getValues();
  const orders = readActiveReservations_(sheets.orders);
  const headers = headerMap_(values[0]);
  const result = {};

  for (let row = 1; row < values.length; row += 1) {
    const shape = String(values[row][headers.Shape_ID] || '').toLowerCase();
    if (!shape) continue;
    const directStock = nonNegativeNumber_(values[row][headers.Direct_Stock], 0);
    const safetyStock = nonNegativeNumber_(values[row][headers.Safety_Stock], 2);
    const reservedQty = orders[shape] || 0;
    const availableQty = Math.max(0, directStock - reservedQty - safetyStock);
    result[shape] = {
      directStock: directStock,
      availableStock: availableQty,
      amazonInbound: nonNegativeNumber_(values[row][headers.Amazon_Inbound_Qty], 0)
    };
  }
  return result;
}

function readActiveReservations_(sheet) {
  const values = sheet.getDataRange().getValues();
  const headers = headerMap_(values[0]);
  const result = { bubble: 0, diamond: 0, fluted: 0 };
  for (let row = 1; row < values.length; row += 1) {
    const status = String(values[row][headers.Status] || '');
    if (status === 'Cancelled' || status === 'Expired') continue;
    result.bubble += nonNegativeNumber_(values[row][headers.Shape_A_Qty], 0);
    result.diamond += nonNegativeNumber_(values[row][headers.Shape_B_Qty], 0);
    result.fluted += nonNegativeNumber_(values[row][headers.Shape_C_Qty], 0);
  }
  return result;
}

function expireUnconfirmedReservations_(sheet, now) {
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return;
  const headers = headerMap_(values[0]);
  for (let row = 1; row < values.length; row += 1) {
    const status = String(values[row][headers.Status] || '');
    if (status !== 'Awaiting_Deposit') continue;
    const expiry = values[row][headers.Reservation_Expires_At];
    if (!expiry || isNaN(new Date(expiry).getTime()) || new Date(expiry).getTime() > now.getTime()) continue;
    sheet.getRange(row + 1, headers.Status + 1).setValue('Expired');
    sheet.getRange(row + 1, headers.Updated_At + 1).setValue(now);
  }
}

function findOrderByIdempotency_(sheet, key) {
  const values = sheet.getDataRange().getValues();
  const headers = headerMap_(values[0]);
  for (let row = 1; row < values.length; row += 1) {
    if (String(values[row][headers.Idempotency_Key] || '') !== String(key)) continue;
    return { orderId: values[row][headers.Order_ID], status: values[row][headers.Status], paymentMethod: values[row][headers.Payment_Method], pricing: pricingFromRow_(values[row], headers) };
  }
  return null;
}

function pricingFromRow_(row, headers) {
  return {
    totalUnits: Number(row[headers.Shape_A_Qty] || 0) + Number(row[headers.Shape_B_Qty] || 0) + Number(row[headers.Shape_C_Qty] || 0),
    bundleLabel: String(row[headers.Bundle_Tier] || ''),
    productSubtotal: Number(row[headers.Product_Subtotal_EGP] || 0),
    shipping: Number(row[headers.Shipping_EGP] || 0),
    shippingDeposit: Number(row[headers.Shipping_Deposit_EGP] || 0),
    codRemaining: Number(row[headers.COD_Remaining_EGP] || 0),
    prepaidDiscount: 0,
    total: Number(row[headers.Total_EGP] || 0)
  };
}

function validateOrder_(order, settings) {
  if (!order || !order.idempotencyKey || !order.customerName || !order.phonePrimary || !order.addressDetails) throw codedError_('VALIDATION_ERROR', 'Order data is incomplete.');
  if (order.paymentMethod !== 'COD' && order.paymentMethod !== 'InstaPay') throw codedError_('VALIDATION_ERROR', 'Payment method is invalid.');
  if (order.paymentMethod === 'InstaPay' && !settings.instaPayConfigured) throw codedError_('PAYMENT_NOT_CONFIGURED', 'Prepaid payment is not configured.');
  ['bubble', 'diamond', 'fluted'].forEach(function (shape) {
    const quantity = Number(order.selection && order.selection[shape]);
    if (!Number.isInteger(quantity) || quantity < 0) throw codedError_('VALIDATION_ERROR', 'Selection is invalid.');
  });
  if (!order.selection.bubble && !order.selection.diamond && !order.selection.fluted) throw codedError_('VALIDATION_ERROR', 'At least one item is required.');
}

function calculatePricing_(selection, pricing, paymentMethod) {
  const totalUnits = Number(selection.bubble || 0) + Number(selection.diamond || 0) + Number(selection.fluted || 0);
  const productSubtotal = totalUnits === 1
    ? pricing.singlePrice
    : totalUnits === 2
      ? pricing.twoPrice
      : pricing.threePrice + (totalUnits - 3) * pricing.additionalUnitPrice;
  const shipping = totalUnits >= pricing.freeShippingThreshold ? 0 : pricing.shippingFee;
  const prepaidDiscount = paymentMethod === 'InstaPay' ? pricing.prepaidDiscount : 0;
  const total = Math.max(0, productSubtotal + shipping - prepaidDiscount);
  const shippingDeposit = paymentMethod === 'COD' ? shipping : total;
  const codRemaining = paymentMethod === 'COD' ? Math.max(0, total - shippingDeposit) : 0;
  return {
    totalUnits: totalUnits,
    bundleLabel: totalUnits === 1 ? 'قطعة واحدة' : totalUnits === 2 ? 'عرض قطعتين' : 'العرض البطل',
    productSubtotal: productSubtotal,
    shipping: shipping,
    shippingDeposit: shippingDeposit,
    codRemaining: codRemaining,
    prepaidDiscount: prepaidDiscount,
    total: total
  };
}

function readStoreConfig_(sheet) {
  const values = sheet.getDataRange().getValues();
  const headers = headerMap_(values[0]);
  const settings = {};
  for (let row = 1; row < values.length; row += 1) {
    const key = String(values[row][headers.Key] || '').trim();
    if (key) settings[key] = values[row][headers.Value];
  }
  const value = function (key, fallback) { return settings[key] === undefined || settings[key] === null ? fallback : String(settings[key]).trim(); };
  const numberValue = function (key, fallback) { return nonNegativeNumber_(value(key, fallback), fallback); };
  const identifier = value('instapay_identifier', '');
  const recipient = value('instapay_recipient', '');
  return {
    pricing: {
      approved: value('pricing_approved', 'false') === 'true',
      singlePrice: numberValue('single_price', 219),
      twoPrice: numberValue('two_price', 399),
      threePrice: numberValue('three_price', 549),
      additionalUnitPrice: numberValue('additional_unit_price', 183),
      shippingFee: numberValue('shipping_fee', 60),
      prepaidDiscount: numberValue('prepaid_discount', 30),
      freeShippingThreshold: Math.max(1, numberValue('free_shipping_threshold', 3))
    },
    settings: {
      storeEnabled: value('store_enabled', 'false') === 'true',
      sitePausedMessage: value('site_paused_message', 'الطلبات متوقفة مؤقتًا. حاول مرة أخرى بعد قليل.'),
      instaPayIdentifier: identifier,
      instaPayRecipient: recipient,
      supportWhatsapp: normalizeWhatsappNumber_(value('support_whatsapp', '')),
      deliveryEstimate: value('delivery_estimate', ''),
      instaPayConfigured: Boolean(identifier && recipient)
    }
  };
}

function ensureSettings_(sheet) {
  ensureHeaders_(sheet, SETTINGS_HEADERS);
  const values = sheet.getDataRange().getValues();
  const headers = headerMap_(values[0]);
  const existing = {};
  for (let row = 1; row < values.length; row += 1) existing[String(values[row][headers.Key] || '')] = true;
  DEFAULT_SETTINGS.forEach(function (item) {
    if (existing[item[0]]) return;
    sheet.appendRow([item[0], item[1], item[2], new Date()]);
  });
}

function sheets_() {
  const id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if (!id) throw new Error('Missing SPREADSHEET_ID script property.');
  const spreadsheet = SpreadsheetApp.openById(id);
  return {
    orders: spreadsheet.getSheetByName('Orders') || spreadsheet.insertSheet('Orders'),
    inventory: spreadsheet.getSheetByName('Inventory') || spreadsheet.insertSheet('Inventory'),
    settings: spreadsheet.getSheetByName('Settings') || spreadsheet.insertSheet('Settings')
  };
}

function ensureHeaders_(sheet, expected) {
  if (sheet.getLastRow() === 0 || sheet.getLastColumn() === 0) {
    sheet.getRange(1, 1, 1, expected.length).setValues([expected]);
    return;
  }
  const existingCount = sheet.getLastColumn();
  const existing = sheet.getRange(1, 1, 1, existingCount).getValues()[0];
  const validPrefix = existing.length <= expected.length && existing.every(function (header, index) { return header === expected[index]; });
  if (!validPrefix) throw new Error('Spreadsheet headers differ from the known append-only schema; no migration was applied.');
  if (existing.length < expected.length) sheet.getRange(1, existing.length + 1, 1, expected.length - existing.length).setValues([expected.slice(existing.length)]);
}

function headerMap_(headers) {
  return headers.reduce(function (map, header, index) { map[header] = index; return map; }, {});
}

function nonNegativeNumber_(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : fallback;
}

function normalizeWhatsappNumber_(value) {
  const digits = String(value || '').replace(/\D/g, '');
  if (digits.indexOf('0020') === 0) return digits.slice(2);
  if (digits.indexOf('20') === 0) return digits;
  if (digits.indexOf('0') === 0) return '20' + digits.slice(1);
  return digits;
}

function safeSheetText_(value) {
  const text = String(value == null ? '' : value);
  return /^[\u0000-\u0020]*[=+\-@]/.test(text) ? "'" + text : text;
}

function withScriptLock_(callback) {
  const lock = LockService.getScriptLock();
  lock.waitLock(5000);
  try { return callback(); } finally { lock.releaseLock(); }
}

function assertSecret_(provided) {
  const expected = PropertiesService.getScriptProperties().getProperty('SHARED_SECRET');
  if (!expected || provided !== expected) throw codedError_('UNAUTHORIZED', 'Unauthorized gateway request.');
}

function codedError_(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function json_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
}

function processNotificationQueue_() {
  const claims = claimNotifications_();
  claims.forEach(function (claim) {
    try {
      sendOrderNotification_(claim);
      completeNotification_(claim, true, '');
    } catch (error) {
      completeNotification_(claim, false, error && error.code || 'TELEGRAM_SEND_FAILED');
    }
  });
}

function claimNotifications_() {
  return withScriptLock_(function () {
    const sheet = sheets_().orders;
    ensureHeaders_(sheet, ORDER_HEADERS);
    const values = sheet.getDataRange().getValues();
    const headers = headerMap_(values[0]);
    const now = new Date();
    const claims = [];
    for (let row = 1; row < values.length && claims.length < MAX_NOTIFICATIONS_PER_RUN; row += 1) {
      const queuedAt = values[row][headers.Notification_Queued_At];
      if (!queuedAt) continue;
      const status = String(values[row][headers.Notification_Status] || '');
      const claimExpiry = values[row][headers.Notification_Claim_Expires_At];
      const staleClaim = status === 'sending' && claimExpiry && new Date(claimExpiry).getTime() <= now.getTime();
      if (status !== 'pending' && !staleClaim) continue;
      const nextAttempt = values[row][headers.Notification_Next_Attempt_At];
      if (nextAttempt && new Date(nextAttempt).getTime() > now.getTime()) continue;
      const attempts = Number(values[row][headers.Notification_Attempts] || 0);
      if (attempts >= MAX_NOTIFICATION_ATTEMPTS) {
        sheet.getRange(row + 1, headers.Notification_Status + 1).setValue('failed');
        continue;
      }
      const nextCount = attempts + 1;
      const claimUntil = new Date(now.getTime() + CLAIM_TTL_MS);
      sheet.getRange(row + 1, headers.Notification_Claim_Expires_At + 1).setValue(claimUntil);
      sheet.getRange(row + 1, headers.Notification_Attempts + 1).setValue(nextCount);
      sheet.getRange(row + 1, headers.Notification_Next_Attempt_At + 1).setValue('');
      sheet.getRange(row + 1, headers.Notification_Status + 1).setValue('sending');
      claims.push({ rowNumber: row + 1, orderId: values[row][headers.Order_ID], values: values[row], headers: headers, attempt: nextCount });
    }
    return claims;
  });
}

function sendOrderNotification_(claim) {
  const properties = PropertiesService.getScriptProperties();
  const token = properties.getProperty('TELEGRAM_BOT_TOKEN');
  const chatId = properties.getProperty('TELEGRAM_CHAT_ID');
  if (!token || !chatId) throw codedError_('TELEGRAM_NOT_CONFIGURED', 'Telegram notification settings are missing.');
  const headers = claim.headers;
  const values = claim.values;
  const message = [
    'طلب جديد رقم ' + values[headers.Order_ID],
    'الاسم: ' + values[headers.Customer_Name],
    'الهاتف: ' + values[headers.Phone_Primary],
    'المحافظة: ' + values[headers.Governorate],
    'العنوان: ' + values[headers.Address_Details],
    'الإجمالي: ' + values[headers.Total_EGP] + ' جنيه',
    'عربون الشحن: ' + values[headers.Shipping_Deposit_EGP] + ' جنيه',
    'المتبقي عند التسليم: ' + values[headers.COD_Remaining_EGP] + ' جنيه',
    'الدفع: ' + values[headers.Payment_Method],
    'الحالة: ' + values[headers.Status]
  ].join('\n');
  telegramRequest_('sendMessage', { chat_id: chatId, text: message }, token);
}

function telegramRequest_(method, payload, token) {
  const response = UrlFetchApp.fetch('https://api.telegram.org/bot' + token + '/' + method, { method: 'post', payload: payload, muteHttpExceptions: true });
  const status = response.getResponseCode();
  let body = {};
  try { body = JSON.parse(response.getContentText() || '{}'); } catch (error) { body = {}; }
  if (status < 200 || status >= 300 || body.ok !== true) throw codedError_('TELEGRAM_HTTP_' + status, 'Telegram rejected the notification.');
}

function completeNotification_(claim, success, errorCode) {
  withScriptLock_(function () {
    const sheet = sheets_().orders;
    ensureHeaders_(sheet, ORDER_HEADERS);
    const row = sheet.getRange(claim.rowNumber, 1, 1, ORDER_HEADERS.length).getValues()[0];
    const headers = headerMap_(ORDER_HEADERS);
    if (row[headers.Order_ID] !== claim.orderId || Number(row[headers.Notification_Attempts]) !== claim.attempt || row[headers.Notification_Status] !== 'sending') return;
    const now = new Date();
    sheet.getRange(claim.rowNumber, headers.Notification_Status + 1).setValue(success ? 'sent' : (claim.attempt >= MAX_NOTIFICATION_ATTEMPTS ? 'failed' : 'pending'));
    sheet.getRange(claim.rowNumber, headers.Notification_Claim_Expires_At + 1).setValue('');
    sheet.getRange(claim.rowNumber, headers.Notification_Last_Error + 1).setValue(success ? '' : String(errorCode || 'TELEGRAM_SEND_FAILED').slice(0, 100));
    sheet.getRange(claim.rowNumber, headers.Updated_At + 1).setValue(now);
    if (success || claim.attempt >= MAX_NOTIFICATION_ATTEMPTS) {
      sheet.getRange(claim.rowNumber, headers.Notification_Next_Attempt_At + 1).setValue('');
      return;
    }
    sheet.getRange(claim.rowNumber, headers.Notification_Next_Attempt_At + 1).setValue(new Date(now.getTime() + NOTIFICATION_RETRY_DELAYS_MS[claim.attempt - 1]));
  });
}

function installNotificationTrigger() {
  const existing = ScriptApp.getProjectTriggers().some(function (trigger) { return trigger.getHandlerFunction() === 'processNotificationQueue_'; });
  if (!existing) ScriptApp.newTrigger('processNotificationQueue_').timeBased().everyMinutes(15).create();
}
