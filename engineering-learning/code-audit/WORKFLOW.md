# Code Audit & Production Readiness Workflow (`/code-audit`) 🛡️💻

> **Trigger**: Run before merging or deploying any feature in `Devfolio` or learning modules.

---

## 1. Pipeline Folder Structure
- `staged/`: Place code files or components that require review here.
- `reports/`: Markdown reports evaluating architectural soundness, edge cases, error resilience, and performance.
- `production-fixes/`: Production-grade refactored versions implemented cleanly by Abdo.

---

## 2. Execution Steps
1. **Intake & Scope Definition**:
   - Inspect files placed in `staged/` (or specified by path).
   - Identify component responsibility, data flow, external dependencies, and state boundaries.
2. **Multi-Angle Audit**:
   - **Architectural Soundness**: Separation of concerns, coupling, state persistence.
   - **Error Handling & Resilience**: Graceful degradation, HTTP status semantics, network timeouts.
   - **Performance & Scalability**: Unnecessary re-renders, bundle bloat, caching efficacy.
   - **Type Safety**: Zero `any` leaks, strict schemas (e.g. Zod).
3. **Report Generation**:
   - Generate `reports/audit-[feature-name]-[date].md`.
   - Score readiness from 1 to 10 with direct, actionable engineering feedback.
4. **Hands-on Re-implementation**:
   - Abdo writes the corrected code in `production-fixes/` to internalize the lessons.
