# Amazon Egypt Daily Market Intelligence Engine 📦🔍

A production-grade, zero-external-dependency automated market intelligence scraper and competitor tracking engine built natively with **Node.js 24** (`node:sqlite`, `node:https`, `node:zlib`).

---

## 🎯 Architecture Overview

```
                      +-----------------------------+
                      |       Amazon Egypt          |
                      |  (amazon.eg Search Engine)  |
                      +--------------+--------------+
                                     |
                         [Stealth HTTP & UA Rotation]
                         [Gzip/Brotli Stream Decoding]
                                     v
                      +-----------------------------+
                      |         fetcher.js          |
                      |   (Anti-Bot / Jitter Delay) |
                      +--------------+--------------+
                                     |
                                [Raw HTML]
                                     v
                      +-----------------------------+
                      |         parser.js           |
                      | (ASIN, Title, Price, BSR)   |
                      +--------------+--------------+
                                     |
                             [Structured DTOs]
                                     v
                      +-----------------------------+
                      |           db.js             |
                      |  (SQLite: Products & Daily  |
                      |    Historical Snapshots)    |
                      +--------------+--------------+
                                     |
                               [Time Series]
                                     v
                      +-----------------------------+
                      |         analyzer.js         |
                      |  (Price War & Velocity Delta)|
                      +--------------+--------------+
                                     |
             +-----------------------+-----------------------+
             v                                               v
+---------------------------+                   +---------------------------+
|        reporter.js        |                   |        reporter.js        |
|  (Daily Markdown Briefing |                   |   (Excel / CSV Export     |
|   in market-intelligence) |                   |    for Pandas/Analytics)  |
+---------------------------+                   +---------------------------+
```

---

## 🚀 How to Run

### Manual Run
From the workspace root directory:
```bash
node scripts/amazon-tracker/index.js
```

### Windows Task Scheduler (Daily Automation)
To run automatically every morning at 8:00 AM:
1. Open PowerShell as Administrator.
2. Run:
```powershell
$Action = New-ScheduledTaskAction -Execute "node.exe" -Argument "c:\Users\A5\Desktop\growth-workspace-withAI\scripts\amazon-tracker\index.js" -WorkingDirectory "c:\Users\A5\Desktop\growth-workspace-withAI"
$Trigger = New-ScheduledTaskTrigger -Daily -At 8:00AM
Register-ScheduledTask -Action $Action -Trigger $Trigger -TaskName "AmazonMarketDailyTracker" -Description "Daily scraping and market analysis for Amazon Egypt"
```

---

## 📊 Outputs & Artifacts

All outputs are saved to:
`local-business-store/market-intelligence/`

1. **`amazon_market.db`**: Embedded SQLite database containing full historical snapshots.
2. **`DAILY_MARKET_BRIEFING_YYYY-MM-DD.md`**: Executive markdown report highlighting:
   - Price drops and discounts.
   - Price hikes.
   - Surging items by review growth (sales velocity).
   - Competitor undercut threats (< 199 EGP).
   - Category averages and Prime penetration.
3. **`market_snapshot_latest.csv`**: UTF-8 BOM CSV export compatible with Microsoft Excel and Python Pandas.

---

## ⚙️ Configuration (`config.js`)

- `TARGET_KEYWORDS`: Array of search queries (`ورد صناعي`, `فازات ديكور`, etc.).
- `MAX_PAGES_PER_KEYWORD`: Number of search result pages per query (default: 2 pages = ~100 items).
- `MIN_DELAY_MS` / `MAX_DELAY_MS`: Humanized jitter interval between requests (2500ms - 5000ms).
- `COMPETITOR_UNDERCUT_THRESHOLD`: Alert threshold for cheap competitors (default: 199.0 EGP).
