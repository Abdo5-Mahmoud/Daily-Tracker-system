# Challenge: Decor Store Shipping & Tracking Engine 🚚📦

> **Date**: 2026-09-17  
> **Topic**: Requirements-First Architecture & Design Patterns Integration (SOLID + Adapter + Strategy)  
> **Author / Student**: Abdullah Mahmoud Fawzy (Abdo)  
> **Mentor**: Blue (بلو)  
> **Target Solution File**: [solution-2026-09-17-decor-shipping-engine.ts](file:///c:/Users/A5/Desktop/growth-workspace-withAI/engineering-learning/daily-challenges/my-solutions/solution-2026-09-17-decor-shipping-engine.ts)

---

## 🎯 Business Context & Requirements
Our local decoration store in Warraq is expanding into nationwide e-commerce. We need a robust shipping and tracking subsystem to fulfill customer orders.

### 1. The Core Business Flow:
1. When a customer places an order for home decor items (e.g. crystal artifacts, lighting fixtures), each product has a weight measured in kilograms (`kg: number`), and the customer provides their shipping address as a single text line (e.g., `"12 Al-Galaa St, Warraq, Giza, Apt 4"`).
2. The order can be prepaid online or marked as Cash on Delivery (COD). If COD, an exact collection amount must be declared.

### 2. External Vendor Integration (Bosta Shipping SDK):
We have partnered with "Bosta", but their proprietary SDK has strict and incompatible requirements:
- **Weight**: Rejects kilograms. It strictly accepts weights in **integer grams** (e.g. `2.5 kg` must be sent as `2500`).
- **Address**: Rejects single-line strings. It requires a structured object:
  ```json
  {
    "city": "Giza",
    "district": "Warraq",
    "street": "Al-Galaa St",
    "buildingNumber": "12"
  }
  ```
- **COD Declarations**: Requires `codAmount` in integer piasters or cents with an ISO currency code.
- **Return Type**: Generates a proprietary `BostaShipmentResponse` containing a tracking code (`awb: string`) and estimated delivery date.

### 3. Business Side-Effects (Notifications & Logging):
- Once the waybill is created, the system must immediately dispatch an automated WhatsApp notification to the customer containing their tracking code and tracking URL.
- If the notification service fails (e.g. WhatsApp API timeout), the shipping order MUST NOT fail or roll back.

### 4. Future Vendor Scalability:
- Next month, management plans to onboard a second carrier ("Aramex") for expedited international delivery, and potentially a third carrier later.
- The core checkout and fulfillment engine MUST NOT be modified when switching carriers or adding new ones.

---

## 📋 Your Mission (The New Protocol)

You are not just filling in methods. You are designing this subsystem from scratch:

1. **Phase 1: Domain Modeling & Types**
   - Extract domain entities, value objects, and types (Order, Weight, Address, ShippingStatus).
2. **Phase 2: Unified Interface & Contracts**
   - Design the clean internal contract that our core system will talk to (e.g. `ShippingCarrier`).
3. **Phase 3: Pattern Selection & Implementation**
   - Choose and implement the pattern that adapts Bosta's incompatible SDK to our contract.
   - Choose and implement the pattern that allows swapping Bosta with Aramex dynamically.
   - Separate the notification logic following the Single Responsibility Principle.
4. **Phase 4: Orchestration**
   - Write the orchestrator service that coordinates shipping creation and customer notification.

Write your entire architecture and code from scratch in:  
`engineering-learning/daily-challenges/my-solutions/solution-2026-09-17-decor-shipping-engine.ts`
