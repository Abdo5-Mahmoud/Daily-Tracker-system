# Grilling Quiz: The Adapter Pattern & Anti-Corruption Layers 🧠🔥

> **Challenge**: Structural Design Patterns - Adapter Pattern  
> **Target Solution**: `engineering-learning/daily-challenges/solutions/solution-2026-09-17-adapter-payment-gateway.ts`  
> **Student**: Abdullah Mahmoud Fawzy (Abdo)

---

## 🎯 Angle 1: Mental Intuition & Architectural Trade-offs

### Question 1:
In simple plain words (no buzzwords):
Why couldn't we just add `if (this.payment instanceof StripeSDK)` inside `OrderService.checkout()` and call `makePayment()` directly?
What exact architectural rot starts happening in a codebase the moment you allow that shortcut?

Because the oreder service is responsible about talking with the db only, and if we put the payment we violate the SRP by putting more than one reason to change which cause a lot of complixity whenever we wany to add a feature or change the payment gateway or the db 
---

### Question 2:
What is the conceptual difference between the **Adapter Pattern** and the **Strategy Pattern**? Both wrap classes behind an interface. When do you choose an Adapter over a Strategy?
we choose adapter when we want to organise and pervent the layers from talking to each other which cause a lot of complixity.
we choose strategy when we want to give the ability to switch between diffrent implementations of the same interface.

---

## ⚡ Angle 2: Failure Edge-Cases & Defensive Hardening

### Question 3: Floating-Point Precision Trap
In JavaScript, evaluate:
```javascript
const amount = 19.99;
const cents = amount * 100;
console.log(cents); // 1998.9999999999998
```
If a developer writes `Math.floor(amount * 100)` or `parseInt(amount * 100)`, what happens to the vendor API call or the accounting books? How does your adapter ensure mathematical integrity?
if we use floor the store may loose 1 cent for each order because the payment will be ```19.98``` and so on which cause a loss of money. our adapter ensure mathematical integrity by using the correct way to convert by using Math.round

### Question 4: Vendor Error Leakage (Boundary Defense)
Suppose Stripe's servers go down or return a proprietary `StripeAPIError(code: "card_declined")`.
If this error escapes unhandled out of `StripePaymentAdapter.pay()`, how does it impact `OrderService` and your upstream UI? Why must an Adapter act as an **Anti-Corruption Layer (ACL)**?
it will crash the app which lead to a bad user experience. and we have to handle the error in our adapter to prevent it from escaping to the upstream ui.
---

## 🚀 Angle 3: Production Interview Defense

### Question 5:
"In your `StripePaymentAdapter`, where did you get the `currency` parameter from? The domain's `pay(amount: number)` interface doesn't accept a currency. If tomorrow your store supports multi-currency (EGP, USD, EUR) per order, does the Adapter pattern break? How would you refactor the contract cleanly without violating OCP?"

the curerncy right now considered constant because the business logic doesn't support multi currency, but if it will be added in the future we will refactor the contract to accept currency as a parameter or create an interface that accept currency.
but the real logic won't affect much because the archtecture allows us to refactor the contract without breaking the business logic, or violating the OCP.