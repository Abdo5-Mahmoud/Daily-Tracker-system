# Flora Home Online Store

This project is the Arabic direct-sales funnel for the Flora Home Lilium arrangement. Direct-sales inventory stays separate from Amazon inbound inventory.

## Local development

```powershell
npm install
Copy-Item .env.example .env.local
npm run dev
```

Local inventory is preview data only. The API and checkout stay closed unless a live Apps Script inventory gateway is reachable and pricing is approved.

## Order and inventory rules

- `Direct_Stock` is the cumulative allocation for direct sales. Do not replace it with the remaining physical count.
- Only `Cancelled` and `Expired` orders release stock. New reservations expire after 24 hours; confirmed, shipped, and delivered orders remain counted.
- Amazon inbound units are never added to direct-sales stock.
- A checkout attempt keeps one idempotency key in browser session storage. It contains no customer information and is cleared after success or a definite pre-save rejection.
- A repeated key returns the existing order instead of appending another row or reserving stock twice.
- Order success is independent of Telegram delivery. New notifications enter the Apps Script queue and are retried by its time-driven worker.
- Only the new order API explicitly opts orders into the notification queue; legacy API calls keep a blank queue timestamp and are not re-notified during deployment transition.
- Payment-proof images are uploaded in 1 MiB chunks to a dedicated private Drive folder and are scheduled for deletion after 30 days. The browser receives only a 15-minute, upload-scoped token; the Apps Script shared secret never leaves the server.
- User-entered text is escaped before it is written to Sheets to prevent spreadsheet formulas from running.

## Environment variables

The Vercel deployment needs these server-only values:

```text
APPS_SCRIPT_GATEWAY_URL
APPS_SCRIPT_SHARED_SECRET
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
RATE_LIMIT_HASH_SECRET
```

The shared limiter allows five requests per client fingerprint in a fixed ten-minute window. The client fingerprint is HMAC-hashed before it is sent to Upstash. Production fails closed if Upstash is missing or unavailable; the local in-memory limiter is development-only.

Proof-upload session creation has its own limit of ten sessions per client fingerprint per ten minutes, and chunk transfer has a separate limit of thirty requests per ten minutes. This keeps image uploads from consuming the five-order-attempt allowance.

Keep `PRICING_APPROVED=false` until product and delivery costs are approved. The direct-stock environment values are for local preview only and are not used as production sellable inventory.

## Google Apps Script deployment

Copy `scripts/apps-script/Code.gs` into a dedicated Apps Script project. Use a copied spreadsheet and a dedicated private Drive folder for the first end-to-end test. Do not use the production sheet, proof folder, Telegram chat, or gateway secret in the test deployment.

Set these Apps Script Script Properties:

```text
SPREADSHEET_ID
SHARED_SECRET
PROOF_DRIVE_FOLDER_ID
TELEGRAM_BOT_TOKEN
TELEGRAM_CHAT_ID
```

The proof folder must remain private. The script checks the folder and uploaded file access before attaching a file to an order or sending it to Telegram. Do not share the folder publicly or place unrelated files in it.

Authorize the Drive, Cache, and URL Fetch scopes, then deploy the Apps Script project as a web app. Deploy the new Apps Script version before deploying the new Vercel code; older API calls remain outside the notification queue, preventing a transition-time duplicate Telegram alert. Set the gateway URL and matching shared secret in the Vercel Preview environment and redeploy the Preview.

For staging, install the notification trigger on the copied Apps Script project before the end-to-end tests. For a later production cutover, publish the Apps Script version first, deploy the new Vercel code second, then install the production notification trigger last. This keeps the old synchronous notifier and the new queue worker from sending duplicate alerts during the transition. The trigger runs as the account that created it, so that account must retain access to the spreadsheet, private Drive folder, and Telegram chat. Updating Apps Script code requires creating a new web-app deployment version before the gateway uses the update.

## Staging acceptance checklist

1. Use a copied Orders sheet and a private test proof folder. Confirm the existing header row is an exact known prefix; the gateway appends new columns only at the end and refuses unknown or reordered columns.
2. Confirm old pending notification rows have no queue timestamp and are not sent again.
3. Confirm a new order is saved and returns success while Telegram is unavailable; verify the queue status, attempt count, next-attempt time, and final failed status after five attempts.
4. Submit the same idempotency key twice and confirm there is one row, one reservation, and the original order ID is returned both times.
5. Verify only unconfirmed orders expire after 24 hours. Confirmed, shipped, and delivered orders remain counted; cancelled and expired orders release stock.
6. Verify an order cannot be accepted without a live inventory gateway, even when local preview stock is nonzero.
7. Test the maximum 5 MiB proof image as five 1 MiB requests, a rejected image over the limit, private Drive access, duplicate chunk recovery, orphan cleanup, and deletion after 30 days.
8. Test long text and values starting with `=`, `+`, `-`, and `@`; the request must reject excessive lengths and stored text must not become a formula.
9. Test five requests from each of two independent app instances against the same Upstash database, then verify the sixth request is blocked and a Redis outage returns a safe 503 in production mode.
10. Verify pricing is approved before enabling any live order traffic. Do not mix Amazon shipment quantities into the copied or live direct-sales inventory.

## Verification commands

```powershell
npm test
npm run lint
npm run build
```

The local Apps Script test harness checks append-only headers, reservation expiry, idempotency, formula-safe text, notification retry scheduling, legacy queue exclusion, private proof storage, the 5 MiB file boundary, and retention cleanup. Real Google Drive, Telegram, Upstash, and Vercel Preview integration still requires the staging acceptance checklist above.
