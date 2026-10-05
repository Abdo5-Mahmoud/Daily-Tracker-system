# Task Debt & Routine Synchronization Protocol 📋⏰

This document defines the strict operational rules for managing tasks, enforcing timeouts, and rolling over unfinished obligations across Abdo's daily dual blocks.

---

## 1. The Two Non-Negotiable Time Blocks

### Morning Deep Work (8:00 AM - 3:30 PM)
- **Primary Focus**: Engineering mastery, Next.js / TypeScript architecture, algorithm challenges, and career job applications.
- **Rule**: First 90 minutes (10:00 AM - 11:30 AM) protected exclusively for 2 customized job applications before touching editor code.

### Evening Store Operation (4:00 PM - 12:00 AM)
- **Primary Focus**: Decoration retail operations (`Artiflora`), Amazon Egypt inventory packing (`Flora_Home`), visual marketing, and spoken English audio practice.
- **Rule**: Offline business operational focus; no heavy new fullstack architecture started unless scheduled as late maintenance.

---

## 2. The 15-20 Minute Hard Cap for Debugging & Background Tasks

- **Pre-flight Check**: Always run CLI commands with non-interactive flags (`-y`, `--non-interactive`).
- **15-Minute Threshold**: If a command or debugging investigation reaches 15 minutes without definitive progress, pause and re-isolate variables.
- **20-Minute Hard Cutoff**: At 20 minutes, terminate hanging tasks immediately via:
  ```powershell
  powershell -ExecutionPolicy Bypass -File scripts/manage_task_lifecycle.ps1 -MaxAgeMinutes 20 -AutoKill
  ```
  Intervene with the exact architectural solution rather than spiraling into prompt loops.

---

## 3. Task Debt Rollover Lifecycle

Incomplete tasks **NEVER** vanish. If a scheduled task from a block is not completed:
1. **Tag as Task Debt**: Add to the next block's "سجل ديون المهام (Task Debt)" in `PROGRESS_TRACKER.md`.
2. **Log the Bottleneck**: Document why it was postponed (e.g., unexpected supplier delay, blocking CI failure).
3. **Rollover Priority**: In the next active block, Debt tasks take priority before starting new discretionary exploration.
