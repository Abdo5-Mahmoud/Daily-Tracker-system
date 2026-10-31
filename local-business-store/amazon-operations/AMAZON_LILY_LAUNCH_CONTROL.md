# Amazon Egypt Lilium Launch Control & Operations Dashboard 🌸🛡️

## 1. Executive Summary & Launch Identifiers

This document is the authoritative master control register for the Flora Home Lilium floral arrangement product launch on Amazon Egypt. It governs fulfillment transitions, shipment status, contradiction resolution, and operational gating.

### Active Product Identifiers
- **Parent SKU**: `FL-LILY-PARENT` (Pending reconstitution)
- **Brand Name**: Flora Home
- **Category Path**: Home & Kitchen > Home Decor > Artificial Flowers > Artificial Flowers (`artificial-flowers`)

### Active Child Products Matrix
| Child SKU | ASIN | FNSKU Barcode | Variation / Pattern | Inbound Units | Box 1 (P1-B1) | Box 2 (P1-B2) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `FL-LILY-BUBBLE-WHT` | `B0HNFBPLGG` | `X002PYHMVR` | Bubble Spherical (`بابلز كروي`) | **8 Units** | 4 Units | 4 Units |
| `FL-LILY-DIAMOND-WHT` | `B0HNFC2MDD` | `X002PYA6LF` | Diamond Honeycomb (`نقشة الألماس`) | **7 Units** | 4 Units | 3 Units |
| `FL-LILY-FLUTED-WHT` | `B0HNF8SBZ7` | `X002PYHKQJ` | Fluted Origami (`مضلع أوريجامي`) | **4 Units** | 2 Units | 2 Units |
| **Total Pilot Batch** | - | - | - | **19 Units** | **10 Units** | **9 Units** |

---

## 2. Inbound Logistics & Shipment Status

### Amazon Inbound Shipment Master Record
- **Workflow ID**: `wf8526c209-71fb-45c3-a621-708ad30cde2b`
- **Packing Group ID**: `pg7a068de8-9cf6-40fb-bb95-09accf3f5d1d`
- **Shipment ID / Order ID**: `FBA15MRGNQSG`
- **Partnered Carrier**: Amazon Transport Services (`ATS`)
- **Bill of Lading / Tracking Number (AWB)**: `AEG3238380616`
- **Shipping Mode**: Small Parcel Delivery (`SPD`)
- **Carrier Pickup Scheduled Date**: November 3, 2026
- **Estimated Arrival Date at Fulfillment Center (EAD)**: November 4, 2026
- **Destination Fulfillment Center**:
  - `Souq.com for E-Commerce LLC (Amazon Egypt FC)`
  - `3FP7+X6, Suez Rd, El Shorouk, Cairo 4910201`
- **Amazon Package Classification**: `OVERSIZE` (Triggered routinely because carton length is 60 cm, exceeding standard 45 cm threshold)
- **Carrier Inbound Shipping Charge**: **114.40 EGP** total (~**6.02 EGP / unit** across 19 units, debited against future seller disbursements)

### Master Cartons Architecture
1. **Master Carton 1 (`Box 1 of 2` - `P1 - B1`)**:
   - Internal Box ID: `FBA15MRGNQSGU000001`
   - Gross Weight: `8.2 kg` (7.5 kg products + 0.7 kg corrugated carton & reinforced tape)
   - Dimensions: `60 cm × 40 cm × 40 cm`
   - Content: 10 individual packaged units (4 Bubble + 4 Diamond + 2 Fluted)
   - External Labeling: Combined ATS carrier tracking barcode & FBA carton barcode.
2. **Master Carton 2 (`Box 2 of 2` - `P1 - B2`)**:
   - Internal Box ID: `FBA15MRGNQSGU000002`
   - Gross Weight: `7.5 kg` (6.75 kg products + 0.75 kg corrugated carton & reinforced tape)
   - Dimensions: `60 cm × 40 cm × 40 cm`
   - Content: 9 individual packaged units (4 Bubble + 3 Diamond + 2 Fluted)
   - External Labeling: Combined ATS carrier tracking barcode & FBA carton barcode.

---

## 3. Comprehensive Contradictions Audit

Every discrepancy between physical reality, repository records, and Seller Central configurations is detailed below:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                          LILIUM LAUNCH CONTRADICTION MATRIX                            │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### 1. Fulfillment Method Contradiction (CRITICAL)
- **Repository Conflict**:
  - `AMAZON_EGYPT_LISTING_BLUEPRINT_LILIUM_VASE.md` (Tab 5, lines 292-296, 343, 389) explicitly instructs: `Easy Ship (أرغب في شحن هذا المنتج بنفسي أو استخدام خدمة الشحن السهل لدى أمازون)`.
  - Conversely, `FBA_SHIPMENT_INBOUND_RECORD_19PCS.md` records an active FBA inbound workflow with printed FNSKU barcodes and ATS master shipping labels.
- **Physical Reality**:
  - The units are labeled with `FNSKU` barcodes (`X002PY...`), packed into two master cartons, and scheduled for ATS carrier pickup to an Amazon FC.
- **Resolution**:
  - All listings must be confirmed as Fulfilled by Amazon (`FBA`). Any remnant of `Easy Ship` in listing templates must be superseded.

### 2. Physical Handover vs Inventory Availability (OPERATIONAL TRUTH)
- **Fallacy**:
  - Assuming that handing the two master cartons to the ATS driver on November 3, 2026, means the products are available for sale.
- **Physical Reality**:
  - When the carrier takes custody, the shipment status is merely `In Transit`.
  - Transit to El Shorouk FC takes 24 to 48 hours (EAD: November 4, 2026).
  - Upon arrival at the FC dock, status transitions to `Delivered`.
  - The warehouse receiving team must subsequently unload, scan each carton, check in the shipment (`Checked In`), open cartons, and individually scan each of the 19 `FNSKU` stickers (`Receiving`).
  - Units only become purchasable when status displays `Available`. During processing, inventory appears as `FC Processing` or `Inbound Transfer` and is NOT eligible for the Featured Offer (Buy Box).

### 3. Pricing Contradictions Across Records
- **Contradiction**:
  - `AMAZON_EGYPT_LISTING_BLUEPRINT_LILIUM_VASE.md`: Selling Price = **259.00 EGP** (List Price = 320.00 EGP).
  - `AMAZON_PPC_LAUNCH_CAMPAIGN_SPEC.md`: Selling Price = **189.00 EGP** (List Price = 249.00 EGP) [Old Plant30cm pricing].
  - `EASY_SHIP_VS_FBA_MASTER_REPORT.md`: Selling Price = **189.00 EGP** [Old Plant30cm benchmark].
  - `FLORA_HOME_PACKAGING_AND_PRICING_REPORT.md`: Selling Price = **199.00 EGP** / **249.00 EGP**.
  - `AMAZON_MARKET_AUDIT_FLOWER_VASES.md`: Selling Price = **279.00 EGP** (`BOUQ-001`).
- **Resolution**:
  - The approved test price for the Lilium arrangement is **259.00 EGP** (with 320.00 EGP strike-through list price). All other figures are obsolete legacy benchmarks.

### 4. Dimensions & Weight Discrepancies
- **Listing Blueprint Statement**:
  - Product dimensions: Length 18 cm, Width 18 cm, Height 30 cm, Net Weight 280 g.
  - Package dimensions: Length 34 cm, Width 21 cm, Height 12 cm, Gross Weight 450 g.
- **Physical Reality & Photo Infogram (`diagrams.png`)**:
  - The ceramic-look polymer container has a height of 12.5 cm and a base width of 8.7 cm.
  - Total vertical arrangement height is approximately 30 cm.
  - Top petal/foliage lateral span reaches 18 cm.
  - The gross package weight of 450 g matches the physical Nile carton containing protective bubble wrap.
- **Resolution**:
  - The packaging dimensions of **34 × 21 × 12 cm** and gross weight of **450 g** must be maintained in Seller Central item package specifications to ensure accurate FBA fulfillment fee tier allocation.

### 5. Inventory Quantity Discrepancy
- **Contradiction**:
  - Nile packaging invoice records 35 individual white cartons purchased.
  - FBA shipment `FBA15MRGNQSG` contains only 19 units.
- **Physical Reality**:
  - 19 assembled units constitute Pilot Inbound Batch 1.
  - The remaining 16 cartons remain in the الوراق store workshop for future assembly or replacement reserve.

### 6. Parent-Child Variation Structure Error
- **Seller Central Error**:
  - The parent listing `FL-LILY-PARENT` has an active catalog error: `90244: The value specified for CONTAINER_SHAPE is invalid for variation parent`.
- **Physical Reality**:
  - The 3 child ASINs are distinct by container pattern/style (`Bubble`, `Fluted`, `Diamond`), not container shape.
- **Resolution**:
  - Delete the conflicting parent SKU row and reconstitute the parent using variation theme `StyleName` (or `PatternName`), linking the 3 existing child ASINs.

---

## 4. Advertising Gate: HARD BLOCKED

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              ADVERTISING LAUNCH GATE                                   │
│                                                                                        │
│   STATUS: [ LOCKED / BLOCKED ] 🛑                                                      │
│                                                                                        │
│   REASON: Inventory is not available for sale; Featured Offer (Buy Box) is inactive.   │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### Unblocking Protocol
PPC advertising campaigns must **NOT** be enabled under any circumstances until all four mandatory conditions are satisfied:

1. **Physical Delivery & Receiving**:
   - Shipment `FBA15MRGNQSG` reaches status `Closed` or `Receiving` with verified scanned units.
2. **Stock Availability**:
   - `Manage FBA Inventory` shows **Available** units > 0 for each target ASIN (`B0HNFBPLGG`, `B0HNFC2MDD`, `B0HNF8SBZ7`).
3. **Featured Offer (Buy Box) Ownership**:
   - Each child ASIN listing displays "Eligible for Featured Offer: YES" and the listing page on amazon.eg shows the active "Add to Cart" / "Buy Now" button attributed to seller CasaArt Decor.
4. **Suppression Check**:
   - Ensure none of the child listings are suppressed due to missing image zoom requirements, title length, or brand authorization.

---

## 5. Next Actions: Seller Central Manual Verification Checklist

The user must manually check and confirm the following items inside Seller Central:

- [ ] **1. Inbound Shipment Tracking (`Inventory > Shipments`)**:
  - Open shipment `FBA15MRGNQSG`.
  - Confirm that ATS carrier pickup appointment is scheduled for November 3, 2026.
  - Note the driver handover and verify transition to `In Transit`.
- [ ] **2. Warehouse Check-in Monitoring (November 4–6, 2026)**:
  - Monitor shipment progression from `In Transit` -> `Delivered` -> `Checked In` -> `Receiving`.
  - Confirm that scanned quantity equals exactly 19 units (8 Bubble, 7 Diamond, 4 Fluted).
- [ ] **3. Inventory Availability (`Inventory > Manage FBA Inventory`)**:
  - Verify that the units move from `Inbound` to `Available` (not stranded or reserved).
- [ ] **4. Featured Offer Status (`Pricing > Pricing Health`)**:
  - Verify that ASINs `B0HNFBPLGG`, `B0HNFC2MDD`, and `B0HNF8SBZ7` hold the Featured Offer at 259.00 EGP.
- [ ] **5. Parent SKU Error Resolution (`Inventory > Manage All Inventory`)**:
  - Locate `FL-LILY-PARENT`.
  - Check if error `90244: CONTAINER_SHAPE` persists. Delete the parent shell and re-upload/re-link via feed file under variation theme `StyleName`.
