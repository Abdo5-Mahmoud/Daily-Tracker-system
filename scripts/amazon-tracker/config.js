const path = require("path");

/**
 * Flora_Home Amazon Egypt Intelligence Configuration.
 * Stores verified live Lilium ASINs, Arabic PPC keywords, and local snapshot intake paths.
 */
module.exports = {
  BASE_URL: "https://www.amazon.eg",
  BRAND_NAME: "Flora_Home",

  TARGET_KEYWORDS: [
    "فازة",
    "فازات ديكور",
    "فازات ورد",
    "ورد صناعي",
    "ورد صناعى كانه طبيعى مع فازه",
    "ورد ليليام",
    "تنسيق ورد",
    "ديكور مكتبي",
  ],

  MY_PRODUCTS: [
    { asin: "B0HNFBPLGG", sku: "FL-LILY-BUBBLE-WHT", variant: "Bubble" },
    { asin: "B0HNFC2MDD", sku: "FL-LILY-DIAMOND-WHT", variant: "Diamond" },
    { asin: "B0HNF8SBZ7", sku: "FL-LILY-FLUTED-WHT", variant: "Fluted" },
  ],

  // Alert threshold for low-price commodity competition
  COMPETITOR_UNDERCUT_THRESHOLD: 199.0,

  // Data older than 24 hours is explicitly flagged as stale
  STALE_THRESHOLD_HOURS: 24,

  DB_PATH: path.resolve(
    __dirname,
    "../../local-business-store/market-intelligence/amazon_market.db",
  ),
  OUTPUT_DIR: path.resolve(
    __dirname,
    "../../local-business-store/market-intelligence",
  ),
  INBOX_DIR: path.resolve(
    __dirname,
    "../../local-business-store/market-intelligence/inbox",
  ),
  RADAR_LOG_PATH: path.resolve(
    __dirname,
    "../../local-business-store/market-intelligence/AMAZON_PAGE_ONE_RADAR_LOG.md",
  ),
};
