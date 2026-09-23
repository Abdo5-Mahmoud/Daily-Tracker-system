# Workspace Engineering & Quality Governance Protocol 🛡️⚡

> **Scope**: All sessions, agent operations, and coding workflows in this workspace.

---

## 1. The Superpowers Iron Laws

### The Iron Law of TDD:
- **NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST**.
- Write the minimal failing test first (Red).
- Confirm failure with `run_command` (inspect exit code and stderr).
- Implement minimal code to pass (Green).
- Refactor cleanly without changing behavior.

### Verification Before Completion:
- **EVIDENCE BEFORE ASSERTIONS ALWAYS**.
- Never claim a task, fix, or feature is complete without executing the verification command via `run_command`.
- Confirm exit code 0 and actual passing logs before reporting completion.

### Timeboxed Autonomous Debugging:
- 15–20 minutes hard cap on autonomous debugging.
- Isolate variables, inspect logs manually.
- If unresolved after 20 minutes, intervene with the exact architectural explanation.

---

## 2. Pedagogical Progression & Concept Synchronization

### The 4-Stage Ground-Up Systems & Database Pedagogy:
- **No Black-Box Tooling**: Never introduce an ORM (`Prisma`, `Mongoose`), query builder, or database migration tool before establishing the foundational theory.
- **Strict 4-Stage Progression**:
  1. **Mathematical Foundations**: Set theory, relations as Cartesian product subsets, relational algebra.
  2. **Engine Mechanics**: Relational SQL (PostgreSQL) vs Document NoSQL (MongoDB), ACID transactions, B-Tree indexes, lock contention.
  3. **Domain Modeling on Paper**: Entity relationships (1:1, 1:N, M:N), normalization (1NF/2NF/3NF), cardinality constraints.
  4. **Tooling as Pure Execution**: ORM syntax introduced ONLY as a convenience tool to generate SQL, never as magic.

### Mandatory Challenge-to-Notes Sync:
- **Never Stop at Code**: Solving a challenge is only Step 1.
- Every completed challenge MUST immediately be synthesized into:
  1. A structured Concept Card in `engineering-learning/LEARNING_NOTES.md` (Intuition for 10yo, Production Reality & Code snippet, 3-Step Reality Check).
  2. The Table of Contents in `LEARNING_NOTES.md`.
  3. The index under Section 1 in `MASTER_KNOWLEDGE_BASE.md`.

---

## 3. Continuous Version Control & Git Discipline

- **Automatic Sync**: Any completed code change, test passage, challenge completion, or documentation update MUST be automatically staged, committed with a clean semantic commit message, and pushed to GitHub (`origin/main`).
- Do NOT wait for the user to explicitly ask "push to github". Proactively execute `git add`, `git commit`, and `git push` as part of concluding any task.
- Ensure PowerShell command syntax is used (`git add ...; git commit -m "..."; git push origin main`).

---

## 4. Strict Text Formatting Standard

- In all responses and markdown updates:
  - Every single line must be either **100% Arabic** or **100% English**.
  - NEVER drop an English word inside an Arabic sentence.
  - English terms, file paths, and code snippets must be on separate lines or in code blocks.
