# Flora Home Online Store

This project is the first Arabic direct-sales funnel for the Flora Home Lilium arrangement.

## Current scope

- Three variants: Bubble, Diamond, and Fluted.
- Cairo and Giza delivery only.
- Cash on delivery with optional prepaid discount.
- Google Sheets operations board.
- Google Apps Script inventory reservation gateway.
- Telegram order notifications.
- Amazon as an optional alternative purchase channel.

Direct-sales stock is separate from Amazon inbound stock. The site defaults to zero available direct stock and disabled pricing until the owner approves the unit economics.

## Local setup

```powershell
npm install
Copy-Item .env.example .env.local
npm run dev
```

## Checks

```powershell
npm run test:domain
npm run lint
npm run build
```

## Google Apps Script setup

Create two sheets named `Orders` and `Inventory`.
Copy `scripts/apps-script/Code.gs` into a Google Apps Script project.
Set these script properties:

```text
SPREADSHEET_ID
SHARED_SECRET
```

Deploy the script as a web app and add its URL to `APPS_SCRIPT_GATEWAY_URL`.
Use the same secret in `APPS_SCRIPT_SHARED_SECRET`.

The gateway uses a script lock before reading stock and appending an order. It also rejects duplicate idempotency keys.

## Safety gates

- Do not set `PRICING_APPROVED=true` before cost review.
- Do not enter Amazon inbound units as direct-sales stock.
- Do not enable the Amazon button until the listing is available and approved.
- Do not put secrets in client-side code.
