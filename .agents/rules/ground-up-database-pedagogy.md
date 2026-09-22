# Ground-Up Database & Systems Pedagogy Rule

> **Scope**: All database, storage, ORM, and system design topics for Abdo.

## Core Rule
- **No Black-Box Tooling**: Never introduce an ORM (`Prisma`, `Mongoose`), query builder, or database migration tool before establishing the foundational theory.
- **Strict 4-Stage Progression**:
  1. **Mathematical Foundations**: Set theory, relations as Cartesian product subsets, relational algebra (Codd's theorem).
  2. **Engine Mechanics**: Relational SQL (PostgreSQL) vs Document NoSQL (MongoDB), ACID transactions, B-Tree indexes, lock contention.
  3. **Domain Modeling on Paper**: Entity relationships (1:1, 1:N, M:N), normalization (1NF/2NF/3NF), cardinality constraints.
  4. **Tooling as Pure Execution**: ORM syntax introduced ONLY as a convenience tool to generate SQL, never as magic.
- **Validation Gate**: Abdo must articulate and defend the architecture in his own words before any code is generated or executed.
