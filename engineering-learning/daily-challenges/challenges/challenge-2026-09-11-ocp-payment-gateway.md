# Daily Challenge: Extensible Multi-Provider Payment Gateway with OCP 💳⚡

> **Date**: 2026-09-11  
> **Topic**: Open/Closed Principle (OCP) & Extensible Strategy Registry (Open for Extension, Closed for Modification)  
> **Target Solution File**: `engineering-learning/daily-challenges/solutions/solution-2026-09-11-ocp-payment-gateway.ts`  
> **Target Quiz File**: `engineering-learning/daily-challenges/grilling-quizzes/quiz-2026-09-11-ocp-payment-gateway.md`

---

## 🎯 The Mission
Refactor a legacy, fragile checkout processor that uses a rigid `switch(method)` statement into an **Open/Closed compliant architecture**:
1. **The Core Contract**: An interface defining payment processing behavior.
2. **Concrete Strategies**: Independent, isolated processor classes for `CreditCardProcessor`, `FawryProcessor`, and `VodafoneCashProcessor`.
3. **The Strategy Registry**: A centralized registry where payment processors register themselves dynamically.
4. **The Checkout Service**: Orchestrates payments purely through the registry, without knowing or modifying any provider-specific code.
5. **The Extension Test**: Add a 4th payment provider (`InstapayProcessor`) purely by extending the system, with **ZERO modifications** to existing classes or the checkout service!

---

## 📋 File Architecture & Interfaces

### 1. Types & Data Models:
```typescript
export interface PaymentOrder {
  orderId: string;
  amount: number;
  currency: "EGP" | "USD";
  customerEmail: string;
}

export interface PaymentResult {
  success: boolean;
  transactionId: string;
  provider: string;
  timestamp: Date;
  errorMessage?: string;
}
```

### 2. The Clean OCP Contracts:
- `interface PaymentStrategy`:
  ```typescript
  export interface PaymentStrategy {
    readonly providerKey: string;
    processPayment(order: PaymentOrder): Promise<PaymentResult>;
  }
  ```
- `class PaymentRegistry`:
  - `register(strategy: PaymentStrategy): void`
  - `get(providerKey: string): PaymentStrategy`
- `class CheckoutService`:
  - Coordinates payment execution using the registry.
  - Returns `PaymentResult` or throws an explicit domain error if the provider is unsupported.

---

## ⚠️ Anti-Failure Guardrail (Strict Edge Cases)
1. **Unsupported Provider**: If a customer passes an unknown provider (e.g. `"crypto"`), the registry must not crash with an uncaught `TypeError: Cannot read properties of undefined (reading 'processPayment')`. It must throw a clear, handled domain error.
2. **Zero Modification Proof**: You must prove OCP compliance by demonstrating that adding `InstapayProcessor` requires **only adding a new class**, without editing a single line of `CheckoutService` or `PaymentRegistry`.
