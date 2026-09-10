# Evening Mental Challenge: Class Design & Naming Intuition 🧠✨

> **Date**: 2026-09-10 (Evening Shop Block)  
> **Target File**: `engineering-learning/daily-challenges/solutions/solution-evening-class-design-intuition.ts`  
> **Goal**: Build mental intuition for decomposing features into classes, naming them cleanly, and setting contracts before writing code.

---

## 🎯 The Rule of Thumb for Classes & Roles
Remember: A class is an **Actor** with a single responsibility.
- If it talks to DB: `[Entity]Repository`
- If it orchestrates business flow: `[Domain]Service`
- If it wraps an external tool/protocol: `[Tool/Protocol][Role]` (e.g. `S3FileUploader`, `TwilioSmsSender`)
- If it calculates or applies a strategy: `[Variant][Role]` (e.g. `PercentageDiscountStrategy`)

---

## 🧩 Exercise 1: The E-Commerce Discount Engine
### The Business Requirement:
An online store has 3 ways to discount an order:
1. `PercentageDiscount` (e.g., 10% off).
2. `FixedAmountDiscount` (e.g., 50 EGP off).
3. `BuyOneGetOneFreeDiscount`.

### Your Task in the Solution File:
1. What is the common `interface` that unites all discount rules? What should its method name and return type be?
2. What are the names of the 3 concrete classes implementing this interface?
3. What is the name of the service class that receives the customer's cart and applies the selected discount?

---

## 🧩 Exercise 2: The Multi-Channel Notification Dispatcher
### The Business Requirement:
When a customer's order is shipped, we must notify them. Today we send an `Email` and an `SMS`. Next month the company wants to add `PushNotification` and `WhatsApp`.

### Your Task in the Solution File:
1. What is the common `interface` that every notification provider must follow?
2. What are the names of the concrete classes for Email and SMS?
3. Who orchestrates sending across multiple channels? Name that class and write its skeleton.

---

## 🧩 Exercise 3: The Profile Avatar Upload Pipeline
### The Business Requirement:
A user uploads an image file from the browser. The system must:
1. Validate file size and mime type (`image/png`, `image/jpeg`).
2. Compress and resize the image.
3. Upload the compressed buffer to an external cloud bucket (e.g., AWS S3).
4. Save the generated public image URL in the database under the user's record.

### Your Task in the Solution File:
Instead of putting all 4 steps in 1 giant function, decompose this into:
- 3 distinct helper/gateway/repository interfaces or classes.
- 1 main service class that coordinates the 4 steps in order.
- Write their names and method signatures.
