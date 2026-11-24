# Amazon Egypt Intelligence Engine (`scripts/amazon-tracker/`)

Zero-bypass, test-driven HTML snapshot parser and SQLite time-series analyzer for **Flora_Home** (`B0HNFBPLGG`, `B0HNFC2MDD`, `B0HNF8SBZ7`).

---

## Architecture

1. **Sanctioned Input (`inbox/`)**: Accepts Chrome-saved `.html` / `.htm` search pages from `amazon.eg` (zero anti-bot bypass scripts, fails loudly on CAPTCHA pages).
2. **`parser.js`**: Extracts ASIN, title, Arabic/English EGP prices (`٠-٩`), voucher coupons (`وفر ... ج.م` / `%`), ratings, review counts, Sponsored flags, Prime badges, and flags Flora_Home products.
3. **`db.js`**: SQLite (`node:sqlite`) storage in `local-business-store/market-intelligence/amazon_market.db` with non-destructive schema migrations and `getFreshnessReport()` (`STALE_THRESHOLD_HOURS = 24`).
4. **`ingest_search.js` & `reporter.js`**: Updates `amazon_market.db`, `market_snapshot_latest.csv`, `DAILY_MARKET_BRIEFING_YYYY-MM-DD.md`, and appends structured summaries to `AMAZON_PAGE_ONE_RADAR_LOG.md`.

---

## CLI Usage

```bash
# Check snapshot age across all tracked keywords
node scripts/amazon-tracker/index.js --freshness

# Ingest all Chrome-saved .html files inside local-business-store/market-intelligence/inbox/
node scripts/amazon-tracker/index.js --inbox

# Ingest a specific saved HTML snapshot with explicit keyword
node scripts/amazon-tracker/index.js --file "path/to/search.html" --keyword "فازة"

# Run automated unit & integration tests
node --test scripts/amazon-tracker/tests/amazon-tracker.test.js
```
