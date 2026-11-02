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
- Centralized customer-facing settings for InstaPay, WhatsApp support, and delivery copy.

Direct-sales stock is separate from Amazon inbound stock. The site defaults to zero available direct stock and disabled pricing until the owner approves the unit economics.

The direct-sales inventory model is cumulative allocation: `Direct_Stock` means the total quantity allocated to the direct channel. Every order except `Cancelled` and `Expired` remains counted. Add replenishment quantities to `Direct_Stock`; do not replace it with the remaining physical count.

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

## Customer-facing settings

These settings are read server-side and passed to the page through the catalog. Update the environment variables and redeploy; do not edit the page component for copy changes.

```text
INSTAPAY_IDENTIFIER=abdo5a@instapay
INSTAPAY_RECIPIENT=عبدالله محمود فوزي
SUPPORT_WHATSAPP=01282798824
DELIVERY_ESTIMATE=
INSTAPAY_PROOF_REQUIRED=false
```

Keep `DELIVERY_ESTIMATE` empty until the courier confirms a delivery promise. The page will show a confirmation-before-shipping message instead of inventing an ETA.

## Safety gates

- Do not set `PRICING_APPROVED=true` before cost review.
- Do not enter Amazon inbound units as direct-sales stock.
- Do not enable the Amazon button until the listing is available and approved.
- Do not put secrets in client-side code.
- Do not enable live orders until the Apps Script gateway and Telegram notification channel are configured.
- If the live inventory gateway is configured but unavailable, the storefront fails closed and disables orders.
