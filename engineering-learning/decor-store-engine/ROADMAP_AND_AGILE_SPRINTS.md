# Decor Store Commerce Engine: Agile Roadmap & Engineering Syllabus 🛒🏛️

> **Client Context**: CasaArt Decor (Local retail store in Elwraq, Giza expanding into digital commerce & Amazon Egypt).
> **Development Methodology**: Modern Agile Vertical Slicing (1-Week Iterative Sprints).
> **Target Roles**: Frontend Engineer & Fullstack TypeScript Engineer (Next.js 16 • React 19 • PostgreSQL • Prisma).

---

## 1. Why Agile Sprints over Waterfall? (لماذا أجايل وليس وترفول؟)

### The Legacy Waterfall Trap (فخ الوترفول القديم)
- Spending 2 months writing abstract documentation and full-system architecture before writing any code.
- High risk of building the wrong thing, getting stuck in theoretical rabbit holes, and discovering critical flaws only at the very end.

### The Modern Agile Vertical Slicing Standard (المعيار الحديث للشركات الكبرى)
- Work is organized into **1-Week Agile Sprints**.
- Each sprint delivers a complete, production-grade **Vertical Slice** (Database Schema -> API Route / Server Action -> Validation -> Test Verification).
- By the end of every sprint, there is a functional, demonstrable feature that directly serves the client (the store) and becomes an active talking point for technical interviews.

---

## 2. The 4-Sprint Agile Roadmap

### Sprint 1: Relational Modeling & Catalog Slice
- **Agile User Story**: As the store owner, I need a centralized relational catalog for artificial trees, flowers, and crystal pieces with variants (size, color, weight) so that my inventory is accurately tracked.
- **Foundational Theory**:
  - SQL Relational vs Document NoSQL vs In-Memory trade-offs.
  - ACID properties and relational integrity.
  - One-to-Many and Many-to-Many modeling with Junction Tables.
  - B-Tree indexing and avoiding Full Table Scans.
- **Technical Deliverables**:
  - `PostgreSQL` database setup (Cloud / Local).
  - `Prisma` schema with `Product`, `ProductVariant`, and `Category` models.
  - Database migrations and seed script with real CasaArt Decor inventory data.
- **Definition of Done (DoD)**:
  - Migrations execute cleanly without errors.
  - Seed script successfully populates real products.
  - Abdo defends the schema choices in a 15-minute mock interview review.

### Sprint 2: Order Lifecycle & Transactional Integrity Slice
- **Agile User Story**: As a customer, I want to place an order containing multiple items, and as the store owner, I need the system to automatically deduct stock and prevent selling items that are out of stock.
- **Foundational Theory**:
  - Race conditions and concurrency in inventory systems.
  - Optimistic vs. Pessimistic Locking.
  - Interactive database transactions (`$transaction` in Prisma).
  - Idempotency keys to prevent duplicate order submissions.
- **Technical Deliverables**:
  - `Order`, `OrderItem`, and `Customer` relational models.
  - Atomic checkout transaction service: verifies stock, creates order, decrements inventory in a single atomic transaction.
  - Order status state machine (`PENDING`, `PROCESSING`, `SHIPPED`, `DELIVERED`, `CANCELLED`).
- **Definition of Done (DoD)**:
  - Concurrency tests prove that two simultaneous orders for the last in-stock item cannot both succeed.
  - Transaction rolls back completely if any single item fails.

### Sprint 3: API Security, Authentication & Access Control Slice
- **Agile User Story**: As the store owner, I need a protected administration portal where only authenticated staff can update prices and manage inventory, while regular customers can only view catalog items and track their own orders.
- **Foundational Theory**:
  - Authentication architectures: JWT vs server-side sessions.
  - Security boundaries: `HttpOnly` / `Secure` / `SameSite` cookies vs localStorage vulnerabilities (XSS / CSRF).
  - Role-Based Access Control (RBAC): Admin vs Customer permissions.
  - Defensive API boundary validation with Zod.
- **Technical Deliverables**:
  - Secure authentication flow with hashed passwords and refresh token rotation.
  - Role-based middleware protecting admin API routes.
  - Zod schemas validating all incoming request payloads with custom domain errors.
- **Definition of Done (DoD)**:
  - Unauthorized requests to admin routes are blocked with HTTP 401/403.
  - Token refresh occurs seamlessly without logging out valid active sessions.

### Sprint 4: Live Dashboard, Server State & Production Packaging
- **Agile User Story**: As the store owner, I need an instant, responsive dashboard to view live orders, sales metrics, and low-stock alerts without constant page reloads.
- **Foundational Theory**:
  - Server state management with TanStack Query (Caching, Stale Time, Invalidation).
  - Optimistic UI updates with rollback handling on network failure.
  - Isolated Integration Testing using Test Doubles and Test Harnesses.
  - Containerization fundamentals: `Dockerfile` and `docker-compose.yml`.
- **Technical Deliverables**:
  - Fast administrative dashboard built with Next.js 16 and TanStack Query.
  - Automated integration test harness verifying the entire checkout-to-fulfillment flow.
  - Single-command `docker-compose` setup running the app and PostgreSQL container.
- **Definition of Done (DoD)**:
  - Dashboard updates reactively upon order creation without page reloads.
  - Entire application boots locally via `docker compose up` with zero manual configuration.

---

## 3. The Multi-Agent Governance Model During Sprints
1. **JEV**: Enforces strict vertical scoping for each sprint; prevents feature creep.
2. **Qwen**: Provides architectural patterns, TypeScript idioms, and code review.
3. **Nemotron**: Conducts weekly mock interview grilling on the completed sprint and probes edge cases.
4. **Antigravity**: Supreme orchestration, sprint retro logging, and daily accountability.
