# Daily Challenge: Third-Party Integration with Adapter Pattern 🔌⚡

> **Date**: 2026-09-17  
> **Topic**: Structural Design Patterns - The Adapter Pattern (Object Adapter vs. Interface Incompatibilities)  
> **Target Solution File**: [solution-2026-09-17-adapter-payment-gateway.ts](file:///c:/Users/A5/Desktop/growth-workspace-withAI/engineering-learning/daily-challenges/solutions/solution-2026-09-17-adapter-payment-gateway.ts)  
> **Target Quiz File**: [quiz-2026-09-17-adapter-payment-gateway.md](file:///c:/Users/A5/Desktop/growth-workspace-withAI/engineering-learning/daily-challenges/grilling-quizzes/quiz-2026-09-17-adapter-payment-gateway.md)

---

## 🎯 The Mission
You are maintaining an existing production e-commerce engine where the `OrderService` processes transactions via an established internal contract: `PaymentGateway`.

Management just signed a contract with Stripe. The external `StripeSDK` arrives with completely incompatible method signatures and unit representations:
- Our internal contract uses `pay(amount: number): PaymentResult` (amounts in primary currency units, e.g. $10.50).
- Stripe expects `makePayment(amountInCents: number, currency: string): StripeChargeResponse` (integer cents, e.g. 1050, plus ISO currency).
- Stripe throws proprietary `StripeAPIError` when a card fails or the network drops.

**Strict Architectural Constraint**:
1. `OrderService` MUST NOT be modified (zero vendor lock-in, OCP-compliant).
2. `PaymentGateway` interface MUST NOT be modified (domain contract integrity).
3. `StripeSDK` MUST NOT be modified (it is a third-party npm package).

You must write a clean, production-grade `StripePaymentAdapter` that bridges this architectural chasm.

---

## 📋 Architectural Requirements

### 1. The Core Entities
- **Target Interface**: `PaymentGateway`
- **Client**: `OrderService`
- **Adaptee (Vendor)**: `StripeSDK`
- **Adapter (Your Code)**: `StripePaymentAdapter`

### 2. Required Behaviors inside `StripePaymentAdapter`:
1. **Dependency Injection**: Inject `StripeSDK` instance and a default `currency` configuration into the constructor.
2. **Unit Conversion**: Safely convert decimal currency units to integer cents without floating-point precision loss (`Math.round(amount * 100)`).
3. **Error Normalization**: Catch vendor-specific exceptions (`StripeAPIError`) and map them into the domain's standardized `PaymentResult` or clean domain exceptions (`PaymentGatewayError`).
4. **Audit Metadata**: Ensure the returned `PaymentResult` contains the vendor transaction ID, timestamp, and success status.

---

## ⚠️ Anti-Failure Guardrails (Strict Grilling Criteria)
1. **Floating Point Trap**: What happens with `$19.99` in JavaScript? `19.99 * 100 = 1998.9999999999998`. If you do `Math.floor()`, you charge 1998 cents ($19.98) and steal 1 cent or fail vendor validation. You MUST use integer rounding.
2. **Negative/Zero Amount Guard**: The adapter must reject negative or zero amounts before calling the external SDK.
3. **Vendor Error Leakage**: Raw Stripe errors must never bubble uncaught to the client. The adapter is an isolation firewall.
