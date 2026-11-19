import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const outputDir = fileURLToPath(new URL("../artifacts/", import.meta.url));
await fs.mkdir(outputDir, { recursive: true });

const colors = {
  ink: "#2F2A26",
  green: "#687B63",
  gold: "#AD8951",
  cream: "#F7F1E9",
  paper: "#FFFDF9",
  line: "#E6DDD2",
  red: "#FCE8E6",
  yellow: "#FFF4D6",
  blue: "#E6F0FA",
};

const orderHeaders = [
  "Order_ID", "Timestamp", "Status", "Customer_Name", "Phone_Primary", "Phone_Secondary",
  "Governorate", "Address_Details", "Shape_A_Qty", "Shape_B_Qty", "Shape_C_Qty", "Bundle_Tier",
  "Payment_Method", "Product_Subtotal_EGP", "Shipping_EGP", "Shipping_Deposit_EGP", "COD_Remaining_EGP", "Total_EGP",
  "Deposit_Sender", "Deposit_Reference_Last4", "Deposit_Verified_At", "Deposit_Verified_By", "Notes_Ref", "Idempotency_Key",
  "Reservation_Expires_At", "Confirmed_At", "Updated_At", "Notification_Status", "Attribution_Source",
  "Notification_Queued_At", "Notification_Attempts", "Notification_Next_Attempt_At", "Notification_Claim_Expires_At", "Notification_Last_Error",
];

const settingsRows = [
  ["store_enabled", "false", "تشغيل استقبال الطلبات"],
  ["pricing_approved", "false", "اعتماد الأسعار"],
  ["single_price", 219, "سعر القطعة الواحدة"],
  ["two_price", 399, "سعر قطعتين"],
  ["three_price", 549, "سعر ثلاث قطع"],
  ["additional_unit_price", 183, "سعر القطعة الإضافية"],
  ["shipping_fee", 60, "قيمة الشحن"],
  ["prepaid_discount", 30, "خصم التحويل الكامل"],
  ["free_shipping_threshold", 3, "حد الشحن المجاني"],
  ["safety_stock", 2, "مخزون الأمان"],
  ["instapay_identifier", "", "معرف التحويل"],
  ["instapay_recipient", "", "اسم المستلم"],
  ["support_whatsapp", "", "رقم واتساب الدعم بصيغة دولية"],
  ["delivery_estimate", "", "مدة التوصيل"],
  ["site_paused_message", "الطلبات متوقفة مؤقتًا. حاول مرة أخرى بعد قليل.", "رسالة إيقاف الموقع"],
];

function styleHeader(range) {
  range.format = {
    fill: colors.green,
    font: { name: "Arial", size: 10, bold: true, color: "#FFFFFF" },
    horizontalAlignment: "center",
    verticalAlignment: "center",
    wrapText: true,
    borders: { preset: "all", style: "thin", color: colors.line },
  };
}

function styleBody(range) {
  range.format = {
    font: { name: "Arial", size: 10, color: colors.ink },
    verticalAlignment: "center",
    wrapText: true,
    borders: { preset: "all", style: "thin", color: colors.line },
  };
}

const workbook = Workbook.create();
const orders = workbook.worksheets.add("Orders");
const inventory = workbook.worksheets.add("Inventory");
const settings = workbook.worksheets.add("Settings");

for (const sheet of [orders, inventory, settings]) {
  sheet.showGridLines = false;
  sheet.tabColor = colors.green;
}

orders.getRange(`A1:AH1`).values = [orderHeaders];
styleHeader(orders.getRange("A1:AH1"));
orders.getRange("A2:AH200").format = {
  fill: colors.paper,
  font: { name: "Arial", size: 10, color: colors.ink },
  verticalAlignment: "center",
  wrapText: true,
  borders: { preset: "all", style: "thin", color: colors.line },
};
orders.getRange("C2:C200").dataValidation = { rule: { type: "list", values: ["Awaiting_Deposit", "Confirmed", "Shipped", "Delivered", "Cancelled", "Expired"] } };
orders.getRange("M2:M200").dataValidation = { rule: { type: "list", values: ["COD", "InstaPay"] } };
orders.getRange("G2:G200").dataValidation = { rule: { type: "list", values: ["Cairo", "Giza"] } };
orders.getRange("N2:R200").format.numberFormat = "#,##0";
orders.getRange("Y2:AA200").format.numberFormat = "yyyy-mm-dd hh:mm";
orders.getRange("AD2:AG200").format.numberFormat = "yyyy-mm-dd hh:mm";
orders.getRange("A1:AH200").format.autofitColumns();
orders.getRange("A1:AH200").format.autofitRows();
orders.freezePanes.freezeRows(1);
orders.getRange("C2:C200").conditionalFormats.add("containsText", { text: "Awaiting_Deposit", format: { fill: colors.yellow } });
orders.getRange("C2:C200").conditionalFormats.add("containsText", { text: "Confirmed", format: { fill: colors.blue } });
orders.getRange("C2:C200").conditionalFormats.add("containsText", { text: "Cancelled", format: { fill: colors.red } });
orders.getRange("C2:C200").conditionalFormats.add("containsText", { text: "Expired", format: { fill: colors.red } });

inventory.getRange("A1:F4").values = [
  ["Shape_ID", "Direct_Stock", "Reserved_Qty", "Available_Qty", "Safety_Stock", "Amazon_Inbound_Qty"],
  ["bubble", 0, null, null, 2, 0],
  ["diamond", 0, null, null, 2, 0],
  ["fluted", 0, null, null, 2, 0],
];
inventory.getRange("C2").formulas = [["=SUMIFS(Orders!$I$2:$I$1000,Orders!$C$2:$C$1000,\"<>Cancelled\",Orders!$C$2:$C$1000,\"<>Expired\")"]];
inventory.getRange("C3").formulas = [["=SUMIFS(Orders!$J$2:$J$1000,Orders!$C$2:$C$1000,\"<>Cancelled\",Orders!$C$2:$C$1000,\"<>Expired\")"]];
inventory.getRange("C4").formulas = [["=SUMIFS(Orders!$K$2:$K$1000,Orders!$C$2:$C$1000,\"<>Cancelled\",Orders!$C$2:$C$1000,\"<>Expired\")"]];
inventory.getRange("D2").formulas = [["=MAX(0,B2-C2-E2)"]];
inventory.getRange("D2:D4").fillDown();
styleHeader(inventory.getRange("A1:F1"));
styleBody(inventory.getRange("A2:F4"));
inventory.getRange("B2:F4").format.numberFormat = "#,##0";
inventory.getRange("D2:D4").conditionalFormats.add("cellIs", { operator: "lessThanOrEqual", formula: 0, format: { fill: colors.red, font: { bold: true, color: "#A64B43" } } });
inventory.getRange("A1:F4").format.autofitColumns();
inventory.getRange("A1:F4").format.autofitRows();
inventory.freezePanes.freezeRows(1);

settings.getRange("A1:D1").values = [["Key", "Value", "Description", "Updated_At"]];
settings.getRange("A2:C16").values = settingsRows;
settings.getRange("D2:D16").values = Array.from({ length: 15 }, () => [""]);
styleHeader(settings.getRange("A1:D1"));
styleBody(settings.getRange("A2:D16"));
settings.getRange("B2:B16").format = {
  fill: colors.yellow,
  font: { name: "Arial", size: 10, color: colors.ink },
  verticalAlignment: "center",
  wrapText: true,
  borders: { preset: "all", style: "thin", color: colors.line },
};
settings.getRange("B3").dataValidation = { rule: { type: "list", values: ["true", "false"] } };
settings.getRange("B2").dataValidation = { rule: { type: "list", values: ["true", "false"] } };
settings.getRange("B4:B11").format.numberFormat = "#,##0";
settings.getRange("D2:D16").format.numberFormat = "yyyy-mm-dd hh:mm";
settings.getRange("A1:D16").format.autofitColumns();
settings.getRange("A1:D16").format.autofitRows();
settings.freezePanes.freezeRows(1);
settings.getRange("B2:B3").conditionalFormats.add("containsText", { text: "false", format: { fill: colors.red, font: { bold: true, color: "#A64B43" } } });

workbook.recalculate();

for (const [sheetName, range] of [["Orders", "A1:AH14"], ["Inventory", "A1:F4"], ["Settings", "A1:D16"]]) {
  const preview = await workbook.render({ sheetName, range, scale: 1, format: "png" });
  await fs.writeFile(path.join(outputDir, `${sheetName.toLowerCase()}-preview.png`), new Uint8Array(await preview.arrayBuffer()));
}

const xlsx = await SpreadsheetFile.exportXlsx(workbook);
await xlsx.save(path.join(outputDir, "flora-home-control-plane.xlsx"));
console.log("Created flora-home-control-plane.xlsx and sheet previews.");
