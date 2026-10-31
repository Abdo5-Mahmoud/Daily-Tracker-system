# Amazon Egypt Lilium Unit Economics & Fee Preview Template 📊💰

## 1. Governance Principles & Strict Data Integrity

This financial model serves as the official unit economics calculation engine for the Flora Home Lilium floral arrangement on Amazon Egypt (`FL-LILY-PARENT` and child ASINs `B0HNFBPLGG`, `B0HNFC2MDD`, `B0HNF8SBZ7`).

### Strict Directives
1. **Zero Invented Figures**: Amazon fees fluctuate based on category commission rate revisions, FBA package cubing measurements (`CubiScan`), weight tier reclassifications, and fulfillment center policies. No fee preview values may be assumed or invented.
2. **Seller Central Verification Mandatory**: All Amazon platform fees must be transcribed directly from the live `Fee Preview` column in Seller Central `Manage Inventory`.
3. **No Reuse of Obsolete Models**: All calculations from the legacy Plant30cm reports (which assumed 189 EGP or 199 EGP price points and old Easy Ship deficit rules) are permanently retired.

---

## 2. Unit Economics Input Variables

To determine the true net profit per unit sold, enter the live values from Seller Central and your workshop accounting into the input matrix below:

### A. Price & Physical Cost Inputs (Seller Controlled)
| Variable Code | Cost Parameter | Description | Verified Value / Placeholder |
| :--- | :--- | :--- | :--- |
| `P_SELL` | **Gross Customer Selling Price** | Buy Box price visible to buyer on amazon.eg | `259.00 EGP` (Approved Test Price) |
| `C_COGS` | **Cost of Goods Sold (COGS)** | Stems (Lilium + filler greens) + polymer pot + inner sand/cement base + workshop labor | `[Enter COGS, e.g. 85.00 EGP]` |
| `C_PACK` | **Individual Packaging Cost** | Nile white single box (34×21×12 cm) + multi-layer bubble wrap + FNSKU sticker + tape | `[Enter Pack Cost, e.g. 10.00 EGP]` |
| `C_INBOUND` | **ATS Partnered Inbound Shipping** | Total ATS fee divided by total units (`114.40 EGP ÷ 19 units`) | `6.02 EGP / unit` (Verified) |

---

### B. Amazon Platform Fees (From Seller Central Fee Preview)
> **Instructions**: Navigate to `Inventory > Manage All Inventory` in Seller Central. Locate child ASINs `B0HNFBPLGG`, `B0HNFC2MDD`, `B0HNF8SBZ7`. Click on the estimated fee in the **Fee Preview** column to view the exact breakdown modal.

| Variable Code | Fee Parameter | Source in Seller Central Modal | Required Input (EGP) |
| :--- | :--- | :--- | :--- |
| `F_REF` | **Amazon Referral Fee** | Base percentage fee for `Home & Kitchen` category (typically 13% of selling price) | `[Transcribe from Fee Preview]` |
| `F_FBA` | **FBA Fulfillment Fee (Pick & Pack)** | Handling, picking, packing, and carrier delivery based on item size tier (`34×21×12 cm`, `450 g`) | `[Transcribe from Fee Preview]` |
| `F_STOR` | **Monthly Storage Fee Preview** | Estimated storage per unit/month based on volume ($0.00857 \text{ m}^3$) | `[Transcribe from Fee Preview]` |
| `F_CLOSE` | **Variable Closing Fee / Per-Item Fee** | Any fixed closing fee applied by Amazon Egypt to the category | `[Transcribe from Fee Preview]` |

---

### C. Taxes, Reserves & Customer Acquisition Allowances
| Variable Code | Operational Parameter | Formula / Basis | Value / Input |
| :--- | :--- | :--- | :--- |
| `T_VAT` | **VAT on Amazon Service Fees** | Egyptian Tax Law: 14% applied to Amazon's platform fees (`F_REF + F_FBA + F_STOR + F_CLOSE`) | `0.14 × Total Amazon Fees` |
| `R_RET` | **Return & Damage Reserve Fund** | Percentage of selling price allocated to cover customer returns, transit scuffs, or buyer remorse | `[Target: 3% to 5% of P_SELL]` |
| `A_PPC` | **Target Advertising Allowance (TACOS)** | Maximum ad spend per unit sold to maintain profitability during launch | `[Target: 20.00 to 25.00 EGP]` |

---

## 3. Financial Calculation Formulas

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              FINANCIAL ALGORITHM MATRIX                                │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### Formula 1: Landed Inventory Cost (`C_LANDED`)
$$C_{\text{LANDED}} = C_{\text{COGS}} + C_{\text{PACK}} + C_{\text{INBOUND}}$$

### Formula 2: Total Amazon Platform Fees (`F_AMAZON_TOTAL`)
$$F_{\text{AMAZON\_TOTAL}} = F_{\text{REF}} + F_{\text{FBA}} + F_{\text{STOR}} + F_{\text{CLOSE}}$$

### Formula 3: VAT on Amazon Services (`T_VAT_TOTAL`)
$$T_{\text{VAT\_TOTAL}} = F_{\text{AMAZON\_TOTAL}} \times 0.14$$

### Formula 4: Total Cost of Sale (`C_TOTAL`)
$$C_{\text{TOTAL}} = C_{\text{LANDED}} + F_{\text{AMAZON\_TOTAL}} + T_{\text{VAT\_TOTAL}} + R_{\text{RET}} + A_{\text{PPC}}$$

### Formula 5: Net Clean Profit per Sold Unit (`PROFIT_NET`)
$$\text{PROFIT}_{\text{NET}} = P_{\text{SELL}} - C_{\text{TOTAL}}$$

### Formula 6: Net Profit Margin Percentage (`MARGIN_NET`)
$$\text{MARGIN}_{\text{NET}} = \left( \frac{\text{PROFIT}_{\text{NET}}}{P_{\text{SELL}}} \right) \times 100$$

### Formula 7: Break-Even Ad Spend / Max Allowable CPA (`CPA_MAX`)
The absolute maximum amount you can spend to acquire an order via Sponsored Products without taking an out-of-pocket loss:
$$\text{CPA}_{\text{MAX}} = P_{\text{SELL}} - (C_{\text{LANDED}} + F_{\text{AMAZON\_TOTAL}} + T_{\text{VAT\_TOTAL}} + R_{\text{RET}})$$

---

## 4. Live Working Calculation Worksheet (Baseline 259 EGP)

*Note: The table below demonstrates the exact mathematical model. Insert verified Fee Preview numbers upon Seller Central check.*

```text
===================================================================================================
Cost Element                                 Variable Code        Calculation / Source           Amount (EGP)
===================================================================================================
1. Customer Selling Price                    P_SELL               Buy Box Live Price             259.00 EGP
---------------------------------------------------------------------------------------------------
2. Product Assembly Cost (COGS)              C_COGS               Workshop physical build         85.00 EGP
3. Single Box & Bubble Packaging             C_PACK               Nile Packaging single box       10.00 EGP
4. Inbound Carrier Freight                   C_INBOUND            ATS Inbound (114.40 / 19)        6.02 EGP
---------------------------------------------------------------------------------------------------
SUBTOTAL: Landed Cost at Amazon FC           C_LANDED             (2 + 3 + 4)                    101.02 EGP
---------------------------------------------------------------------------------------------------
5. Amazon Referral Commission (13%)          F_REF                Fee Preview (259.00 × 13%)      33.67 EGP
6. Amazon FBA Pick & Pack Fee                F_FBA                Fee Preview (450g Standard)    [Fee Preview]
7. Monthly Storage Allocation                F_STOR               Fee Preview (1 Month)          [Fee Preview]
8. 14% VAT on Amazon Service Fees            T_VAT                14% of (Line 5 + Line 6)       [Calculated]
---------------------------------------------------------------------------------------------------
SUBTOTAL: Total Amazon Deductions            F_AMAZON_GROSS       (Line 5 + 6 + 7 + 8)           [Calculated]
---------------------------------------------------------------------------------------------------
9. Return & Damage Reserve Fund (3%)         R_RET                3% of 259.00 EGP                 7.77 EGP
10. Target Advertising Allowance (TACOS)     A_PPC                Max PPC per sale allocation      25.00 EGP
===================================================================================================
NET CASH PROFIT IN HAND                      PROFIT_NET           Line 1 - (Landed + Amz + 9 + 10)[Calculated]
NET PROFIT MARGIN %                          MARGIN_NET           (PROFIT_NET ÷ Line 1) × 100     [Calculated]
===================================================================================================
```

---

## 5. Next Actions: Seller Central Manual Verification Checklist

The user must manually extract and record the following metrics from Seller Central:

- [ ] **1. Extract Fee Preview for Child ASINs (`Inventory > Manage All Inventory`)**:
  - Open `B0HNFBPLGG`, `B0HNFC2MDD`, `B0HNF8SBZ7`.
  - Click on the fee value displayed under the **Fee Preview** column.
  - Record:
    - Referral fee amount: `_______ EGP`
    - FBA fulfillment fee (Pick & Pack): `_______ EGP`
- [ ] **2. Check FBA Weight & Size Tier Classification**:
  - In the fee preview breakdown, confirm whether Amazon classified the single unit package as `Standard Size` or `Oversize`.
  - If classified as `Oversize`, request a CubiScan re-measurement immediately (package is 34×21×12 cm and 450 g, which qualifies as standard parcel).
- [ ] **3. Inspect Payment Statements After First Inbound (`Reports > Payments`)**:
  - Confirm the exact debit of `114.40 EGP` for ATS inbound shipping.
  - Verify that no unexpected inbound placement fees or labeling surcharges were applied.
- [ ] **4. Lock In Pricing Strategy**:
  - Calculate net profit using the exact Fee Preview numbers. Ensure net margin remains ≥ 25% after factoring ad spend allowance.
