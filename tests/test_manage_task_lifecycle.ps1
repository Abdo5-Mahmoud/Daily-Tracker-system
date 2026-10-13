$testDir = "c:\Users\A5\Desktop\growth-workspace-withAI\scratch\test_tasks"
if (-not (Test-Path $testDir)) { New-Item -ItemType Directory -Path $testDir | Out-Null }
$testLog = Join-Path $testDir "expired_task.log"

"Task started: 2026-10-06T00:00:00Z" | Set-Content $testLog
# Set LastWriteTime to 30 minutes in the past
(Get-Item $testLog).LastWriteTime = (Get-Date).AddMinutes(-30)

try {
    $scriptPath = "c:\Users\A5\Desktop\growth-workspace-withAI\scripts\manage_task_lifecycle.ps1"
    if (-not (Test-Path $scriptPath)) {
        throw "Script not found: $scriptPath"
    }

    $rawJson = & $scriptPath -ScanDir $testDir -MaxAgeMinutes 20
    $report = $rawJson | ConvertFrom-Json
    if ($report.ExpiredCount -ne 1) {
        throw "Expected 1 expired task detected, got $($report.ExpiredCount)"
    }
    Write-Host "PASS: test_manage_task_lifecycle"
} finally {
    if (Test-Path $testDir) {
        Remove-Item $testDir -Recurse -Force -ErrorAction SilentlyContinue
    }
}
