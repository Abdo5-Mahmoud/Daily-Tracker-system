const path = require("path");

module.exports = {
  BASE_URL: "https://www.amazon.eg",

  // High-priority search queries for CasaArt Decor / Artiflora market segment
  TARGET_KEYWORDS: [
    "ورد صناعي",
    "فازات ديكور",
    "نباتات صناعية",
    "تنسيق ورد",
    "ديكور مكتبي",
    "فازه مكتب",
  ],

  // Number of pages to scrape per keyword (1 page = ~48-60 products)
  MAX_PAGES_PER_KEYWORD: 2,

  // Human-like delay between requests to avoid triggering Amazon WAF (milliseconds)
  MIN_DELAY_MS: 2500,
  MAX_DELAY_MS: 5000,

  // Threshold price in EGP for competitor undercut alerts (our minimum test price is 199 EGP)
  COMPETITOR_UNDERCUT_THRESHOLD: 199.0,

  // File paths
  DB_PATH: path.resolve(
    __dirname,
    "../../local-business-store/market-intelligence/amazon_market.db",
  ),
  OUTPUT_DIR: path.resolve(
    __dirname,
    "../../local-business-store/market-intelligence",
  ),

  // Modern browser User-Agents for rotation
  USER_AGENTS: [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:124.0) Gecko/20100101 Firefox/124.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 Edg/122.0.0.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_3_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3.1 Safari/605.1.15",
  ],
};
