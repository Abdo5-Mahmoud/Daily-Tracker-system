# Flora Home Control Plane and Deposit Checkout

## Summary

This change moves production catalog configuration into a private Google Sheet and simplifies payment-proof handling to an order-specific WhatsApp handoff.

The production flow now has three control-plane sheets:

```text
Orders
Inventory
Settings
```

The direct-sales inventory remains isolated from Amazon inbound inventory. The Apps Script gateway calculates final prices under a script lock and returns a cached catalog for the public landing page.

## Order lifecycle

```text
Awaiting_Deposit -> Confirmed -> Shipped -> Delivered
Awaiting_Deposit -> Expired
Awaiting_Deposit -> Cancelled
```

Cash-on-delivery orders reserve the requested stock for 24 hours, collect the calculated shipping fee as a deposit, and expose the product value as the courier collection amount.

```text
Shipping_Deposit_EGP = Shipping_EGP
COD_Remaining_EGP = Total_EGP - Shipping_Deposit_EGP
```

The website returns an encoded WhatsApp link containing the order ID, deposit amount, and remaining collection amount. Customers send their transfer image and sender details manually in WhatsApp. The website no longer accepts or stores payment-proof images.

## Security controls

- Google Sheets remains private and is never exposed through a public share link.
- Gateway authentication uses the server-only shared secret.
- Secrets remain in Apps Script properties and server environment variables.
- Order requests keep HMAC-hashed distributed rate limiting.
- Idempotency prevents duplicate reservations.
- All customer text is formula-safe before it reaches Google Sheets.
- Production checkout fails closed when the live catalog gateway is unavailable.
- The store and pricing approval gates are controlled from the Settings sheet.

## Local artifacts

The workbook builder creates the importable template and previews:

```text
artifacts/flora-home-control-plane.xlsx
artifacts/orders-preview.png
artifacts/inventory-preview.png
artifacts/settings-preview.png
```

Run the builder with the bundled workspace runtime after linking the bundled Node modules into the scripts directory.

## Verification

```powershell
npm test
npm run lint
npm run build
```

The automated tests cover server-side pricing, deposit calculations, WhatsApp link generation, settings and catalog caching, stock isolation, reservation expiry, idempotency, formula-safe text, rate limiting, request-body bounds, and notification retries.
