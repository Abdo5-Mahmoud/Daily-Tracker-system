# Workspace Tools & Flora_Home MCP Hub (`scripts/`)

All automation, pricing economics, Ads CSV analytics, and visual compliance auditors run locally with zero external scraping workarounds and full automated test coverage.

---

## 1. Registered MCP Server (`workspace-tools` v2.0)

Configured via `~/.gemini/config/mcp_config.json` running `scripts/workspace_mcp_server.py`.

| MCP Tool | Purpose |
| :--- | :--- |
| `market_summary` | Summarizes `amazon_market.db` keyword snapshots with mandatory `[STALE DATA WARNING]` when age > 24h |
| `market_sponsored_radar` | Lists captured Sponsored Ads from DB alongside snapshot freshness status |
| `market_sql_query` | Safe read-only `SELECT`/`WITH`/`EXPLAIN` queries over `amazon_market.db` |
| `unit_economics_calculator` | Single-source-of-truth 13% FBA/Easy Ship calculator (coupons, VAT, inbound share, Break-Even CPC) |
| `audit_image_compliance` | Enforces 1:1 ratio, `>=1000px` zoom, `1600px` HD hint, and pure-white `#FFFFFF` corner pixel check (`>=248` RGB) |
| `audit_language_formatting` | Verifies 100% Arabic or 100% English line purity across chat/markdown files |
| `page_one_radar_log` | Reads recent Page-1 Radar sessions with file modification freshness guard |
| `analyze_ads_csv` | Parses exported Arabic/English Seller Central Ads CSV reports (`Search Terms`, `Placements`, `Targeting`) |
| `ingest_amazon_html` | Triggers `amazon-tracker/index.js` on a Chrome-saved `.html` snapshot cleanly |

---

## 2. Verification Commands

```bash
# 1. Node Tracker & Ingestion Tests
node --test scripts/amazon-tracker/tests/amazon-tracker.test.js

# 2. Python Economics, Ads CSV & MCP Server Unit Tests
python -m unittest discover -s scripts/tests -p "test_*.py" -v

# 3. Full End-to-End JSON-RPC MCP Harness
python scripts/test_workspace_mcp.py
```
