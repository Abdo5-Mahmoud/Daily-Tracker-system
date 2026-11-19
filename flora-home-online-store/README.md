# Flora Home Online Store

This project is the Arabic direct-sales funnel for the Flora Home Lilium arrangement. Direct-sales inventory remains separate from Amazon inbound inventory.

## Local development

```powershell
npm install
Copy-Item .env.example .env.local
npm run dev
```

Local inventory, pricing, and customer-facing settings are preview fallbacks. Production checkout requires a reachable Apps Script catalog gateway, an enabled store, and approved pricing in the Google Sheet.

## Control plane

Import the following workbook into a private Google Sheet:

```text
artifacts/flora-home-control-plane.xlsx
```

The workbook contains:

```text
Orders
Inventory
Settings
```

The `Inventory` tab keeps direct stock, reservations, available stock, safety stock, and Amazon inbound quantities separate. The Google Sheet formulas are a human-facing view; the Apps Script gateway recalculates availability under a script lock before accepting an order.

The `Settings` tab controls store availability, pricing approval, prices, shipping, the prepaid discount, payment destination, WhatsApp support, and delivery messaging. Keep the store disabled and pricing unapproved until staging is complete.

## Order and payment rules

- Only `Cancelled` and `Expired` orders release stock.
- `Awaiting_Deposit` reservations expire after 24 hours.
- Confirmed, shipped, and delivered orders remain counted.
- Amazon inbound units never increase direct-sales availability.
- Cash-on-delivery orders collect the calculated shipping fee as the deposit.
- `COD_Remaining_EGP` is the only amount passed to the courier.
- The website returns an order-specific WhatsApp link for transfer proof.
- The website does not upload or store payment-proof images.
- Idempotency prevents duplicate reservations.
- Customer text is escaped before being written to Google Sheets.

## Server configuration

The Vercel deployment needs these server-only values:

```text
APPS_SCRIPT_GATEWAY_URL
APPS_SCRIPT_SHARED_SECRET
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
RATE_LIMIT_HASH_SECRET
```

Local preview fallback values are documented in `.env.example`. Production values for pricing, stock, and customer-facing store settings come from Google Sheets.

## Apps Script deployment

Copy `scripts/apps-script/Code.gs` into a dedicated Apps Script project. Use a copied spreadsheet for staging and keep it private.

Set these Apps Script properties:

```text
SPREADSHEET_ID
SHARED_SECRET
TELEGRAM_BOT_TOKEN
TELEGRAM_CHAT_ID
```

Authorize Sheets, Cache, and URL Fetch scopes. Deploy the Apps Script project as a web app, then set the deployment URL and matching shared secret in the Vercel Preview environment.

Install the notification trigger on the staging project before testing. For production, deploy the Apps Script version first, deploy the Vercel code second, and install the production trigger last.

## Staging acceptance checklist

1. Import the workbook into a copied private Google Sheet.
2. Confirm the three tabs and exact append-only headers.
3. Protect the header and formula ranges.
4. Confirm a new order stores the deposit and remaining amount.
5. Confirm the WhatsApp link contains the order ID and payment amounts.
6. Submit the same idempotency key twice and confirm one reservation.
7. Confirm `Awaiting_Deposit` expires after 24 hours.
8. Confirm confirmed, shipped, and delivered orders remain counted.
9. Confirm a Telegram outage does not roll back a saved order.
10. Confirm the site and pricing gates stop live orders when disabled.

## Verification commands

```powershell
npm test
npm run lint
npm run build
```
