# Daily Challenge: Liskov Substitution Principle (LSP) - Safe Refund Processing 💳🛡️

> **Date**: 2026-09-13  
> **Topic**: Liskov Substitution Principle (LSP), Behavioral Subtyping, and Contract Integrity  
> **Target Solution File**: `engineering-learning/daily-challenges/solutions/solution-2026-09-13-lsp-refund-gateway.ts`  
> **Target Quiz File**: `engineering-learning/daily-challenges/grilling-quizzes/quiz-2026-09-13-lsp-refund-gateway.md`

---

## 🎯 The Mission (The Real-World Context)
In our e-commerce platform, customers can pay using multiple payment methods (`CreditCard`, `PayPal`, `CashOnDelivery`).
The legacy system defined a generic base contract:
```typescript
interface PaymentGateway {
  charge(amount: number): Promise<boolean>;
  refund(transactionId: string, amount: number): Promise<boolean>;
}
```

### The Production Disaster:
An automated nightly batch worker iterates over all returned orders and calls `gateway.refund()`.
When it reached orders paid via `CashOnDeliveryGateway` (or physical kiosk payments), the class threw:
`throw new Error("Cash on delivery cannot be refunded online!");`

**The result**: The unhandled error crashed the entire nightly batch worker, halting refunds for hundreds of other valid credit card customers!

---

## ⚠️ The Core LSP Rule
> **"Subtypes must be substitutable for their base types without altering the correctness of the program."**

If a subtype implements an interface but throws an "Operation not supported" error or violates the expected behavior of the base contract, **it is a direct violation of LSP**.

---

## 📋 The Architectural Specifications & Contracts

### 1. Data Models (Inputs & Outputs)
- **`RefundRequest`**:
  - `orderId`: string
  - `transactionId`: string
  - `amount`: number
  - `reason`: string
- **`RefundResult`**:
  - `success`: boolean
  - `refundId`: string
  - `processedAt`: Date
  - `errorMessage`: string (optional)

---

### 2. The Segregated Interfaces (Method Contracts)

#### Interface A: `ChargeableGateway`
- `readonly gatewayName: string`
- `charge(amount: number): Promise<{ success: boolean; transactionId: string }>`
  - **Input**: `amount` (number)
  - **Output**: `Promise<{ success: boolean; transactionId: string }>`

#### Interface B: `RefundableGateway`
- `readonly gatewayName: string`
- `refund(request: RefundRequest): Promise<RefundResult>`
  - **Input**: `request` (`RefundRequest`)
  - **Output**: `Promise<RefundResult>`

---

### 3. Concrete Classes to Build

1. **`CreditCardGateway`**:
   - Implements both `ChargeableGateway` and `RefundableGateway`.
   - `gatewayName`: `"CreditCard"`
   - Generates simulated transaction ID and refund ID.

2. **`PayPalGateway`**:
   - Implements both `ChargeableGateway` and `RefundableGateway`.
   - `gatewayName`: `"PayPal"`
   - Generates simulated PayPal transaction ID and refund ID.

3. **`CashOnDeliveryGateway`**:
   - Implements ONLY `ChargeableGateway`.
   - `gatewayName`: `"CashOnDelivery"`
   - Does NOT implement `refund` at all! Zero fake methods, zero throwing errors.

---

### 4. The Consumer Service: `RefundBatchWorker`
- `processRefunds(gateway: RefundableGateway, requests: RefundRequest[]): Promise<RefundResult[]>`
  - **Inputs**:
    - `gateway`: strictly accepts `RefundableGateway`
    - `requests`: array of `RefundRequest`
  - **Output**: `Promise<RefundResult[]>` (an array containing the result of each refund)
  - **Loop**: iterates over each request, awaits `gateway.refund(req)`, and aggregates results.

---

### 5. Verification Test
- Call `worker.processRefunds` with `new CreditCardGateway()`.
- Substitute `new PayPalGateway()` seamlessly (100% behavioral interchangeability).
- Show that passing `new CashOnDeliveryGateway()` is rejected by TypeScript at compile-time!
