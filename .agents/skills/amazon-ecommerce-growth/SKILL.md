---
name: amazon-ecommerce-growth
description: Production operating playbook and growth engine for Flora_Home on Amazon Egypt (FBA), covering live ASIN governance, 13% FBA unit economics, Sponsored Products PPC mining, Page-1 CTR funnel diagnostics, and zero-bypass competitor intelligence.
---

# Flora_Home Amazon Egypt Growth Playbook (v2.0 FBA)

This skill governs live commercial operations, Sponsored Products PPC scaling, unit economics, and competitor intelligence for **Flora_Home** (`1Flora_Home`) on Amazon Egypt (`amazon.eg`).

---

## 1. Live Catalog & FBA Inventory Protection

Never edit, rename, or delete bound child SKUs holding physical units in Amazon El Shorouk FC:

| Child SKU | ASIN | FNSKU | Design Variant |
| :--- | :--- | :--- | :--- |
| `FL-LILY-BUBBLE-WHT` | `B0HNFBPLGG` | `X002PYHMVR` | Bubble Vase (`var1`) |
| `FL-LILY-DIAMOND-WHT` | `B0HNFC2MDD` | `X002PYA6LF` | Embossed Diamond Vase (`var3`) |
| `FL-LILY-FLUTED-WHT` | `B0HNF8SBZ7` | `X002PYHKQJ` | Fluted Striped Vase (`var2`) |

### Catalog Governance Rules
1. **Orphan Prevention**: Keep child SKUs immutable so FBA inventory never flips to Stranded Inventory. Delete `0`-stock duplicates only (`FL-LILY-DIAMOND-WHT2`).
2. **Taxonomy Lock**: Do NOT use `CONTAINER_SHAPE` under `artificial-flowers` (triggers Error `90244`). Use `Color` (`StyleName`) with a unique parent SKU (`FL-LILY-PARENT-V2`), never a child SKU.
3. **Claims Compliance**: Describe vases as reinforced ceramic-look polymer (not ceramic/porcelain) and instruct dry/damp cloth cleaning only.

---

## 2. FBA Unit Economics & Deferred Payments Math

Always run `unit_economics_calculator` (`workspace-tools` MCP) before changing prices, coupons, or bid ceilings.

### Canonical Cost Equation (Home Decor 13%)
$$\text{Effective Price} = \text{List Price} - \text{Coupon EGP}$$
$$\text{Net Payout} = \text{Effective Price} - (\text{Referral}_{13\%} + \text{FBA} + \text{Closing}) \times 1.14$$
$$\text{Net Cash Profit} = \text{Net Payout} - (\text{COGS} + \text{Packaging} + \text{Inbound Share}) - \text{Breakage Reserve}$$

### Break-Even PPC Bid Guardrail
$$\text{Break-Even CPC} = \text{Net Cash Profit} \times \text{Expected CVR}$$
$$\text{Safe Max Base Bid} = \frac{\text{Break-Even CPC}}{1 + \frac{\text{Top of Search Modifier \%}}{100}}$$

### Seller Central Ledger Mechanics (`Payments`)
- **ATS Inbound Clearing**: Amazon bills bulk warehouse inbound transport (`114.40 EGP + 14% VAT = 130.42 EGP`) against Standard Orders first; the initial sale settles this balance so remaining FBA units carry zero inbound shipping debt.
- **Deferred Transactions Policy**: Order proceeds sit in Deferred Transactions until courier (`AMZL_EGY`) confirms delivery plus reserve hold window.

---

## 3. Sponsored Products PPC Engine & NLP Guardrails

### Core Architecture Rules
1. **Verify Search Terms Before Adjusting Bids**: Never guess which Targeting group (`Close-match` vs `Loose-match`) brought clicks. Run `analyze_ads_csv` on Seller Central CSV exports first.
2. **Arabic vs English Classifier Split**: In Amazon Egypt Auto campaigns, cross-orthographic Arabic searches frequently route through `Loose-match`, while English catalog tokens route through `Close-match`:

```text
Typical Observed Routing:
- Close-match: generic English tokens (e.g. "vase")
- Loose-match: Arabic buyer intent queries:
فازة
ورد صناعى كانه طبيعى مع فازه
```

3. **Placement Ceiling Discipline**: Always verify effective ceiling before changing base bids:
   `Effective Max CPC = Group Base Bid x (1 + Top of Search Modifier %)`
4. **Phase 2 Manual Exact Graduation**: Promote converting or high-CTR terms to a separate `Manual Exact` campaign after confirming `>= 1 order` (`ACoS <= 25%`) without destabilizing a winning Auto campaign.
5. **Attribution Lag Awareness**: Sales inside Seller Central Ads Console lag `48-72 hours` behind `Manage Orders` (and Installments orders can wait until delivery). Always cross-check `Orders` + `Search Terms` before declaring `0` conversions.

---

## 4. Page-1 Mobile CTR Funnel Diagnostics

High impressions + low CTR (`< 0.8%` on Top of Search) indicates a **visual or offer bottleneck**, not a bid bottleneck:

1. **Mandatory Pure-White Hero Border Gate (`#FFFFFF`)**:
   - Run `audit_image_compliance` on every Hero image (`RGB >= 248` across all 8 border samples, `1:1` square, `>= 1000px` zoom, `1600px+` recommended).
   - Reject gray studio tints immediately (`var3` `RGB 237,238,240` loses pop on mobile cards next to bright competitors).
2. **Zero-Review Bridge**:
   - Until first `5`-star ratings appear, use an active **Green Coupon badge** inside `259 EGP` (`21 EGP` coupon leaves >`75 EGP` profit before ads while stealing visual attention on mobile SERP).
   - Once any order flips to `Delivered`, trigger Seller Central **Request a Review** immediately.
3. **Bundle Value Contrast**: Ensure main photo clearly communicates *Complete Ready Arrangement (Vase + Silicone Lilium)* to beat cheaper empty-vase sets (`181-239 EGP`) visually in `1` second.

---

## 5. Zero-Bypass Live Competitor Intelligence SOP

Never run anti-bot/CAPTCHA bypass scripts or invent fallback mock competitor data.

### Daily / Weekly Scan Workflow
1. Search the target keyword in your visible desktop Chrome session on Amazon Egypt (`amazon.eg`):

```text
Priority Scan Keywords:
فازة
فازات ديكور
ورد صناعي
ورد صناعى كانه طبيعى مع فازه
ورد ليليام
```

2. If Chrome throws a CAPTCHA, solve it directly in the browser UI, then save the page (`Ctrl+S` -> Webpage HTML Only) into:
   `local-business-store/market-intelligence/inbox/`
   Or connect the official `Chrome DevTools` MCP plugin to inspect DOM live.
3. Call `ingest_amazon_html` (or `node scripts/amazon-tracker/index.js --inbox`) to parse Sponsored ranks, prices, coupons, Prime coverage, and Flora_Home positions into `amazon_market.db`.
4. Always honor `[STALE DATA WARNING]` banners from `market_summary` / `page_one_radar_log` — never cite snapshots older than `24` hours as live state.
