/**
 * ============================================================================
 * ARTIFLORA DECOR ERP - THE UNIFIED PRODUCTION ENGINE
 * نظام أرتيفلورا المتكامل لإدارة المخازن، المبيعات، المشتريات، التصنيع، والمحاسبة
 * ============================================================================
 * 
 * المزايا الهندسية والمحاسبية المدمجة:
 * 1. قفل الحماية التزامني (LockService) لمنع التضارب وحالات التنافس (Race Conditions)
 * 2. معمارية التعديل في الذاكرة والحفظ المجمع (Batch Mutation) لتفادي بطء الشيت
 * 3. خوارزمية ترجيح المخزون الذكية (المورد + صاحب أعلى رصيد متاح)
 * 4. حساب متوسط التكلفة المرجح التلقائي (Weighted Average Costing)
 * 5. الدفتر المحاسبي المزدوج الآلي (COGS/Inventory & Cash/Sales)
 * 6. محرك التصنيع متعدد المخرجات مع فحص الخامات المسبق (Multi-Output BOM)
 * 7. قوائم منسدلة إلزامية لمنع الأخطاء الإملائية والمسافات الزائدة
 * 8. قائمة تشغيل علوية مدمجة (🌸 أرتيفلورا ERP) لتشغيل النظام بضغطة زر
 */

// ثوابت أسماء الشيتات وأعمدة النظام (1-based indexes)
const _COLS = {
  STOCK: {
    NAME: 1, TYPE: 2, SUPPLIER: 3, AVG_PRICE: 4, AVAILABLE: 5,
    SUGGESTED: 6, LAST_UPDATE: 7, TOTAL_PUR_QTY: 8, TOTAL_SOLD: 9,
    TOTAL_PUR_VALUE: 10, TOTAL_SALES_VALUE: 11, SKU: 12, NOTES: 13
  },
  ORDERS: {
    NAME: 1, TYPE: 2, QTY: 3, PRICE: 4, SUPPLIER: 5,
    DATE: 6, STATUS: 7, ORDERID: 8, ENTEREDBY: 9, NOTES: 10
  },
  SALES: {
    NAME: 1, TYPE: 2, QTY: 3, SUPPLIER: 4, SUGGESTED: 5,
    ACTUAL_PRICE: 6, DISCOUNT: 7, TOTAL_SALE: 8, DATE: 9,
    STATUS: 10, SALEID: 11, ENTEREDBY: 12, NOTES: 13
  },
  LOGS: {
    TIMESTAMP: 1, ACTION: 2, NAME: 3, QTY: 4, PRICE: 5,
    ACTUAL_PRICE: 6, FINAL_PRICE: 7, TOTAL_SALE: 8, PROFIT: 9,
    SUPPLIER: 10, REFROW: 11, MSG: 12, USER: 13
  },
  JOURNAL: { DATE: 1, ENTRYID: 2, DEBIT: 3, CREDIT: 4, AMOUNT: 5, NOTE: 6 },
  SYS: { DATE: 1, PROCESS: 2, MSG: 3, COUNT: 4 },
  ERR: { TIME: 1, FUNC: 2, MSG: 3, INPUT: 4 },
  MFG: { ID: 1, NAME: 2, TYPE: 3, QTY: 4, COST_SHARE: 5, STATUS: 6, DATE: 7, NOTES: 8 },
  MFG_ITEMS: { ID: 1, NAME: 2, TYPE: 3, SUPPLIER: 4, QTY_PER_UNIT: 5, TOTAL_QTY: 6, PRICE: 7, TOTAL_PRICE: 8, AVAIL: 9 }
};

const LOCK_TIMEOUT_MS = 30000; // 30 ثانية انتظار للحصول على القفل

function _genId(prefix) {
  return prefix + "-" + (new Date().getTime()) + "-" + Math.floor(Math.random() * 900 + 100);
}

function parseNumber(val) {
  if (typeof val === "string") {
    val = val.replace("٪", "").replace("%", "").replace("٫", ".").replace(",", ".").trim();
  }
  val = Number(val);
  return isNaN(val) ? 0 : val;
}

/**
 * خوارزمية ترجيح وبحث المخزون الذكية (من كود عبده)
 * ترجح الصنف المطابق للمورد مع توفر رصيد > 0، أو الصنف صاحب أعلى رصيد متاح
 */
function findStockRowForSale(stockData, itemName, itemType, supplier) {
  if (!stockData || stockData.length <= 1) return -1;
  itemName = (itemName || "").toString().trim().toLowerCase();
  itemType = (itemType || "").toString().trim().toLowerCase();
  supplier = (supplier || "").toString().trim().toLowerCase();

  var candidates = [];

  for (var r = 1; r < stockData.length; r++) {
    var sName = (stockData[r][_COLS.STOCK.NAME - 1] || "").toString().trim().toLowerCase();
    var sType = (stockData[r][_COLS.STOCK.TYPE - 1] || "").toString().trim().toLowerCase();
    var sSupplier = (stockData[r][_COLS.STOCK.SUPPLIER - 1] || "").toString().trim().toLowerCase();

    if (sName === itemName && (itemType === "" || sType === itemType)) {
      var avail = Number(stockData[r][_COLS.STOCK.AVAILABLE - 1]) || 0;
      var avg = Number(stockData[r][_COLS.STOCK.AVG_PRICE - 1]) || 0;
      var suggested = Number(stockData[r][_COLS.STOCK.SUGGESTED - 1]) || 0;
      candidates.push({ idx: r, avail: avail, supplier: sSupplier, avg: avg, suggested: suggested });
    }
  }

  if (candidates.length === 0) return -1;

  if (supplier) {
    var bySupAvail = candidates.filter(c => c.supplier === supplier && c.avail > 0);
    if (bySupAvail.length > 0) {
      bySupAvail.sort((a, b) => b.avail - a.avail);
      return bySupAvail[0].idx;
    }
    var bySupAny = candidates.filter(c => c.supplier === supplier);
    if (bySupAny.length > 0) return bySupAny[0].idx;
  }

  var availCandidates = candidates.filter(c => c.avail > 0);
  if (availCandidates.length > 0) {
    availCandidates.sort((a, b) => b.avail - a.avail);
    return availCandidates[0].idx;
  }

  return candidates[0].idx;
}

/**
 * 1. ترحيل ومعالجة المبيعات المجمعة (Sales Batch Processor)
 * أداء فائق في الذاكرة + قفل تزامني + قيود محاسبية + سجلات تدقيق
 */
function processSalesNew_safe() {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(LOCK_TIMEOUT_MS);
  } catch (e) {
    SpreadsheetApp.getUi().alert("⚠️ العملية مشغولة بواسطة مستخدم آخر. يرجى إعادة المحاولة.");
    return;
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var stockS = ss.getSheetByName("Stock_New");
  var salesS = ss.getSheetByName("Sales_New");
  var logsS = ss.getSheetByName("Logs_New");
  var journalS = ss.getSheetByName("Journal");
  var sysS = ss.getSheetByName("SystemStatus");
  var errS = ss.getSheetByName("Errors");

  try {
    if (!salesS || !stockS) return;

    var lastSaleRow = salesS.getLastRow();
    if (lastSaleRow < 2) {
      if (sysS) sysS.appendRow([new Date(), "Sales", "No sales to process", 0]);
      return;
    }

    var salesRange = salesS.getRange(2, 1, lastSaleRow - 1, salesS.getLastColumn());
    var salesData = salesRange.getValues();
    var stockRange = stockS.getDataRange();
    var stockData = stockRange.getValues();

    var logsToAppend = [];
    var journalRows = [];
    var warnings = [];
    var processed = 0;
    var userEmail = Session.getActiveUser().getEmail() || "pos_staff";
    var nowDate = new Date();

    for (var i = 0; i < salesData.length; i++) {
      var row = salesData[i];
      var status = (row[_COLS.SALES.STATUS - 1] || "").toString().toLowerCase().trim();
      if (status === "done" || status === "processed" || status === "تم الترحيل") continue;

      var itemName = (row[_COLS.SALES.NAME - 1] || "").toString().trim();
      var itemType = (row[_COLS.SALES.TYPE - 1] || "").toString().trim();
      var qty = Number(row[_COLS.SALES.QTY - 1]) || 0;
      var supplier = (row[_COLS.SALES.SUPPLIER - 1] || "").toString().trim();
      var suggestedPrice = Number(row[_COLS.SALES.SUGGESTED - 1]) || 0;
      var actualPrice = Number(row[_COLS.SALES.ACTUAL_PRICE - 1]) || 0;
      var discountPerc = Number(row[_COLS.SALES.DISCOUNT - 1]) || 0;
      var saleDate = row[_COLS.SALES.DATE - 1] || nowDate;
      var sheetSaleRow = i + 2;

      if (!itemName || qty <= 0) {
        row[_COLS.SALES.STATUS - 1] = "invalid";
        continue;
      }

      var sIdx = findStockRowForSale(stockData, itemName, itemType, supplier);
      if (sIdx === -1) {
        warnings.push(`No stock entry for ${itemName} | ${itemType} | ${supplier} (sale row: ${sheetSaleRow})`);
        row[_COLS.SALES.STATUS - 1] = "no_stock";
        continue;
      }

      var available = Number(stockData[sIdx][_COLS.STOCK.AVAILABLE - 1]) || 0;
      var purchasePrice = Number(stockData[sIdx][_COLS.STOCK.AVG_PRICE - 1]) || 0;
      var totalSoldQty = Number(stockData[sIdx][_COLS.STOCK.TOTAL_SOLD - 1]) || 0;
      var totalSalesValue = Number(stockData[sIdx][_COLS.STOCK.TOTAL_SALES_VALUE - 1]) || 0;
      var suggestedFromStock = Number(stockData[sIdx][_COLS.STOCK.SUGGESTED - 1]) || 0;

      if (available < qty) {
        warnings.push(`Not enough stock for ${itemName}. Required: ${qty}, Available: ${available} (sale row: ${sheetSaleRow})`);
        row[_COLS.SALES.STATUS - 1] = "insufficient";
        continue;
      }

      // حسابات السعر والخصم والربح
      var unitPrice = actualPrice > 0 ? actualPrice : (suggestedPrice > 0 ? suggestedPrice : suggestedFromStock);
      unitPrice = Math.round(unitPrice * 100) / 100;
      var discountFraction = Math.max(0, Math.min(100, discountPerc)) / 100;
      var finalUnitPrice = Math.round(unitPrice * (1 - discountFraction) * 100) / 100;
      var finalTotal = Math.round(finalUnitPrice * qty * 100) / 100;
      var costTotal = Math.round(qty * purchasePrice * 100) / 100;
      var profit = Math.round((finalTotal - costTotal) * 100) / 100;
      var saleId = row[_COLS.SALES.SALEID - 1] || _genId("SAL");

      // تعديل بيانات المخزون في الذاكرة
      stockData[sIdx][_COLS.STOCK.AVAILABLE - 1] = available - qty;
      stockData[sIdx][_COLS.STOCK.TOTAL_SOLD - 1] = totalSoldQty + qty;
      stockData[sIdx][_COLS.STOCK.TOTAL_SALES_VALUE - 1] = Math.round((totalSalesValue + finalTotal) * 100) / 100;
      stockData[sIdx][_COLS.STOCK.LAST_UPDATE - 1] = saleDate;

      // تعديل بيانات صف المبيعات في الذاكرة
      if (!actualPrice || actualPrice === 0) row[_COLS.SALES.ACTUAL_PRICE - 1] = unitPrice;
      row[_COLS.SALES.TOTAL_SALE - 1] = finalTotal;
      row[_COLS.SALES.SALEID - 1] = saleId;
      row[_COLS.SALES.STATUS - 1] = "done";

      // تجهيز سجلات التدقيق
      logsToAppend.push([
        new Date(), "Sale", itemName, qty, purchasePrice,
        (actualPrice > 0 ? actualPrice : unitPrice), finalUnitPrice,
        finalTotal, profit, supplier || stockData[sIdx][_COLS.STOCK.SUPPLIER - 1],
        sheetSaleRow, `Sold (saleId:${saleId})`, userEmail
      ]);

      // تجهيز قيود اليومية المزدوجة المتوازنة
      journalRows.push([new Date(), saleId, "COGS", "Inventory", costTotal, `COGS for ${itemName}`]);
      journalRows.push([new Date(), saleId, "Cash/AR", "Sales", finalTotal, `Revenue for ${itemName}`]);

      processed++;
    }

    // 1. حفظ تحديثات المخزون دفعة واحدة في الذاكرة
    if (processed > 0) {
      stockRange.setValues(stockData);
      salesRange.setValues(salesData);
    }

    // 2. إلحاق سجلات التدقيق وقيود اليومية
    if (logsToAppend.length > 0 && logsS) {
      logsS.getRange(logsS.getLastRow() + 1, 1, logsToAppend.length, logsToAppend[0].length).setValues(logsToAppend);
    }
    if (journalRows.length > 0 && journalS) {
      journalS.getRange(journalS.getLastRow() + 1, 1, journalRows.length, journalRows[0].length).setValues(journalRows);
    }

    // 3. تدوين حالة النظام
    if (sysS) {
      sysS.appendRow([new Date(), "Sales", "Processed sales", processed]);
      if (warnings.length > 0) {
        sysS.appendRow([new Date(), "Sales", "Warnings: " + warnings.slice(0, 5).join(" | "), warnings.length]);
      }
    }

    SpreadsheetApp.getActiveSpreadsheet().toast(`✅ تم ترحيل ${processed} حركة بيع وتحديث المخزون بنجاح.`, "أرتيفلورا ERP", 4);

  } catch (err) {
    if (errS) errS.appendRow([new Date(), "processSalesNew_safe", err.toString(), JSON.stringify({ message: err.message })]);
    Logger.log("Error in processSalesNew_safe: " + err);
    SpreadsheetApp.getUi().alert("❌ حدث خطأ: " + err.message);
  } finally {
    try { lock.releaseLock(); } catch (e) {}
  }
}

/**
 * 2. ترحيل ومعالجة أوامر الشراء والتوريد (Orders Batch Processor)
 * حساب متوسط التكلفة المرجح آلياً وتحديث الأرصدة دفعة واحدة
 */
function processOrdersNew_safe() {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(LOCK_TIMEOUT_MS);
  } catch (e) {
    SpreadsheetApp.getUi().alert("⚠️ العملية مشغولة حالياً. يرجى المحاولة بعد لحظات.");
    return;
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var stockS = ss.getSheetByName("Stock_New");
  var ordersS = ss.getSheetByName("Orders_New");
  var logsS = ss.getSheetByName("Logs_New");
  var sysS = ss.getSheetByName("SystemStatus");
  var errS = ss.getSheetByName("Errors");

  try {
    if (!ordersS || !stockS) return;

    var lastOrderRow = ordersS.getLastRow();
    if (lastOrderRow < 2) {
      if (sysS) sysS.appendRow([new Date(), "Orders", "No orders to process", 0]);
      return;
    }

    var ordersRange = ordersS.getRange(2, 1, lastOrderRow - 1, ordersS.getLastColumn());
    var ordersData = ordersRange.getValues();
    var stockRange = stockS.getDataRange();
    var stockData = stockRange.getValues();

    // فهرسة المخزون بالمفتاح الثلاثي
    var stockIndex = {};
    for (var r = 1; r < stockData.length; r++) {
      var key = [stockData[r][_COLS.STOCK.NAME - 1], stockData[r][_COLS.STOCK.TYPE - 1], stockData[r][_COLS.STOCK.SUPPLIER - 1]]
        .map(String).join("|").toLowerCase().trim();
      stockIndex[key] = r;
    }

    var newStockRows = [];
    var logsToAppend = [];
    var processedCount = 0;
    var userEmail = Session.getActiveUser().getEmail() || "orders_staff";
    var nowDate = new Date();

    for (var i = 0; i < ordersData.length; i++) {
      var row = ordersData[i];
      var status = (row[_COLS.ORDERS.STATUS - 1] || "").toString().toLowerCase().trim();
      if (status === "done" || status === "processed" || status === "invalid") continue;

      var itemName = (row[_COLS.ORDERS.NAME - 1] || "").toString().trim();
      var itemType = (row[_COLS.ORDERS.TYPE - 1] || "").toString().trim();
      var qty = Number(row[_COLS.ORDERS.QTY - 1]) || 0;
      var price = Number(row[_COLS.ORDERS.PRICE - 1]) || 0;
      var supplier = (row[_COLS.ORDERS.SUPPLIER - 1] || "").toString().trim();
      var orderDate = row[_COLS.ORDERS.DATE - 1] || nowDate;
      var sheetOrderRow = i + 2;

      if (!itemName || qty <= 0) {
        row[_COLS.ORDERS.STATUS - 1] = "invalid";
        continue;
      }

      var key = [itemName, itemType, supplier].join("|").toLowerCase().trim();
      var generatedId = row[_COLS.ORDERS.ORDERID - 1] || _genId("ORD");

      if (stockIndex.hasOwnProperty(key)) {
        var sIdx = stockIndex[key];
        var curAvail = Number(stockData[sIdx][_COLS.STOCK.AVAILABLE - 1]) || 0;
        var curTotalQty = Number(stockData[sIdx][_COLS.STOCK.TOTAL_PUR_QTY - 1]) || 0;
        var curTotalVal = Number(stockData[sIdx][_COLS.STOCK.TOTAL_PUR_VALUE - 1]) || 0;

        var newTotalQty = curTotalQty + qty;
        var newTotalVal = curTotalVal + (price * qty);
        var newAvg = newTotalQty > 0 ? Math.round((newTotalVal / newTotalQty) * 100) / 100 : Math.round(price * 100) / 100;
        var newSuggested = Math.round(newAvg * 1.2 * 100) / 100;

        // تحديث مصفوفة المخزون في الذاكرة
        stockData[sIdx][_COLS.STOCK.AVG_PRICE - 1] = newAvg;
        stockData[sIdx][_COLS.STOCK.AVAILABLE - 1] = curAvail + qty;
        stockData[sIdx][_COLS.STOCK.SUGGESTED - 1] = newSuggested;
        stockData[sIdx][_COLS.STOCK.LAST_UPDATE - 1] = orderDate;
        stockData[sIdx][_COLS.STOCK.TOTAL_PUR_QTY - 1] = newTotalQty;
        stockData[sIdx][_COLS.STOCK.TOTAL_PUR_VALUE - 1] = Math.round(newTotalVal * 100) / 100;

        logsToAppend.push([
          new Date(), "Purchase", itemName, qty, price, price, price,
          Math.round(price * qty * 100) / 100, 0, supplier,
          sheetOrderRow, `Updated existing stock (orderId:${generatedId})`, userEmail
        ]);
      } else {
        // إضافة صنف جديد تماماً إلى المخزون
        var newRow = [
          itemName, itemType, supplier,
          Math.round(price * 100) / 100, qty, Math.round(price * 1.2 * 100) / 100,
          orderDate, qty, 0, Math.round(price * qty * 100) / 100, 0, "", ""
        ];
        newStockRows.push(newRow);
        stockData.push(newRow);
        stockIndex[key] = stockData.length - 1;

        logsToAppend.push([
          new Date(), "Purchase", itemName, qty, price, price, price,
          Math.round(price * qty * 100) / 100, 0, supplier,
          sheetOrderRow, `Added new stock item (orderId:${generatedId})`, userEmail
        ]);
      }

      row[_COLS.ORDERS.ORDERID - 1] = generatedId;
      row[_COLS.ORDERS.STATUS - 1] = "done";
      processedCount++;
    }

    // حفظ المخزون والأوامر في دفعة واحدة
    if (processedCount > 0) {
      if (newStockRows.length > 0) {
        stockS.getRange(stockS.getLastRow() + 1, 1, newStockRows.length, newStockRows[0].length).setValues(newStockRows);
      }
      stockRange.setValues(stockData.slice(0, stockRange.getLastRow()));
      ordersRange.setValues(ordersData);
    }

    if (logsToAppend.length > 0 && logsS) {
      logsS.getRange(logsS.getLastRow() + 1, 1, logsToAppend.length, logsToAppend[0].length).setValues(logsToAppend);
    }

    if (sysS) {
      sysS.appendRow([new Date(), "Orders", "Processed orders into stock", processedCount]);
    }

    SpreadsheetApp.getActiveSpreadsheet().toast(`✅ تم استلام وتحديث ${processedCount} أمر توريد بنجاح.`, "أرتيفلورا ERP", 4);

  } catch (err) {
    if (errS) errS.appendRow([new Date(), "processOrdersNew_safe", err.toString(), JSON.stringify({ message: err.message })]);
    Logger.log("Error in processOrdersNew_safe: " + err);
  } finally {
    try { lock.releaseLock(); } catch (e) {}
  }
}

/**
 * 3. نظام التصنيع المطور وإدارة وصفات التجميع (BOM Engine)
 * مؤمن بقفل تزامني ومحمي ضد تداخل المبيعات
 */
function processManufacturing() {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(LOCK_TIMEOUT_MS);
  } catch (e) {
    SpreadsheetApp.getUi().alert("⚠️ عملية أخرى قيد التنفيذ حالياً. يرجى الانتظار.");
    return;
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var stockS = ss.getSheetByName("Stock_New");
  var mfgS = ss.getSheetByName("Manufacturing");
  var mfgItemsS = ss.getSheetByName("Manufacturing_Items");
  var logsS = ss.getSheetByName("Logs_New");

  try {
    if (!mfgS || !mfgItemsS || !stockS) return;

    var stockRange = stockS.getDataRange();
    var stockData = stockRange.getValues();
    var mfgRange = mfgS.getDataRange();
    var mfgData = mfgRange.getValues();
    var mfgItemsData = mfgItemsS.getDataRange().getValues();
    var userEmail = Session.getActiveUser().getEmail() || "mfg_team";

    // خريطة المخزون
    var stockMap = new Map();
    for (var r = 1; r < stockData.length; r++) {
      var key = `${stockData[r][0]}|${stockData[r][1]}|${stockData[r][2]}`.toLowerCase().trim();
      stockMap.set(key, { data: stockData[r], rowIndex: r + 1 });
    }

    var pendingIds = [...new Set(
      mfgData.slice(1)
        .filter(r => r[5]?.toString().toLowerCase().trim() === "done" && !r[7]?.toString().includes("Success"))
        .map(r => r[0]?.toString().trim())
    )];

    if (pendingIds.length === 0) {
      SpreadsheetApp.getActiveSpreadsheet().toast("لا توجد أوامر تصنيع جديدة للتنفيذ.", "أرتيفلورا ERP", 3);
      return;
    }

    var allLogs = [];
    var processedMfgCount = 0;

    for (var m = 0; m < pendingIds.length; m++) {
      var mfgId = pendingIds[m];
      var outputs = mfgData.filter((r, i) => i > 0 && r[0]?.toString().trim() === mfgId);
      var inputs = mfgItemsData.filter((r, i) => i > 0 && r[0]?.toString().trim() === mfgId);

      if (inputs.length === 0) {
        updateMfgStatus(mfgData, mfgId, "❌ No inputs");
        continue;
      }

      var totalPercent = outputs.reduce((sum, r) => sum + (Number(r[4]) || 0), 0);
      if (outputs.length > 1 && Math.abs(totalPercent - 100) > 0.01) {
        updateMfgStatus(mfgData, mfgId, "❌ Cost% must total 100%");
        continue;
      }

      var totalBatchCost = 0;
      var tempUpdates = [];
      var errorFound = false;

      for (var k = 0; k < inputs.length; k++) {
        var mat = inputs[k];
        var name = mat[1], type = mat[2], supplier = mat[3], qtyNeeded = Number(mat[5]);
        var key = `${name}|${type}|${supplier}`.toLowerCase().trim();
        var item = stockMap.get(key);

        if (!item || Number(item.data[4]) < qtyNeeded) {
          updateMfgStatus(mfgData, mfgId, `❌ Insufficient stock: ${name}`);
          errorFound = true;
          break;
        }

        var unitCost = Number(item.data[3]) || 0;
        totalBatchCost += qtyNeeded * unitCost;
        tempUpdates.push({ key: key, qty: qtyNeeded, unitCost: unitCost, isInput: true, name: name, supplier: supplier });
      }

      if (errorFound) continue;

      // حساب المخرجات
      for (var o = 0; o < outputs.length; o++) {
        var out = outputs[o];
        var outName = out[1], outType = out[2], outQty = Number(out[3]), percent = Number(out[4]) || 100;
        var share = outputs.length > 1 ? percent / 100 : 1;
        var productTotalCost = totalBatchCost * share;
        var outUnitCost = outQty > 0 ? productTotalCost / outQty : 0;
        var outKey = `${outName}|${outType}|manufactured`.toLowerCase().trim();

        tempUpdates.push({
          key: outKey, qty: outQty, unitCost: outUnitCost, totalCost: productTotalCost,
          name: outName, type: outType, isInput: false
        });
      }

      // تطبيق التحديثات في الذاكرة
      for (var u = 0; u < tempUpdates.length; u++) {
        var upd = tempUpdates[u];
        var sItem = stockMap.get(upd.key);

        if (upd.isInput) {
          sItem.data[4] = Number(sItem.data[4]) - upd.qty;
          sItem.data[11] = `Used ${upd.qty} in ${mfgId}`;
          allLogs.push([
            new Date(), "Mfg-In", upd.name, upd.qty, upd.unitCost, "", "",
            upd.qty * upd.unitCost, 0, upd.supplier, mfgId, "Used in manufacturing", userEmail
          ]);
        } else {
          if (!sItem) {
            var newMfgRow = [
              upd.name, upd.type, "manufactured", upd.unitCost, upd.qty,
              upd.unitCost * 1.2, new Date(), upd.qty, 0, upd.totalCost, 0, `Mfg ${mfgId}`, ""
            ];
            stockMap.set(upd.key, { data: newMfgRow, isNew: true });
          } else {
            var oldQty = Number(sItem.data[7]) || 0;
            var oldVal = Number(sItem.data[9]) || 0;
            sItem.data[7] = oldQty + upd.qty;
            sItem.data[9] = oldVal + upd.totalCost;
            sItem.data[3] = sItem.data[7] > 0 ? sItem.data[9] / sItem.data[7] : upd.unitCost;
            sItem.data[4] = Number(sItem.data[4]) + upd.qty;
            sItem.data[5] = sItem.data[3] * 1.2;
            sItem.data[6] = new Date();
            sItem.data[11] = `Updated via ${mfgId}`;
          }
          allLogs.push([
            new Date(), "Mfg-Out", upd.name, upd.qty, upd.unitCost, "", "",
            upd.totalCost, 0, "manufactured", mfgId, "Produced", userEmail
          ]);
        }
      }

      updateMfgStatus(mfgData, mfgId, `✅ Success. Cost: ${totalBatchCost.toFixed(2)} EGP`);
      processedMfgCount++;
    }

    // حفظ مصفوفات المخزون والتصنيع والسجلات في دفعة واحدة
    var newRowsToAppend = [];
    stockMap.forEach(val => {
      if (val.isNew) newRowsToAppend.push(val.data);
    });

    if (newRowsToAppend.length > 0) {
      stockS.getRange(stockS.getLastRow() + 1, 1, newRowsToAppend.length, newRowsToAppend[0].length).setValues(newRowsToAppend);
    }
    stockRange.setValues(stockData);
    mfgRange.setValues(mfgData);

    if (allLogs.length > 0 && logsS) {
      logsS.getRange(logsS.getLastRow() + 1, 1, allLogs.length, allLogs[0].length).setValues(allLogs);
    }

    SpreadsheetApp.getActiveSpreadsheet().toast(`✅ تم تنفيذ ${processedMfgCount} أمر تصنيع بنجاح.`, "أرتيفلورا ERP", 4);

  } catch (err) {
    Logger.log("Error in processManufacturing: " + err);
    SpreadsheetApp.getUi().alert("❌ خطأ في التصنيع: " + err.message);
  } finally {
    try { lock.releaseLock(); } catch (e) {}
  }
}

function updateMfgStatus(mfgData, id, msg) {
  for (var i = 1; i < mfgData.length; i++) {
    if (mfgData[i][0] == id) mfgData[i][7] = msg;
  }
}

/**
 * 4. تطبيق القوائم المنسدلة الإلزامية في شيت المبيعات
 */
function applyDataValidationRules() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var salesSheet = ss.getSheetByName("Sales_New");
  var stockSheet = ss.getSheetByName("Stock_New");

  var stockLastRow = stockSheet.getLastRow();
  if (stockLastRow <= 1) return;

  var stockRange = stockSheet.getRange(`A2:A${stockLastRow}`);
  var rule = SpreadsheetApp.newDataValidation()
    .requireValueInRange(stockRange, true)
    .setAllowInvalid(false)
    .setHelpText("اختر اسم الصنف من القائمة المنسدلة لضمان دقة المخزون ومنع الأخطاء الإملائية.")
    .build();

  salesSheet.getRange("A2:A2000").setDataValidation(rule);
  SpreadsheetApp.getActiveSpreadsheet().toast("✅ تم تفعيل القوائم المنسدلة الإلزامية.", "أرتيفلورا ERP", 3);
}

/**
 * 5. إنشاء القائمة العلوية المخصصة في شريط أدوات الإكسيل
 */
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu("🌸 أرتيفلورا ERP")
    .addItem("⚡ ترحيل المبيعات وتحديث الحسابات والمخزون", "processSalesNew_safe")
    .addItem("📦 ترحيل المشتريات والتوريدات الجديدة", "processOrdersNew_safe")
    .addItem("🔨 تشغيل وتأكيد أوامر التصنيع (BOM)", "processManufacturing")
    .addSeparator()
    .addItem("🛡️ تطبيق القوائم المنسدلة لمنع أخطاء الإدخال", "applyDataValidationRules")
    .addToUi();
}
