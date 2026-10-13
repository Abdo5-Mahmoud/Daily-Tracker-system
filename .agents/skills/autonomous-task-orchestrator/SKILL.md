---
name: autonomous-task-orchestrator
description: "Governs background task execution, timeout enforcement (15-20 min cap), GitHub MCP issue synchronization, and strict Task Debt tracking aligned with Abdo's daily routine blocks."
---

# Autonomous Task Orchestrator & Lifecycle Engine ⚙️🛡️

This skill bridges the platform execution primitives (`schedule`, `manage_task`, `run_command`) with external project management (GitHub MCP) and the workspace operating rhythm.

---

## 1. Operating Rules

1. **Pre-flight Execution Contract**:
   - Ensure commands are non-interactive to avoid unbounded background hangs.
   - Synchronous wait threshold (`WaitMsBeforeAsync`) set to reasonable bounded limits (500ms - 5000ms).

2. **15-20 Minute Enforcement**:
   - Long-running background commands must be monitored.
   - Run the task lifecycle auditor regularly:
     ```powershell
     powershell -ExecutionPolicy Bypass -File scripts/manage_task_lifecycle.ps1 -MaxAgeMinutes 20
     ```

3. **External Project Management via GitHub MCP**:
   - Use the hosted GitHub MCP server (`https://api.githubcopilot.com/mcp/`) to:
     - Query issues and project items.
     - Convert offline `Task Debt` items into GitHub issues when requested.
     - Maintain traceability between local code commits and project tracking.

4. **Task Debt Discipline**:
   - Adhere strictly to [references/TASK_DEBT_PROTOCOL.md](references/TASK_DEBT_PROTOCOL.md).
   - Incomplete tasks are transferred to `PROGRESS_TRACKER.md` as Task Debt.
