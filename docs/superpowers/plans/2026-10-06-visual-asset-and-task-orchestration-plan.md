# Visual Asset Generation & Task Orchestration Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a robust, production-grade Visual Asset Generation system (prompt matrices, distortion checklist, PowerShell image audit script) and an Autonomous Task Orchestration system (official hosted GitHub MCP server, 15-20 min background task reaper, Task Debt synchronizer).

**Architecture:** 
1. Two dedicated workspace skills under `.agents/skills/` (`visual-asset-generation` and `autonomous-task-orchestrator`).
2. Two PowerShell automation tools under `scripts/` (`audit_image_quality.ps1` and `manage_task_lifecycle.ps1`).
3. Dual MCP configuration in Antigravity IDE (`mcp_config.json`) and Cursor (`mcp.json`) pointing to `https://api.githubcopilot.com/mcp/`.

**Tech Stack:** PowerShell 5.1/7+ (`System.Drawing`), JSON, Model Context Protocol (SSE/HTTP), Markdown skills architecture.

**Spec:** [docs/superpowers/specs/2026-10-06-visual-asset-and-task-orchestration-design.md](file:///c:/Users/A5/Desktop/growth-workspace-withAI/docs/superpowers/specs/2026-10-06-visual-asset-and-task-orchestration-design.md)

## Global Constraints

- Every single line in chat responses and markdown docs MUST be 100% Arabic or 100% English (Rule 2 in AGENTS.md).
- Scripts must run natively in Windows PowerShell without requiring Docker daemon execution.
- MCP configurations must retain existing entries (`notebooks`, `visualization`, `data-agent-kit`, `miro`, `posthog`).
- All tests must verify pass/fail states with concrete terminal evidence before marking tasks complete.

## Review Focus

1. **GitHub MCP Server Syntax**: Remote SSE server uses `serverUrl` in Antigravity IDE and `url` in Cursor.
2. **System.Drawing GDI+ Locks**: Any PowerShell bitmap inspection must call `.Dispose()` in a `finally` block to prevent file locking on Windows.
3. **Non-pure White Backgrounds**: JPEG compression artifacts must be tolerated within a configurable RGB threshold (default >= 248) to avoid false negatives.
4. **Task Process Cleanup**: Process killing in `manage_task_lifecycle.ps1` must target only spawned task child processes and avoid killing the IDE or Language Server.
5. **Progress Tracker Integrity**: Task Debt updates must append cleanly to `PROGRESS_TRACKER.md` without overwriting historical session entries.

---

### Task 1: GitHub MCP Configuration & Connectivity (Antigravity & Cursor)

**Files:**
- Modify: `C:\Users\A5\.gemini\config\mcp_config.json`
- Modify: `C:\Users\A5\.cursor\mcp.json`
- Create: `scripts/test_mcp_connectivity.ps1`

**Interfaces:**
- Consumes: Existing JSON configs in `~/.gemini/config/` and `~/.cursor/`.
- Produces: Active `github` MCP server entry in both IDEs pointing to `https://api.githubcopilot.com/mcp/`.

- [ ] **Step 1: Write the connectivity test script**
Create `scripts/test_mcp_connectivity.ps1`:
```powershell
param([string]$ConfigPath, [string]$UrlProperty = "serverUrl")
$json = Get-Content $ConfigPath -Raw | ConvertFrom-Json
if (-not $json.mcpServers.github) { throw "Missing github entry in $ConfigPath" }
$url = $json.mcpServers.github.$UrlProperty
if ($url -ne "https://api.githubcopilot.com/mcp/") { throw "Invalid URL: $url" }
$res = curl.exe -sI $url
if ($res -notmatch "HTTP/1.1 (200|401|404|302)") { throw "Failed to reach endpoint: $res" }
Write-Host "PASS: $ConfigPath correctly configured with $url"
```

- [ ] **Step 2: Run test to verify it fails before updating configs**
Run: `powershell -ExecutionPolicy Bypass -File scripts/test_mcp_connectivity.ps1 -ConfigPath "C:\Users\A5\.gemini\config\mcp_config.json"`
Expected: FAIL with "Missing github entry in C:\Users\A5\.gemini\config\mcp_config.json"

- [ ] **Step 3: Update `mcp_config.json` and `~/.cursor/mcp.json` with GitHub server**
Add `github` entry:
- In `C:\Users\A5\.gemini\config\mcp_config.json`: `"github": { "serverUrl": "https://api.githubcopilot.com/mcp/" }`
- In `C:\Users\A5\.cursor\mcp.json`: `"github": { "url": "https://api.githubcopilot.com/mcp/" }`

- [ ] **Step 4: Run connectivity tests to verify they pass**
Run: `powershell -ExecutionPolicy Bypass -File scripts/test_mcp_connectivity.ps1 -ConfigPath "C:\Users\A5\.gemini\config\mcp_config.json" -UrlProperty "serverUrl"`
Run: `powershell -ExecutionPolicy Bypass -File scripts/test_mcp_connectivity.ps1 -ConfigPath "$HOME\.cursor\mcp.json" -UrlProperty "url"`
Expected: PASS for both.

- [ ] **Step 5: Commit**
```bash
git add scripts/test_mcp_connectivity.ps1
git commit -m "feat(mcp): add github remote mcp configuration and connectivity test"
```

---

### Task 2: Automated Image Quality Audit Script (`scripts/audit_image_quality.ps1`)

**Files:**
- Create: `scripts/audit_image_quality.ps1`
- Create: `tests/test_audit_image_quality.ps1`

**Interfaces:**
- Consumes: Target image file path (`.jpg`, `.png`, `.jpeg`).
- Produces: Structured JSON result:
  `{ IsValid: bool, Width: int, Height: int, AspectRatio: string, WhiteBorderRatio: double, FileSizeBytes: long, Errors: string[] }`

- [ ] **Step 1: Write the failing unit test for image quality audit**
Create `tests/test_audit_image_quality.ps1`:
```powershell
Add-Type -AssemblyName System.Drawing
$testImgPath = "c:\Users\A5\Desktop\growth-workspace-withAI\scratch\test_fixture_img.jpg"
$bmp = New-Object System.Drawing.Bitmap 1000, 1000
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.Clear([System.Drawing.Color]::White)
$bmp.Save($testImgPath, [System.Drawing.Imaging.ImageFormat]::Jpeg)
$bmp.Dispose()
$g.Dispose()

$result = & "c:\Users\A5\Desktop\growth-workspace-withAI\scripts\audit_image_quality.ps1" -ImagePath $testImgPath -RequireWhiteBackground -MinResolution 1000 | ConvertFrom-Json
if (-not $result.IsValid) { throw "Expected valid image audit result" }
Remove-Item $testImgPath -ErrorAction SilentlyContinue
Write-Host "PASS: test_audit_image_quality"
```

- [ ] **Step 2: Run test to verify it fails**
Run: `powershell -ExecutionPolicy Bypass -File tests/test_audit_image_quality.ps1`
Expected: FAIL with "audit_image_quality.ps1 does not exist"

- [ ] **Step 3: Implement `scripts/audit_image_quality.ps1`**
Create script accepting:
- `-ImagePath` (string, mandatory)
- `-MinResolution` (int, default 1000)
- `-RequireWhiteBackground` (switch)
- `-TargetAspectRatio` (string, optional e.g. "1:1", "4:5", "16:9")
Logic:
1. Open bitmap via `[System.Drawing.Bitmap]::FromFile()`.
2. Compute dimensions, file size, aspect ratio.
3. Check 4-corner pixel RGB values (>= 248) if `-RequireWhiteBackground` is set.
4. Ensure proper cleanup via `finally { $bmp.Dispose() }`.
5. Output structured JSON.

- [ ] **Step 4: Run test to verify it passes**
Run: `powershell -ExecutionPolicy Bypass -File tests/test_audit_image_quality.ps1`
Expected: PASS

- [ ] **Step 5: Run audit against existing Amazon product hero image**
Run: `powershell -ExecutionPolicy Bypass -File scripts/audit_image_quality.ps1 -ImagePath "local-business-store/store-marketing/AmazonProducts/1st_P/processed/01_MAIN_HERO_WHITE_OPTIMIZED_2000PX.jpg" -RequireWhiteBackground -MinResolution 1500`
Expected: PASS with 2000x2000 dimensions and valid white border.

- [ ] **Step 6: Commit**
```bash
git add scripts/audit_image_quality.ps1 tests/test_audit_image_quality.ps1
git commit -m "feat(imaging): implement automated image quality audit script"
```

---

### Task 3: Visual Asset Generation Skill & Documentation

**Files:**
- Create: `.agents/skills/visual-asset-generation/SKILL.md`
- Create: `.agents/skills/visual-asset-generation/references/PROMPT_MATRICES.md`
- Create: `.agents/skills/visual-asset-generation/references/DISTORTION_CHECKLIST.md`

**Interfaces:**
- Consumes: Image generation requirements (Amazon hero, lifestyle staging, UI mockups).
- Produces: Structured, artifact-free prompts, negative constraint rules, and mandatory 3-stage visual audit verification.

- [ ] **Step 1: Write `references/PROMPT_MATRICES.md`**
Define exact prompt structures for:
1. Amazon Egypt White Hero (pure white background, 90% occupancy, micro-texture, diffused studio softbox).
2. Egyptian Interior Lifestyle (warm 2700K ambient, natural oak/marble surface, real daylight window sidelight, f/2.8 bokeh).
3. UI / Product Interface Mockup (high micro-contrast, modern typography, glassmorphism, zero fake laptop frames).
4. Real-Photo Compositing (Photoroom cutout integration rules).

- [ ] **Step 2: Write `references/DISTORTION_CHECKLIST.md`**
Define the 3-Stage anti-distortion gate:
1. Geometry & Anatomy Audit (Zero phantom hands from walls, correct finger counts, straight architecture).
2. Physics & Shadows Audit (Realistic contact shadow, directional light match, ambient occlusion).
3. Scale & Anti-Sticker Audit (Proportional relative scale, authentic surface bedding, natural color bleed).

- [ ] **Step 3: Write `.agents/skills/visual-asset-generation/SKILL.md`**
Create frontmatter and operational protocol enforcing:
- Pre-generation prompt synthesis using `PROMPT_MATRICES.md`.
- Post-generation execution of `scripts/audit_image_quality.ps1`.
- Mandatory distortion checklist sign-off before presenting images to user.

- [ ] **Step 4: Verify skill file structure and markdown integrity**
Run: `node scripts/audit_text_formatting.js`
Expected: 0 formatting violations.

- [ ] **Step 5: Commit**
```bash
git add .agents/skills/visual-asset-generation/
git commit -m "feat(skills): create visual asset generation master skill and audit matrices"
```

---

### Task 4: Autonomous Task Orchestrator Skill & Background Reaper

**Files:**
- Create: `scripts/manage_task_lifecycle.ps1`
- Create: `tests/test_manage_task_lifecycle.ps1`
- Create: `.agents/skills/autonomous-task-orchestrator/SKILL.md`
- Create: `.agents/skills/autonomous-task-orchestrator/references/TASK_DEBT_PROTOCOL.md`

**Interfaces:**
- Consumes: Background task states, execution timestamps, `PROGRESS_TRACKER.md`.
- Produces: Automated detection and killing of tasks exceeding 15-20 min timeout, automatic Task Debt rollover.

- [ ] **Step 1: Write test for task lifecycle manager**
Create `tests/test_manage_task_lifecycle.ps1`:
```powershell
$testLog = "c:\Users\A5\Desktop\growth-workspace-withAI\scratch\test_task.log"
"Task started: 2026-10-06T00:00:00Z" | Set-Content $testLog
$report = & "c:\Users\A5\Desktop\growth-workspace-withAI\scripts\manage_task_lifecycle.ps1" -ScanDir "scratch" -MaxAgeMinutes 1 | ConvertFrom-Json
if ($report.ExpiredCount -ne 1) { throw "Expected 1 expired task detected" }
Remove-Item $testLog -ErrorAction SilentlyContinue
Write-Host "PASS: test_manage_task_lifecycle"
```

- [ ] **Step 2: Run test to verify it fails**
Run: `powershell -ExecutionPolicy Bypass -File tests/test_manage_task_lifecycle.ps1`
Expected: FAIL with "manage_task_lifecycle.ps1 does not exist"

- [ ] **Step 3: Implement `scripts/manage_task_lifecycle.ps1`**
Create script:
- Scans target directory (e.g. `.system_generated/tasks/` or workspace logs).
- Reads creation / last modified timestamps.
- Flags tasks running longer than `-MaxAgeMinutes` (default 20).
- If `-AutoKill` is specified, terminates the associated PID or sends kill command.
- Outputs structured JSON report: `{ ScannedCount: int, ExpiredCount: int, Tasks: array }`.

- [ ] **Step 4: Run test to verify it passes**
Run: `powershell -ExecutionPolicy Bypass -File tests/test_manage_task_lifecycle.ps1`
Expected: PASS

- [ ] **Step 5: Write `.agents/skills/autonomous-task-orchestrator/SKILL.md` and Task Debt Protocol**
Create skill enforcing:
- Pre-flight execution rules (non-interactive flags, proper waitMs).
- 15-20 minute hard cap enforcement.
- Integration with GitHub MCP tools (`create_issue`, `list_issues`, `update_issue`).
- Task Debt rollover rules into `PROGRESS_TRACKER.md` synchronized with Morning Deep Work (8:00 AM - 3:30 PM) and Evening Store Duty (4:00 PM - 12:00 AM).

- [ ] **Step 6: Commit**
```bash
git add scripts/manage_task_lifecycle.ps1 tests/test_manage_task_lifecycle.ps1 .agents/skills/autonomous-task-orchestrator/
git commit -m "feat(orchestration): create autonomous task orchestrator and lifecycle manager"
```

---

### Task 5: End-to-End Verification & Workspace Synchronization

**Files:**
- Modify: `PROGRESS_TRACKER.md`
- Run all test suites.

- [ ] **Step 1: Run comprehensive test suite**
Run:
- `powershell -ExecutionPolicy Bypass -File tests/test_audit_image_quality.ps1`
- `powershell -ExecutionPolicy Bypass -File tests/test_manage_task_lifecycle.ps1`
- `powershell -ExecutionPolicy Bypass -File scripts/test_mcp_connectivity.ps1 -ConfigPath "C:\Users\A5\.gemini\config\mcp_config.json" -UrlProperty "serverUrl"`
- `powershell -ExecutionPolicy Bypass -File scripts/test_mcp_connectivity.ps1 -ConfigPath "$HOME\.cursor\mcp.json" -UrlProperty "url"`
Expected: ALL PASS.

- [ ] **Step 2: Update `PROGRESS_TRACKER.md`**
Log the completion of:
- Architectural overhaul of Visual Generation System (resolving lines 560-564).
- Autonomous Task Orchestration System and GitHub MCP integration.
- 0 Task Debt remaining for this milestone.

- [ ] **Step 3: Run formatting audit on modified markdown files**
Run: `node scripts/audit_text_formatting.js`
Expected: Clean with 0 line-mixing violations.

- [ ] **Step 4: Final commit and push to origin/main**
```bash
git add PROGRESS_TRACKER.md
git commit -m "docs(tracker): update progress tracker with visual asset and task orchestration systems"
git push origin main
```
