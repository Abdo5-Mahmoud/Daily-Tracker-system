# Amazon Egypt Lilium PPC Advertising Launch Plan (Sponsored Products) 🎯🚀

## 1. Executive Principles & Hard Launch Constraints

This advertising blueprint governs the commercial introduction of the Flora Home Lilium floral arrangement on Amazon Egypt (`amazon.eg`).

### Absolute Launch Guardrails
1. **Mandatory Launch Gate [HARD BLOCKED]**:
   - No advertising campaigns may be turned on while shipment `FBA15MRGNQSG` is in transit or being checked in.
   - Campaigns must remain paused until units show as **Available** in `Manage FBA Inventory` and each ASIN holds the **Featured Offer (Buy Box)**.
2. **Permanent Retirement of Legacy Campaigns**:
   - The old campaign `SP_FloraHome_Plant30cm_Launch_Exact` and all related 189 EGP Plant30cm materials are completely deprecated and must never be activated for Lilium products.
3. **No Premature Manual Campaigns**:
   - In accordance with empirical algorithmic principles, manual exact-match campaigns must **NOT** be launched during Phase 1.
   - Bidding on guessed keywords burns capital in the cold-start phase. Manual campaigns are unlocked **only** after search-term reports provide empirical evidence of clicks and orders.
4. **Conservative Capital Allocation**:
   - Total daily ad spend across the entire pilot batch is capped at **30.00 EGP / day** (10.00 EGP per child ASIN).

---

## 2. Phase 1 Architecture: 3 Automatic Discovery Campaigns

To let Amazon's machine learning algorithm index our listings against shopper queries and identify real customer search terms in Egypt, we deploy three isolated automatic campaigns—one for each child ASIN.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        PHASE 1: 3-CHILD AUTOMATIC DISCOVERY ENGINE                     │
└────────────────────────────────────────────────────────────────────────────────────────┘

 [Campaign 1: Bubble Pattern]    [Campaign 2: Diamond Pattern]    [Campaign 3: Fluted Pattern]
        ASIN: B0HNFBPLGG                ASIN: B0HNFC2MDD                ASIN: B0HNF8SBZ7
      Daily Budget: 10 EGP            Daily Budget: 10 EGP            Daily Budget: 10 EGP
     Strategy: Down-Only             Strategy: Down-Only             Strategy: Down-Only
    Test Window: 7 Days             Test Window: 7 Days             Test Window: 7 Days
```

---

### Campaign 1: Bubble Pattern Auto Discovery
- **Campaign Name**: `SP_FloraHome_Lilium_Bubble_Auto_Disc`
- **Target ASIN**: `B0HNFBPLGG` (SKU: `FL-LILY-BUBBLE-WHT` | 8 units in FBA)
- **Targeting Type**: Automatic Targeting (`استهداف تلقائي`)
- **Daily Budget**: **10.00 EGP / day**
- **Bidding Strategy**: `Dynamic bids - down only` (`عطاءات ديناميكية - تخفيض فقط`)
  - *Engineering Rationale*: Prevents Amazon from inflating bids during high-traffic auctions without historical conversion proof.
- **Default Bid**: **0.80 EGP** (Conservative test entry)
- **Targeting Group Adjustments**:
  - Close-match (`مطابقة وثيقة`): Active (Default 0.80 EGP)
  - Loose-match (`مطابقة موسعة`): Active (0.60 EGP)
  - Substitutes (`بدائل`): Active (0.70 EGP)
  - Complements (`مكملات`): Paused or 0.40 EGP (Preserves budget for direct decor intent)
- **Runtime Window**: 7 consecutive days starting upon inventory availability.

---

### Campaign 2: Diamond Pattern Auto Discovery
- **Campaign Name**: `SP_FloraHome_Lilium_Diamond_Auto_Disc`
- **Target ASIN**: `B0HNFC2MDD` (SKU: `FL-LILY-DIAMOND-WHT` | 7 units in FBA)
- **Targeting Type**: Automatic Targeting
- **Daily Budget**: **10.00 EGP / day**
- **Bidding Strategy**: `Dynamic bids - down only`
- **Default Bid**: **0.80 EGP**
- **Targeting Group Adjustments**:
  - Close-match: Active (0.80 EGP)
  - Loose-match: Active (0.60 EGP)
  - Substitutes: Active (0.70 EGP)
  - Complements: Paused
- **Runtime Window**: 7 consecutive days.

---

### Campaign 3: Fluted Origami Pattern Auto Discovery
- **Campaign Name**: `SP_FloraHome_Lilium_Fluted_Auto_Disc`
- **Target ASIN**: `B0HNF8SBZ7` (SKU: `FL-LILY-FLUTED-WHT` | 4 units in FBA)
- **Targeting Type**: Automatic Targeting
- **Daily Budget**: **10.00 EGP / day**
- **Bidding Strategy**: `Dynamic bids - down only`
- **Default Bid**: **0.80 EGP**
- **Targeting Group Adjustments**:
  - Close-match: Active (0.80 EGP)
  - Loose-match: Active (0.60 EGP)
  - Substitutes: Active (0.70 EGP)
  - Complements: Paused
- **Runtime Window**: 7 consecutive days.

---

## 3. Negative Keyword Defense Wall (Seed Negatives)

To protect the 10 EGP daily budgets from bleeding into irrelevant search traffic, enter these negative phrase keywords (`Negative Phrase`) into all 3 automatic campaigns on Day 1:

```text
زرع طبيعي
ورد طبيعي
شجر كبير
بذور
سماد
تربة
احواض حدائق
احواض زراعة
فازة زجاج كبيرة
فازات كريستال كبيرة
صالون مذهب كلاسيك
```

---

## 4. Seven-Day Test Protocol & Optimization Rules

During the 7-day testing window, observe the following disciplined operational cadence:

### Days 1 to 3: Pure Machine Learning Observation
- **Rule**: Do **NOT** alter bids or budgets during the first 72 hours.
- Allow the algorithm to explore indexing without human interference.
- Only intervene if an individual search query consumes > 5.00 EGP with 0 impressions/clicks on non-decor terms.

### Days 4 to 7: Search-Term Harvesting & Pruning
- Export the **Search Term Report** (`إقرارات البحث`) from Amazon Advertising Console.
- Filter queries into two distinct categories:

#### 1. Negative Triggers (Budget Wasters):
- Any customer search term that accumulates:
  - **Clicks ≥ 4** AND **Orders = 0**, OR
  - **Spend ≥ 6.00 EGP** with **0 sales**.
- **Action**: Add immediately as **Negative Exact** (`استبعاد دقيق`) inside the respective campaign.

#### 2. Golden Harvest Candidates (Proven Intent):
- Any customer search term that generates:
  - **Orders ≥ 1** at an ACoS ≤ 25%, OR
  - **Clicks ≥ 3** with high click-through rate (CTR > 1.2%) clearly describing desk or home decor Lilium flowers.
- **Action**: Log into the candidate list for Phase 2.

---

## 5. Phase 2 Gate: Conditions for Manual Exact Campaigns

Manual Exact campaigns will be constructed **ONLY** when the 7-day automatic testing phase delivers confirmed market evidence.

### Graduation Criteria
A search term qualifies for migration into a dedicated manual exact campaign if and only if:
1. It generated at least **1 confirmed order** during the 7-day auto phase.
2. Its physical relevance matches the product specifications (e.g. `ورد ليليام صناعي`, `فازة ورد للمكتب`, `تنسيق ورد مع فازه`).
3. Total remaining pilot inventory is sufficient to support accelerated sales velocity.

### Phase 2 Campaign Blueprint (Draft Specification)
- **Campaign Name**: `SP_FloraHome_Lilium_Harvest_Exact`
- **Targeting**: Manual Targeting > Keyword Targeting > **Exact Match**
- **Candidate Terms**: Strictly populated from the Search Term Report.
- **Bid**: Set to the winning cost-per-click (`Actual CPC`) from the auto campaign + 10%.

---

## 6. Next Actions: Seller Central Manual Verification Checklist

The user must manually verify and execute the following steps inside Amazon Advertising Console (`Advertising > Campaign Manager`):

- [ ] **1. Verify Advertising Account & Billing (`Advertising > Billing & Payments`)**:
  - Ensure the payment method for advertising charges is active and verified.
- [ ] **2. Confirm Inactive / Paused State Before Inventory Check-In**:
  - Build the 3 campaigns as drafts or leave them in `Paused` status until FC check-in confirmation is received.
- [ ] **3. Inspect Featured Offer Eligibility on Launch Day**:
  - Before turning any campaign to `Active`, visit each child ASIN page on amazon.eg from an incognito browser.
  - Confirm that the listing features the active "Buy Now" button for CasaArt Decor.
- [ ] **4. Input Seed Negative Keywords**:
  - Under each of the 3 auto campaigns, open `Negative Targeting` and add the 11 seed negative phrases listed in Section 3.
- [ ] **5. Download Search Term Report on Day 7 (`Measurement & Reporting > Reports`)**:
  - Select Report Type: `Sponsored Products > Search Term`.
  - Date Range: Last 7 days.
  - Review queries before setting up any manual campaigns.
