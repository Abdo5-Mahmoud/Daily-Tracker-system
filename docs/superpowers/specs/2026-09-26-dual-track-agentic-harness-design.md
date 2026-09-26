# Engineering Design Specification: Dual-Track Agentic Harness & Command Suite 🚀🤖

> **Document Status**: Approved Architecture  
> **Date**: 2026-09-26  
> **Target System**: Antigravity IDE & Personal Engineering/Store Ecosystem for Abdo  
> **Classification**: Architectural Infrastructure  

---

## 1. Executive Summary & Objective

In our current operating rhythm, tasks are executed through manual conversational instructions. This introduces three friction points:
1. **Instruction Overhead**: Re-explaining constraints, visual presets, or application styles repeatedly.
2. **Context Drift**: Inconsistent execution of background isolation, 2700K lighting, or English interview phrasing across sessions.
3. **Repository Bloat**: Intermediate image assets, video recordings, and transient dumps cluttering the workspace without automated garbage collection.

This specification details the **Dual-Track Lean Harness**—a deterministic, lightweight macro and skill ecosystem tailored strictly to Abdo's daily routine (Morning Deep Work vs. Evening Artiflora / Amazon Egypt Shop duty). It establishes 6 high-leverage slash commands backed by reusable workspace assets and an automated background housekeeper.

---

## 2. Architecture & File Structure

All commands and automated capabilities are anchored into `.agents/skills/` and executable scripts under `scripts/macros/` to maintain 100% determinism, zero bloated dependencies, and instant compatibility with Obsidian and GitHub.

```text
growth-workspace-withAI/
│
├── .agents/
│   └── skills/
│       ├── abdo-personal-mentor/              # Master personal protocol (Attribution, Pedagogical Law)
│       ├── amazon-ecommerce-growth/           # Amazon Egypt playbook (Unit economics, SEO listing)
│       │
│       ├── workflow-morning-harness/          # Morning Command Engine
│       │   ├── SKILL.md                       # Contract rules for /apply-job, /grill-me, /daily-wrap
│       │   └── templates/                     # Reusable cover letter & interview defense scripts
│       │
│       ├── workflow-evening-studio/           # Evening Store Studio Engine
│       │   ├── SKILL.md                       # Contract rules for /amazon-white, /egyptian-home, /export-reel
│       │   └── presets/                       # Lighting parameters (2700K), aspect ratios (4:5, 1:1)
│       │
│       └── workspace-housekeeper/             # Housekeeping & Bloat Elimination
│           ├── SKILL.md                       # File retention rules & isolation boundaries
│           └── scripts/clean-bloat.ps1        # PowerShell automated garbage collector
│
├── scripts/
│   └── macros/                                # Executable Runners
│       ├── apply-audit.ps1                    # Scrapes & audits job links
│       ├── video-packager.js                  # Video reel asset converter (Tainted Canvas safe)
│       └── repo-janitor.ps1                   # Pre-commit scratch pruning
│
└── docs/
    └── superpowers/
        └── specs/
            └── 2026-09-26-dual-track-agentic-harness-design.md
```

---

## 3. Repurposed & Refactored Existing Assets

Rather than building redundant files, this harness wraps and upgrades existing battle-tested workspace assets:

| Existing Asset File | Harness Role | Repurposed Capability |
| :--- | :--- | :--- |
| `engineering-learning/targeted-cvs/` | `/apply-job` | Instant selection between Frontend Specialist and Fullstack Specialist PDFs |
| `engineering-learning/LEARNING_NOTES.md` | `/grill-me` | Living database of production concepts for cold-recall questioning |
| `engineering-learning/career-accelerator/` | `/apply-job` | Tailored outreach scripts and LinkedIn content playbooks |
| `local-business-store/store-marketing/AI_AGENTS_SPECIFICATIONS.md` | `/export-reel` & `/amazon-white` | Video director, visual studio, and copywriter agent prompts |
| `local-business-store/store-marketing/WORKFLOW.md` | `/egyptian-home` | 2700K warm lighting standards, 4:5 ratio, natural shadows |
| `local-business-store/store-marketing/reels/scenes_data.js` | `/export-reel` | Base64 encoded safe data buffer bypassing browser canvas security traps |
| `local-business-store/store-marketing/copy/` | `/egyptian-home` | Approved sales copy blueprints with WhatsApp ordering CTAs |

---

## 4. Detailed Command Contracts

### Track A: Morning Engineering & Career Commands (8:00 AM – 3:30 PM)

#### 1. `/apply-job [url / text]`
- **Intent**: Automates candidate-job matching, CV routing, and custom pitch generation.
- **Inputs**: Job URL (LinkedIn, Wuzzuf, SmartRecruiters, Job Board) or raw text post.
- **Workflow**:
  1. Inspects job requirements, seniority bar, and communication channel (WhatsApp, Email, Portal, DM).
  2. Evaluates fit against Abdo's profile; automatically filters out engagement traps or 5+ year senior roles unless instructed.
  3. Selects the optimal PDF:
     - Pure React / Next.js -> `Abdullah_Mahmoud_Fawzy_FRONTEND_DEVELOPER.pdf`
     - Node.js / Database / Fullstack -> `Abdullah_Mahmoud_Fawzy_FullStack.pdf`
  4. Formulates a crisp, tailored outreach message showcasing Mathematics degree, live production projects (`devfolio-ai.vercel.app`, `inventory-dashboard-beryl-zeta.vercel.app`), and clean code principles.
  5. Upon confirmation of submission, updates `PROGRESS_TRACKER.md` and `MASTER_KNOWLEDGE_BASE.md`.

#### 2. `/grill-me [topic / pattern]`
- **Intent**: Enforces the 3-angle Anti-Superficiality Protocol on any engineering topic.
- **Inputs**: Concept or pattern name (e.g., `Observer`, `RateLimiter`, `MongoosePoisoning`, `TaintedCanvas`).
- **Workflow**:
  1. *Angle 1 (Intuition)*: Tests mental intuition using everyday analogies.
  2. *Angle 2 (Failure Edge-Cases)*: Probes race conditions, memory leaks, connection stampedes, or OOM scenarios.
  3. *Angle 3 (Production Code)*: Requires Abdo to write a minimal canonical TypeScript solution.
  4. Provides immediate side-by-side English phrasing upgrade ("Your Input" vs. "Senior Engineer Version").
  5. Logs durable notes into `engineering-learning/LEARNING_NOTES.md` under strict tier attribution.

#### 3. `/daily-wrap`
- **Intent**: Autonomous end-of-day reconciliation, task debt logging, and Git synchronization.
- **Inputs**: None (automated trigger).
- **Workflow**:
  1. Evaluates all tasks completed today against the morning calendar plan.
  2. Logs any uncompleted items as "Task Debt" rolled over to the next active block with bottleneck root causes.
  3. Runs the 15-minute English active recall simulation.
  4. Executes `repo-janitor.ps1` to purge untracked temporary clutter.
  5. Commits all modified files with semantic commit message and pushes cleanly to `origin/main`.

---

### Track B: Evening Store & Amazon Egypt Commands (4:00 PM – 12:00 AM)

#### 4. `/amazon-white [image-path]`
- **Intent**: Generates compliant Amazon Egypt main catalog hero images.
- **Inputs**: Path to raw unedited photo from the store.
- **Workflow**:
  1. Isolates subject onto pure white `RGB(255, 255, 255)`.
  2. Applies a soft, realistic grounding contact shadow at the base to eliminate artificial floating appearance.
  3. Centers product occupying 85%+ of frame.
  4. Saves output as high-resolution PNG to `local-business-store/store-marketing/AmazonProducts/[PRODUCT_CODE]-AMZ-MAIN.png`.
  5. Reminds user of companion Scale Infographic requirement (Height & Diameter arrows).

#### 5. `/egyptian-home [image-path] [placement]`
- **Intent**: Generates photorealistic lifestyle imagery for social commerce and Meta Business Suite.
- **Inputs**: Product image + target placement (`shelf`, `tv-unit`, `coffee-table`, `office-desk`).
- **Workflow**:
  1. Composites product into authentic Egyptian modern home interior.
  2. Applies `2700K Warm Lighting` standard with directional window shadows.
  3. Formats to vertical 4:5 aspect ratio (optimized for Instagram & Facebook feeds).
  4. Saves to `local-business-store/store-marketing/edited/`.
  5. Pairs image with conversion copy blueprint including physical specs (weight, height, anti-breakage washable material) and Artiflora WhatsApp ordering CTA (`01070810979`).

#### 6. `/export-reel [product-code]`
- **Intent**: Automated production of commercial 5-second slow-pan video reels.
- **Inputs**: Approved product code (e.g. `PLANT-002`, `CRYSTAL-001`).
- **Workflow**:
  1. Converts approved product image to inline safe data buffer to prevent tainted canvas DOMExceptions (`scenes_data.js`).
  2. Executes headless browser canvas recording for 5 seconds (150 frames @ 30 FPS).
  3. Exports web-ready video asset: `[product-code]_reel_5sec.webm`.
  4. Attaches approved short-form reel caption with hashtags and WhatsApp CTA ready for Meta Business Suite.

---

## 5. Workspace Housekeeping & Bloat Prevention Protocol

To ensure continuous repository health and prevent bloated `.git` histories:

1. **Strict Directory Boundary**:
   - `scratch/` and `temp/` are hard-ignored in `.gitignore`. All test renders, raw crops, and throwaway experiment files MUST reside here.
   - Large video assets (`*.mp4`, `*.webm`, `*.mov`) are permanently excluded from Git tracking via `.gitignore`.
2. **Automated Janitor Script (`repo-janitor.ps1`)**:
   - Automatically scans `scratch/` and deletes unreferenced assets older than 48 hours.
   - Verifies that no staged files exceed 10 MB prior to committing.
   - Cleans dangling logs and dead temporary files.
3. **Execution Hook**:
   - Triggered automatically as Step 4 of the `/daily-wrap` pipeline.

---

## 6. Verification & Implementation Roadmap

Implementation proceeds in 3 sequential phases:
- **Phase 1: Housekeeper & Core Morning Harness**:
  - Implement `repo-janitor.ps1`.
  - Create `.agents/skills/workflow-morning-harness/SKILL.md` wiring `/apply-job`, `/grill-me`, and `/daily-wrap`.
- **Phase 2: Evening Store Studio Harness**:
  - Create `.agents/skills/workflow-evening-studio/SKILL.md` wiring `/amazon-white`, `/egyptian-home`, and `/export-reel`.
  - Integrate existing `video_generator.html` and `scenes_data.js` into automated runner.
- **Phase 3: End-to-End Test Execution**:
  - Execute a test run of `/apply-job` with mock listing.
  - Execute a test run of `/amazon-white` with sample product.
  - Verify zero Git bloat and clean push to `origin/main`.
