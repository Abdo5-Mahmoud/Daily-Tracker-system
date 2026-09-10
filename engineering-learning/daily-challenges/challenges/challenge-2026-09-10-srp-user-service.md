# Daily Challenge: Refactoring User Registration with SRP 🏗️⚡

> **Date**: 2026-09-10  
> **Topic**: Single Responsibility Principle (SRP) & Clean Layered Architecture (Controller ➔ Service ➔ Repository ➔ Notification)  
> **Target Solution File**: `engineering-learning/daily-challenges/solutions/solution-2026-09-10-srp-user-service.ts`  
> **Target Quiz File**: `engineering-learning/daily-challenges/grilling-quizzes/quiz-2026-09-10-srp-user-service.md`

---

## 🎯 The Mission
Take a monolithic, 5-responsibility registration route handler and refactor it into 4 isolated, single-responsibility layers:
1. **Layer 1: Input Validation**: Pure validation function returning typed safe data or throwing validation errors.
2. **Layer 2: Password Security (Hasher)**: A dedicated utility/service interface for hashing and verifying credentials.
3. **Layer 3: Data Access (User Repository)**: Handles database persistence and uniqueness checks.
4. **Layer 4: Notification (Email Service)**: Handles email dispatch asynchronously with isolated error trapping to prevent partial failures.
5. **Layer 5: Orchestration (User Registration Service)**: Coordinates the business flow.
6. **Layer 6: Clean Route Controller**: Handles HTTP parsing, status codes, and delegates to the service layer.

---

## 📋 File Architecture & Interfaces

### 1. Types & Errors (`types.ts` / local):
```typescript
export interface RegisterUserInput {
  email: string;
  password: string;
}

export interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
}
```

### 2. The Clean Layer Contracts:
- `validateRegisterInput(rawBody: unknown): RegisterUserInput`
- `interface PasswordHasher { hash(password: string): Promise<string>; }`
- `interface UserRepository { findByEmail(email: string): Promise<UserRecord | null>; create(user: Omit<UserRecord, "id">): Promise<UserRecord>; }`
- `interface EmailService { sendWelcomeEmail(toEmail: string): Promise<void>; }`
- `class UserService`: Orchestrates hashing, repository persistence, and triggers background notification.
- `POST(req: Request)`: The controller that maps HTTP requests and responses.

---

## ⚠️ Anti-Failure Guardrail (Strict Requirement)
If `EmailService.sendWelcomeEmail` fails (e.g. SMTP down or timeout), the registration MUST NOT crash with status 500. The user must still receive a `201 Created` response, while the email failure is logged or queued safely without breaking the transaction.
