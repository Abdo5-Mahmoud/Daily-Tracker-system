const ORDER_HEADERS = [
  'Order_ID', 'Timestamp', 'Status', 'Customer_Name', 'Phone_Primary', 'Phone_Secondary',
  'Governorate', 'Address_Details', 'Shape_A_Qty', 'Shape_B_Qty', 'Shape_C_Qty',
  'Bundle_Tier', 'Payment_Method', 'Total_EGP', 'Notes_Ref', 'Idempotency_Key',
  'Reservation_Expires_At', 'Confirmed_At', 'Updated_At', 'Notification_Status', 'Attribution_Source',
  'Notification_Queued_At', 'Notification_Attempts', 'Notification_Next_Attempt_At',
  'Notification_Claim_Expires_At', 'Notification_Last_Error', 'Proof_File_ID', 'Proof_Expires_At'
];

const INVENTORY_HEADERS = [
  'Shape_ID', 'Direct_Stock', 'Reserved_Qty', 'Available_Qty', 'Safety_Stock', 'Amazon_Inbound_Qty'
];

const RESERVATION_TTL_MS = 24 * 60 * 60 * 1000;
const PROOF_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const CLAIM_TTL_MS = 10 * 60 * 1000;
const MAX_PROOF_BYTES = 5 * 1024 * 1024;
const MAX_PROOF_CHUNK_BYTES = 1024 * 1024;
const PROOF_SESSION_TTL_SECONDS = 15 * 60;
const MAX_NOTIFICATION_ATTEMPTS = 5;
const NOTIFICATION_RETRY_DELAYS_MS = [15 * 60 * 1000, 60 * 60 * 1000, 6 * 60 * 60 * 1000, 24 * 60 * 60 * 1000];
const MAX_NOTIFICATIONS_PER_RUN = 10;

function doPost(event) {
  try {
    const rawBody = event && event.postData && event.postData.contents || '{}';
    if (rawBody.length > 2 * 1024 * 1024) return json_({ ok: false, code: 'REQUEST_TOO_LARGE' });
    const payload = JSON.parse(rawBody);
    assertSecret_(payload.secret);

    if (payload.action === 'getInventory') return json_({ ok: true, inventory: readInventory_() });
    if (payload.action === 'findOrder') return json_(findOrderAction_(payload.idempotencyKey));
    if (payload.action === 'reserveOrder') return json_(reserveOrder_(payload.order, payload.proofFileId, payload.queueNotifications === true, payload.proofUploadId, payload.proofUploadToken));
    if (payload.action === 'startProofUpload') return json_(startProofUpload_());
    if (payload.action === 'uploadProofChunk') return json_(uploadProofChunk_(payload));
    if (payload.action === 'finalizeProofUpload') return json_(finalizeProofUpload_(payload));
    if (payload.action === 'cleanupProofUpload') return json_(cleanupProofUpload_(payload.uploadId, payload.uploadToken));
    return json_({ ok: false, code: 'UNKNOWN_ACTION', message: 'Unknown gateway action.' });
  } catch (error) {
    return json_({ ok: false, code: error.code || 'GATEWAY_ERROR', message: error.message || 'Gateway error.' });
  }
}

function startProofUpload_() {
  const uploadId = Utilities.getUuid();
  const uploadToken = Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '');
  CacheService.getScriptCache().put(proofSessionCacheKey_(uploadId), JSON.stringify({ uploadToken: uploadToken, chunkCount: 0 }), PROOF_SESSION_TTL_SECONDS);
  return { ok: true, uploadId: uploadId, uploadToken: uploadToken };
}

function reserveOrder_(order, proofFileId, queueNotifications, proofUploadId, proofUploadToken) {
  return withScriptLock_(function () {
    const sheets = sheets_();
    ensureHeaders_(sheets.orders, ORDER_HEADERS);
    expireUnconfirmedReservations_(sheets.orders, new Date());
    if (proofUploadId || proofUploadToken) {
      validateUploadId_(proofUploadId);
      requireProofUploadSession_(proofUploadId, proofUploadToken);
      if (!proofFileId || DriveApp.getFileById(proofFileId).getDescription() !== 'flora-home-proof:' + proofUploadId) {
        throw codedError_('PROOF_UPLOAD_FAILED', 'Proof file does not match its upload session.');
      }
    }
    const existing = findOrderByIdempotency_(sheets.orders, order.idempotencyKey);
    if (existing) {
      if (proofFileId && proofFileId !== existing.proofFileId) trashProofFileById_(proofFileId);
      if (proofUploadId) consumeProofUploadSession_(proofUploadId, proofUploadToken);
      return { ok: true, duplicate: true, orderId: existing.orderId, status: existing.status, pricing: order.pricing };
    }

    const inventory = readInventoryUnlocked_();
    ['bubble', 'diamond', 'fluted'].forEach(function (shape) {
      if (!inventory[shape] || order.selection[shape] > inventory[shape].availableStock) {
        const error = new Error('Requested stock is not available.');
        error.code = 'OUT_OF_STOCK';
        throw error;
      }
    });

    const proofFile = proofFileId ? assertPrivateProofFile_(proofFileId) : null;

    const now = new Date();
    const expires = new Date(now.getTime() + RESERVATION_TTL_MS);
    const proofExpires = proofFile ? new Date(proofFile.getDateCreated().getTime() + PROOF_TTL_MS) : '';
    const orderId = 'ART-' + Utilities.formatDate(now, Session.getScriptTimeZone(), 'yyyyMMdd-HHmmss') + '-' + Utilities.getUuid().slice(0, 4).toUpperCase();
    const status = order.paymentMethod === 'InstaPay' ? 'New - Check InstaPay' : 'New';

    sheets.orders.appendRow([
      orderId, now, status, safeSheetText_(order.customerName), safeSheetText_(order.phonePrimary), safeSheetText_(order.phoneSecondary || ''),
      safeSheetText_(order.governorate), safeSheetText_(order.addressDetails), order.selection.bubble, order.selection.diamond, order.selection.fluted,
      safeSheetText_(order.pricing.bundleLabel), safeSheetText_(order.paymentMethod), order.pricing.total, safeSheetText_(order.paymentReference || ''), order.idempotencyKey,
      expires, '', now, 'pending', safeSheetText_(order.source || 'direct'),
      queueNotifications ? now : '', queueNotifications ? 0 : '', queueNotifications ? now : '', '', '', proofFileId || '', proofExpires
    ]);
    if (proofUploadId) consumeProofUploadSession_(proofUploadId, proofUploadToken);

    return { ok: true, duplicate: false, orderId: orderId, status: status, pricing: order.pricing };
  });
}

function findOrderAction_(idempotencyKey) {
  return withScriptLock_(function () {
    if (!idempotencyKey) return { ok: false, code: 'VALIDATION_ERROR' };
    const sheet = sheets_().orders;
    ensureHeaders_(sheet, ORDER_HEADERS);
    const existing = findOrderByIdempotency_(sheet, idempotencyKey);
    return existing
      ? { ok: true, exists: true, orderId: existing.orderId, status: existing.status }
      : { ok: true, exists: false };
  });
}

function readInventory_() {
  return withScriptLock_(readInventoryUnlocked_);
}

function readInventoryUnlocked_() {
  const sheets = sheets_();
  ensureHeaders_(sheets.inventory, INVENTORY_HEADERS);
  ensureHeaders_(sheets.orders, ORDER_HEADERS);
  expireUnconfirmedReservations_(sheets.orders, new Date());
  const values = sheets.inventory.getDataRange().getValues();
  const orders = readActiveReservations_(sheets.orders);
  const headers = headerMap_(values[0]);
  const result = {};

  for (let row = 1; row < values.length; row += 1) {
    const shape = String(values[row][headers.Shape_ID] || '').toLowerCase();
    if (!shape) continue;
    const directStock = Number(values[row][headers.Direct_Stock] || 0);
    const safetyValue = values[row][headers.Safety_Stock];
    const safetyStock = safetyValue === '' || safetyValue == null ? 2 : Number(safetyValue);
    const reservedQty = orders[shape] || 0;
    result[shape] = {
      directStock: directStock,
      availableStock: Math.max(0, directStock - reservedQty - safetyStock),
      amazonInbound: Number(values[row][headers.Amazon_Inbound_Qty] || 0)
    };
  }
  return result;
}

function readActiveReservations_(sheet) {
  ensureHeaders_(sheet, ORDER_HEADERS);
  const values = sheet.getDataRange().getValues();
  const headers = headerMap_(values[0]);
  const result = { bubble: 0, diamond: 0, fluted: 0 };

  for (let row = 1; row < values.length; row += 1) {
    const status = String(values[row][headers.Status] || '');
    if (status === 'Cancelled' || status === 'Expired') continue;
    result.bubble += Number(values[row][headers.Shape_A_Qty] || 0);
    result.diamond += Number(values[row][headers.Shape_B_Qty] || 0);
    result.fluted += Number(values[row][headers.Shape_C_Qty] || 0);
  }
  return result;
}

function expireUnconfirmedReservations_(sheet, now) {
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return;
  const headers = headerMap_(values[0]);
  for (let row = 1; row < values.length; row += 1) {
    const status = String(values[row][headers.Status] || '');
    if (status !== 'New' && status !== 'New - Check InstaPay') continue;
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
    if (String(values[row][headers.Idempotency_Key] || '') === String(key)) {
      return {
        orderId: values[row][headers.Order_ID],
        status: values[row][headers.Status],
        proofFileId: values[row][headers.Proof_File_ID]
      };
    }
  }
  return null;
}

function uploadProofChunk_(payload) {
  validateUploadId_(payload.uploadId);
  const session = requireProofUploadSession_(payload.uploadId, payload.uploadToken);
  const index = Number(payload.index);
  const chunkCount = Number(payload.chunkCount);
  const data = String(payload.data || '');
  if (!Number.isInteger(index) || !Number.isInteger(chunkCount) || chunkCount < 1 || chunkCount > 5 || index < 0 || index >= chunkCount) {
    throw codedError_('PROOF_UPLOAD_FAILED', 'Invalid proof chunk metadata.');
  }
  if (!data || data.length > Math.ceil(MAX_PROOF_CHUNK_BYTES * 4 / 3) + 8) {
    throw codedError_('PROOF_UPLOAD_FAILED', 'Proof chunk is too large.');
  }
  if (session.chunkCount && session.chunkCount !== chunkCount) throw codedError_('PROOF_UPLOAD_FAILED', 'Proof chunk count changed during upload.');
  if (!session.chunkCount) {
    session.chunkCount = chunkCount;
    CacheService.getScriptCache().put(proofSessionCacheKey_(payload.uploadId), JSON.stringify(session), PROOF_SESSION_TTL_SECONDS);
  }
  const bytes = Utilities.base64Decode(data);
  if (bytes.length > MAX_PROOF_CHUNK_BYTES) throw codedError_('PROOF_UPLOAD_FAILED', 'Proof chunk is too large.');

  return withScriptLock_(function () {
    const folder = privateProofFolder_();
    const name = 'flora-chunk-' + payload.uploadId + '-' + index;
    if (folder.getFilesByName(name).hasNext()) return { ok: true, index: index, duplicate: true };
    folder.createFile(Utilities.newBlob(bytes, 'application/octet-stream', name));
    return { ok: true, index: index };
  });
}

function finalizeProofUpload_(payload) {
  validateUploadId_(payload.uploadId);
  const session = requireProofUploadSession_(payload.uploadId, payload.uploadToken);
  const chunkCount = Number(payload.chunkCount);
  const fileType = String(payload.fileType || '');
  if (!Number.isInteger(chunkCount) || chunkCount < 1 || chunkCount > 5 || session.chunkCount !== chunkCount || !/^image\/[a-z0-9.+-]+$/i.test(fileType)) {
    throw codedError_('PROOF_UPLOAD_FAILED', 'Invalid proof file metadata.');
  }

  return withScriptLock_(function () {
    const folder = privateProofFolder_();
    let bytes = [];
    for (let index = 0; index < chunkCount; index += 1) {
      const files = folder.getFilesByName('flora-chunk-' + payload.uploadId + '-' + index);
      if (!files.hasNext()) throw codedError_('PROOF_UPLOAD_FAILED', 'A proof chunk is missing.');
      const chunk = files.next().getBlob().getBytes();
      if (files.hasNext()) throw codedError_('PROOF_UPLOAD_FAILED', 'Duplicate proof chunks were found.');
      bytes = bytes.concat(chunk);
      if (bytes.length > MAX_PROOF_BYTES) throw codedError_('PROOF_UPLOAD_FAILED', 'Proof image is too large.');
    }
    if (!bytes.length) throw codedError_('PROOF_UPLOAD_FAILED', 'Proof image is empty.');

    const extension = fileType === 'image/jpeg' ? 'jpg' : fileType.split('/')[1].replace(/[^a-z0-9]/gi, '').toLowerCase() || 'img';
    const fileName = 'flora-proof-' + payload.uploadId + '.' + extension;
    const file = folder.createFile(Utilities.newBlob(bytes, fileType, fileName));
    file.setDescription('flora-home-proof:' + payload.uploadId);
    for (let index = 0; index < chunkCount; index += 1) trashFilesByName_(folder, 'flora-chunk-' + payload.uploadId + '-' + index);
    return { ok: true, fileId: file.getId() };
  });
}

function cleanupProofUpload_(uploadId, uploadToken) {
  validateUploadId_(uploadId);
  requireProofUploadSession_(uploadId, uploadToken);
  return withScriptLock_(function () {
    const folder = privateProofFolder_();
    const files = folder.getFiles();
    while (files.hasNext()) {
      const file = files.next();
      if (file.getName().indexOf('flora-chunk-' + uploadId + '-') === 0 || file.getName().indexOf('flora-proof-' + uploadId + '.') === 0) {
        file.setTrashed(true);
      }
    }
    CacheService.getScriptCache().remove(proofSessionCacheKey_(uploadId));
    return { ok: true };
  });
}

function requireProofUploadSession_(uploadId, uploadToken) {
  const cache = CacheService.getScriptCache();
  const raw = cache.get(proofSessionCacheKey_(uploadId));
  if (!raw) throw codedError_('PROOF_UPLOAD_FAILED', 'Proof upload session expired.');
  let session;
  try { session = JSON.parse(raw); } catch (error) { throw codedError_('PROOF_UPLOAD_FAILED', 'Proof upload session is invalid.'); }
  if (!uploadToken || String(uploadToken) !== String(session.uploadToken)) {
    throw codedError_('PROOF_UPLOAD_FAILED', 'Proof upload token is invalid.');
  }
  return session;
}

function consumeProofUploadSession_(uploadId, uploadToken) {
  requireProofUploadSession_(uploadId, uploadToken);
  CacheService.getScriptCache().remove(proofSessionCacheKey_(uploadId));
}

function proofSessionCacheKey_(uploadId) {
  return 'flora-proof-session:' + uploadId;
}

function assertPrivateProofFile_(fileId) {
  const folder = privateProofFolder_();
  const file = DriveApp.getFileById(fileId);
  const parents = file.getParents();
  let inConfiguredFolder = false;
  while (parents.hasNext()) if (parents.next().getId() === folder.getId()) inConfiguredFolder = true;
  if (!inConfiguredFolder || file.getSharingAccess() !== DriveApp.Access.PRIVATE) {
    throw codedError_('PROOF_UPLOAD_FAILED', 'Payment proof file is not private.');
  }
  return file;
}

function privateProofFolder_() {
  const folderId = PropertiesService.getScriptProperties().getProperty('PROOF_DRIVE_FOLDER_ID');
  if (!folderId) throw codedError_('PROOF_UPLOAD_FAILED', 'Missing private proof folder configuration.');
  const folder = DriveApp.getFolderById(folderId);
  if (folder.getSharingAccess() !== DriveApp.Access.PRIVATE) {
    throw codedError_('PROOF_UPLOAD_FAILED', 'The proof folder must be private.');
  }
  return folder;
}

function trashProofFileById_(fileId) {
  try {
    const file = DriveApp.getFileById(fileId);
    assertPrivateProofFile_(fileId);
    file.setTrashed(true);
  } catch (error) {
    // The retention sweep is the fallback when immediate cleanup is unavailable.
  }
}

function trashFilesByName_(folder, name) {
  const files = folder.getFilesByName(name);
  while (files.hasNext()) files.next().setTrashed(true);
}

function validateUploadId_(uploadId) {
  if (!/^[a-zA-Z0-9_-]{16,80}$/.test(String(uploadId || ''))) {
    throw codedError_('PROOF_UPLOAD_FAILED', 'Invalid proof upload identifier.');
  }
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
  cleanupExpiredProofFiles_();
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
      if (!queuedAt) continue; // Legacy pending rows are intentionally not re-sent.
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
    'الدفع: ' + values[headers.Payment_Method],
    'الحالة: ' + values[headers.Status]
  ].join('\n');

  telegramRequest_('sendMessage', { chat_id: chatId, text: message }, token);
  const proofFileId = values[headers.Proof_File_ID];
  if (proofFileId) {
    assertPrivateProofFile_(proofFileId);
    const file = DriveApp.getFileById(proofFileId);
    telegramRequest_('sendPhoto', { chat_id: chatId, photo: file.getBlob(), caption: 'صورة التحويل للطلب ' + values[headers.Order_ID] }, token);
  }
}

function telegramRequest_(method, payload, token) {
  const response = UrlFetchApp.fetch('https://api.telegram.org/bot' + token + '/' + method, {
    method: 'post',
    payload: payload,
    muteHttpExceptions: true
  });
  const status = response.getResponseCode();
  let body = {};
  try { body = JSON.parse(response.getContentText() || '{}'); } catch (error) { body = {}; }
  if (status < 200 || status >= 300 || body.ok !== true) {
    throw codedError_('TELEGRAM_HTTP_' + status, 'Telegram rejected the notification.');
  }
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
    sheet.getRange(claim.rowNumber, headers.Notification_Next_Attempt_At + 1)
      .setValue(new Date(now.getTime() + NOTIFICATION_RETRY_DELAYS_MS[claim.attempt - 1]));
  });
}

function cleanupExpiredProofFiles_() {
  const folder = privateProofFolder_();
  const files = folder.getFiles();
  const now = new Date().getTime();
  while (files.hasNext()) {
    const file = files.next();
    const name = file.getName();
    const age = now - file.getDateCreated().getTime();
    const expiredProof = name.indexOf('flora-proof-') === 0 && age >= PROOF_TTL_MS;
    const staleChunk = name.indexOf('flora-chunk-') === 0 && age >= 24 * 60 * 60 * 1000;
    if (expiredProof || staleChunk) file.setTrashed(true);
  }
}

function installNotificationTrigger() {
  const existing = ScriptApp.getProjectTriggers().some(function (trigger) {
    return trigger.getHandlerFunction() === 'processNotificationQueue_';
  });
  if (!existing) ScriptApp.newTrigger('processNotificationQueue_').timeBased().everyMinutes(15).create();
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
  if (sheet.getLastRow() === 0 || sheet.getLastColumn() === 0) {
    sheet.getRange(1, 1, 1, expected.length).setValues([expected]);
    return;
  }
  const existingCount = sheet.getLastColumn();
  const existing = sheet.getRange(1, 1, 1, existingCount).getValues()[0];
  const validPrefix = existing.length <= expected.length && existing.every(function (header, index) {
    return header === expected[index];
  });
  if (!validPrefix) throw new Error('Spreadsheet headers differ from the known append-only schema; no migration was applied.');
  if (existing.length < expected.length) {
    sheet.getRange(1, existing.length + 1, 1, expected.length - existing.length)
      .setValues([expected.slice(existing.length)]);
  }
}

function headerMap_(headers) {
  return headers.reduce(function (map, header, index) { map[header] = index; return map; }, {});
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
