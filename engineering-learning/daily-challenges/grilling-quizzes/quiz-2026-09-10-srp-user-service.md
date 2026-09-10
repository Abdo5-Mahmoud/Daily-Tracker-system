# Grilling Quiz: Single Responsibility Principle (SRP) & Architectural Traps 🧠🔥

> **Date**: 2026-09-10  
> **Challenge**: `challenges/challenge-2026-09-10-srp-user-service.md`  
> **Solution Under Audit**: `solutions/solution-2026-09-10-srp-user-service.ts`

---

## 🎯 The 3 Grilling Probes (Must Defend 100%)

### Probe 1: The Partial Failure & Asynchronous Email Trap
- **Scenario**: In `UserService.register`, you dispatch `this.emailService.sendWelcomeEmail(user.email)`.
- **Question**: If SMTP takes 15 seconds to time out, does the user wait 15 seconds before getting their `201 Created` HTTP response? If so, why is this an architectural flaw, and how do you decouple email dispatch so the client response returns in < 100ms?
- **Grilling Check**: Explain the role of Next.js `after()` or an external background job queue (e.g. BullMQ / Redis / QStash) vs inline `await`.

---

### Probe 2: SRP Boundary in Validation
- **Scenario**: Some developers put schema validation (e.g., Zod checks) inside the `UserService`, while others put it in the `POST` route handler (Controller).
- **Question**: From an SRP perspective, who is responsible for validating that an email is a valid email string vs validating that the email is not already taken in the database?
- **Grilling Check**: What is the architectural difference between **Format Validation (Syntactic)** and **Domain Business Rule Validation (Semantic)**?

---

### Probe 3: Unit Testing Isolation (Mocking Verification)
- **Scenario**: You want to write a Jest unit test for `UserService.register`.
- **Question**: Because you applied SRP and dependency injection, how many external dependencies do you need to spin up to test `UserService`? Do you need a running MongoDB database or a working Nodemailer credentials config?
- **Grilling Check**: Defend why SRP makes code 10x easier to test compared to the original monolithic `POST` handler.

---

## 🏆 Audit Results & Sign-Off (2026-09-10)
- **Status**: PASSED (Score: 9.8 / 10) 🚀
- **Auditor**: Antigravity Engineering Mentor
- **Key Traps Successfully Resolved by Abdo**:
  1. `findByEmail` returns `null` safely without throwing false 500 errors.
  2. `memoryUsers` preserved at module level to prevent state wipe across requests.
  3. Safe runtime guard `if (!rawBody || typeof rawBody !== "object")` to eliminate `null` property reading crashes.
  4. Scheduled background email using Next.js `after()` to decouple response latency and prevent serverless freezing.

