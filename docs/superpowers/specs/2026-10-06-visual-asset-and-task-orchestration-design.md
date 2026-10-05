# Engineering Design Specification: Visual Asset Generation & Task Orchestration Engine 🎨⚙️

> **Document Status**: Draft - Under Review  
> **Date**: 2026-10-06  
> **Target System**: Antigravity IDE & Cursor Environment for Abdo (Abdullah Mahmoud Fawzy)  
> **Classification**: Architectural Infrastructure  

---

## 1. Executive Summary & Problem Statement

In recent operating cycles, two foundational workflows have operated with high manual friction and primitive execution:

1. **Primitive Visual Asset Generation (`generate_image`)**:
   - **Root Cause**: Prompts were submitted ad-hoc without negative hallucination boundaries, standardized aspect ratios, or lighting parameters.
   - **Observed Failures**: As documented in `PROGRESS_TRACKER.md` (lines 560-564), AI generation previously produced severe visual anomalies (distorted phantom hands growing out of walls, flat sticker-like compositing, and incorrect scale for e-commerce decor items).
   - **Target State**: A deterministic **Visual Asset Generation Engine** incorporating standardized prompt matrices (Amazon White Hero, Egyptian Lifestyle Staging, UI Mockups), a strict 3-Stage Distortion Audit Protocol, and an automated image audit script.

2. **Primitive Task Execution & Background Scheduling (`schedule` & `manage_task`)**:
   - **Root Cause**: Platform primitives (`schedule`, `manage_task`, `run_command`) were launched without structured lifecycle management, causing interactive command hangs (such as unbounded `npx` installs) and a disconnect from project tracking.
   - **Target State**: An **Autonomous Task Orchestration Engine** backed by:
     - The official hosted **GitHub MCP Server** (`https://api.githubcopilot.com/mcp/`) integrated into both Antigravity IDE and Cursor.
     - A standardized Task Orchestrator Skill with a strict 15-20 minute execution cap, automated task reaping, and seamless synchronization with `PROGRESS_TRACKER.md` Task Debt and daily time blocks.

---

## 2. System Architecture & Component Layout

```text
growth-workspace-withAI/
│
├── .agents/
│   └── skills/
│       ├── visual-asset-generation/                 # Visual Generation & Quality Audit Engine
│       │   ├── SKILL.md                            # Prompt engineering matrices & distortion checklists
│       │   └── references/                         # Lighting (2700K), Amazon 2000px standards, composition
│       │
│       └── autonomous-task-orchestrator/           # Task Lifecycle & Routine Manager
│           ├── SKILL.md                            # 15-20m hard cap, auto-reaping, GitHub MCP protocol
│           └── references/                         # Task Debt schema, schedule hooks, routine guardrails
│
├── scripts/
│   ├── audit_image_quality.ps1                     # PowerShell-native image validation & dimension inspector
│   └── manage_task_lifecycle.ps1                   # Background process monitor and hanging task reaper
│
├── C:\Users\A5\.gemini\config\mcp_config.json      # Antigravity IDE MCP Config (GitHub + Miro + PostHog)
├── C:\Users\A5\.cursor\mcp.json                   # Cursor IDE MCP Config (GitHub + Miro + PostHog)
│
└── docs/superpowers/specs/
    └── 2026-10-06-visual-asset-and-task-orchestration-design.md
```

---

## 3. Subsystem 1: Visual Asset Generation Engine

### 3.1 Prompt Engineering Matrices
The `visual-asset-generation` skill defines four calibrated prompt archetypes:

1. **Amazon White Hero (`hero_white_bg`)**:
   - Aspect Ratio: `1:1`
   - Pure RGB 255, 255, 255 background.
   - Object occupancy: 85%-90% of frame height/width.
   - Diffused dual-softbox lighting with natural bottom contact drop shadow.
   - High micro-contrast and realistic ceramic/fluted texture rendering.

2. **Lifestyle & In-Situ Staging (`lifestyle_interior`)**:
   - Aspect Ratio: `4:5` (Instagram/Meta Ads) or `1:1` (Amazon secondary).
   - Staging: Modern warm Egyptian living room / console table / dining setting.
   - Lighting: Warm 2700K ambient lighting with soft window sidelight.
   - Depth of field: $f/2.8$ with authentic bokeh on background decor.
   - Strict prohibition of disembodied hands, floating objects, or impossible geometry.

3. **UI / UX Product Design Mockup (`ui_mockup`)**:
   - Aspect Ratio: `16:9` or `4:3`.
   - Clean viewport, dark/glassmorphic surface, crisp typography tokens.
   - Zero generic browser chrome or fake decorative laptop bezels unless requested.

4. **Hybrid Real-Capture Staging (`real_photo_composite`)**:
   - Baseline: Mobile camera capture from store (`local-business-store/store-marketing/`).
   - Isolation: Photoroom cutout with preserved edge alpha.
   - Composition: AI-generated background environment matching the camera perspective and focal length.

### 3.2 The 3-Stage Distortion Audit Protocol
Before any generated image is accepted into production or documentation:

- **Stage 1: Anatomy & Geometry Audit**:
  - Are there any deformed, phantom, or extra hands/limbs?
  - Are straight lines (walls, tables, window frames) warped or distorted?
- **Stage 2: Physics & Lighting Consistency**:
  - Does the contact shadow match the primary light source direction?
  - Is there believable ambient occlusion at the base of the object?
- **Stage 3: Scale & Anti-Sticker Check**:
  - Is the object scale proportionate to adjacent objects (books, candles, furniture)?
  - Is the object naturally bedded into the scene rather than looking like a pasted 2D sticker?

If any check fails, the asset is immediately rejected with root-cause logging.

### 3.3 Automated Image Audit Script (`scripts/audit_image_quality.ps1`)
A PowerShell script using `System.Drawing` to verify:
- Exact pixel dimensions ($W \times H$).
- Aspect ratio conformity.
- Background pure white pixel verification (for Amazon hero images).
- File size optimization (under 2MB for web, above 1000px for Amazon zoom capability).

---

## 4. Subsystem 2: Autonomous Task Orchestration & GitHub MCP

### 4.1 GitHub Remote MCP Integration
Instead of relying on unmaintained npm packages or a heavy Docker daemon on Windows, both IDE environments connect directly to GitHub's official hosted MCP server:

- **Endpoint**: `https://api.githubcopilot.com/mcp/`
- **Transport**: Remote SSE / HTTP.
- **Authentication**: Native OAuth 2.1 via GitHub.

#### Configuration in Antigravity IDE (`C:\Users\A5\.gemini\config\mcp_config.json`):
```json
{
  "mcpServers": {
    "github": {
      "serverUrl": "https://api.githubcopilot.com/mcp/"
    },
    "miro": {
      "serverUrl": "https://mcp.miro.com/"
    }
  }
}
```

#### Configuration in Cursor (`C:\Users\A5\.cursor\mcp.json`):
```json
{
  "mcpServers": {
    "github": {
      "url": "https://api.githubcopilot.com/mcp/"
    },
    "miro": {
      "url": "https://mcp.miro.com/"
    }
  }
}
```

### 4.2 Task Lifecycle & The 15-20 Minute Hard Cap
To prevent silent hangs and unbounded task execution:
1. **Pre-flight Execution Contract**:
   - Any long-running command (installs, builds, tests) must be launched with non-interactive flags (`-y`, `--non-interactive`, `--ci`).
   - Synchronous wait threshold (`WaitMsBeforeAsync`) capped at reasonable intervals (500ms - 5000ms).
2. **15-20 Min Cap & Timeout Protocol**:
   - If a background command runs longer than 15 minutes without progress updates, the orchestrator triggers an inspection.
   - At 20 minutes, the task is automatically killed (`manage_task action='kill'`) and an architectural incident log is written.
3. **Automated Cleanup Script (`scripts/manage_task_lifecycle.ps1`)**:
   - Scans active background processes and log files in `.system_generated/tasks/`.
   - Flags orphaned node or python child processes and reports memory usage.

### 4.3 Task Debt & Routine Synchronization
The orchestrator enforces the two daily operational blocks defined in `AGENTS.md` and `RULE[user_global]`:
- **Morning Deep Work (8:00 AM - 3:30 PM)**:
  - Engineering sprints, algorithms, job applications, and architecture.
- **Evening Store Operation (4:00 PM - 12:00 AM)**:
  - Retail shop duty, Amazon Egypt inventory packaging, and visual marketing.
- **Task Rollover Protocol**:
  - Incomplete tasks are never erased. They are tagged as `Task Debt` in `PROGRESS_TRACKER.md` and rolled over to the next dedicated block with an explicit bottleneck note.

---

## 5. Verification & Testing Strategy

1. **Visual Asset System Verification**:
   - Execute `scripts/audit_image_quality.ps1` against existing hero images in `local-business-store/store-marketing/AmazonProducts/1st_P/`.
   - Verify prompt matrices generate clean, artifact-free outputs conforming to the 3-stage checklist.
2. **GitHub MCP Verification**:
   - Verify that `mcp_config.json` and `~/.cursor/mcp.json` validate syntactically with `ConvertFrom-Json`.
   - Verify HTTP connectivity to `https://api.githubcopilot.com/mcp/`.
3. **Task Orchestrator Verification**:
   - Test `manage_task_lifecycle.ps1` with a mock sleep process to confirm timeout detection and clean process termination.
