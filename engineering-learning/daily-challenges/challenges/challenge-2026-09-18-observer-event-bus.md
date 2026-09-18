# Challenge: Event-Driven Order Processing with Observer Pattern 📡⚡

> **Date**: 2026-09-18  
> **Topic**: Behavioral Design Patterns - The Observer Pattern / Type-Safe Event Bus  
> **Author / Student**: Abdullah Mahmoud Fawzy (Abdo)  
> **Mentor**: Blue (بلو)  
> **Target Solution File**: [solution-2026-09-18-observer-event-bus.ts](file:///c:/Users/A5/Desktop/growth-workspace-withAI/engineering-learning/daily-challenges/my-solutions/solution-2026-09-18-observer-event-bus.ts)

---

## 🎯 Business Context & The Problem
In our decor e-commerce platform, when an order is placed and paid, multiple independent systems need to react immediately:
1. **Inventory System**: Must deduct product quantities from the warehouse stock.
2. **Analytics / Audit System**: Must log financial revenue and buyer metrics for the daily dashboard.
3. **Notification System**: Must send confirmation alerts to the buyer (WhatsApp / Email).
4. **Loyalty System**: Must calculate and award reward points to the customer's account.

### The Anti-Pattern (What we must avoid):
In typical fragile codebases, the `CheckoutService` directly calls every service one by one:
```typescript
await inventory.deduct(...);
await analytics.track(...);
await notifications.send(...);
await loyalty.addPoints(...);
```
**Why this rots the architecture**:
- Violates the Single Responsibility Principle: Checkout now has 4+ distinct reasons to change.
- Violates the Open/Closed Principle: Every time marketing wants a new feature (e.g. sending a discount coupon for the next purchase), `CheckoutService` must be reopened and modified.
- Tight Coupling: If the Analytics service is slow or down, it can delay or crash the entire checkout transaction.

---

## 📋 Business Requirements & Constraints

We need an **Event-Driven Architecture** powered by a **Type-Safe Event Bus (Observer Pattern)**:

### 1. The Core Events:
- An event named `order:placed` carrying event payload data: `orderId`, `customerPhone`, `items` (productId, quantity), `totalAmount`, `placedAt`.
- An event named `inventory:low` carrying: `productId`, `remainingStock`.

### 2. The Type-Safe Event Bus Requirements:
- **Subscription Mechanism**: Observers/listeners can subscribe to specific events (`subscribe(eventName, handler)`).
- **Unsubscription / Cleanup**: Subscribing should return an unsubscribe cleanup function (or method) to prevent memory leaks.
- **Type Safety**: The event bus MUST be strictly typed using TypeScript generics or mapped types. If someone subscribes to `order:placed`, the handler parameter MUST automatically infer the exact payload of `order:placed`, not `any` or `unknown`.
- **Fault Isolation**: If one listener throws an error (e.g. Analytics database timeout), other listeners MUST still execute, and the core event publisher must not crash.

---

## 🛠️ Your Mission (Step-by-Step Architecture)

Open your solution file and build this system from scratch:

1. **Phase 1: Event Map & Types**
   - Define the events dictionary type mapping event names to their specific typed payloads.
2. **Phase 2: Observer Contracts**
   - Define the Event Bus / Observer interface.
3. **Phase 3: The Concrete Event Bus Implementation**
   - Implement the generic, type-safe Event Bus class with subscription, unsubscription, and safe broadcast.
4. **Phase 4: Independent Listeners**
   - Implement at least 3 decoupled listeners: Inventory Listener, Analytics Listener, Notification Listener.
5. **Phase 5: Simulation & Verification**
   - Show `CheckoutService` publishing `order:placed` and all listeners reacting independently.
   - Prove that when one listener throws an error, the others still succeed.

Write your entire code from scratch in:  
`engineering-learning/daily-challenges/my-solutions/solution-2026-09-18-observer-event-bus.ts`
