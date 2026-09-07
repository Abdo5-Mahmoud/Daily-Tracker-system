# Daily Engineering Challenge Workflow (`/daily-challenge`) 🧠⚡

> **Trigger**: Executed daily at 8:30 AM during the morning deep-work block.

---

## 1. Pipeline Folder Structure
- `challenges/`: Daily problem specifications rotating across Design Patterns, Applied Algorithms, and Modern Stack.
- `solutions/`: Clean TypeScript/React code implementations written manually by Abdo.
- `grilling-quizzes/`: Relentless multi-angle edge cases and interview questions to verify depth.

---

## 2. Challenge Syllabus Rotation
1. **Design Patterns**: Strategy, Factory, Observer, Adapter, Middleware, Builder.
2. **Applied Algorithms**: LRU Cache, Debounce/Throttle, Tree traversal (nested layouts), Graph BFS/DFS (dependency resolution).
3. **Modern Stack**: Next.js App Router, React Server Components (RSC), Zod validation, WebSockets, Server Actions.

---

## 3. Execution Steps
1. **Challenge Generation**:
   - Generate `challenges/challenge-[date]-[topic].md` using the 3-step pedagogy (ELI10 + Senior Logic + Initial Problem Statement).
2. **Hands-on Implementation**:
   - Abdo writes the solution in `solutions/solution-[date]-[topic].ts`.
3. **Relentless Grilling Protocol**:
   - Deliver 2-3 edge-case failure probes in `grilling-quizzes/quiz-[date]-[topic].md`.
   - Require Abdo to defend or patch the code before logging mastery into `LEARNING_NOTES.md`.
