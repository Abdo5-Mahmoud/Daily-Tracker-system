param(
    [string]$ScanDir = "C:\Users\A5\.gemini\antigravity-ide\brain",
    [int]$MaxAgeMinutes = 20,
    [switch]$AutoKill
)

if (-not (Test-Path $ScanDir)) {
    $out = [PSCustomObject]@{
        ScannedCount = 0
        ExpiredCount = 0
        ExpiredTasks = @()
        Message = "Directory not found: $ScanDir"
    }
    $out | ConvertTo-Json -Depth 3
    exit 0
}

$now = Get-Date
$logFiles = Get-ChildItem -Path $ScanDir -Filter "*.log" -Recurse -File -ErrorAction SilentlyContinue

$expiredTasks = [System.Collections.Generic.List[PSCustomObject]]::new()
$scannedCount = 0

foreach ($file in $logFiles) {
    $scannedCount++
    $ageMinutes = [Math]::Round(($now - $file.LastWriteTime).TotalMinutes, 1)

    if ($ageMinutes -ge $MaxAgeMinutes) {
        $taskInfo = [PSCustomObject]@{
            File = $file.FullName
            Name = $file.Name
            AgeMinutes = $ageMinutes
            LastModified = $file.LastWriteTime.ToString("yyyy-MM-ddTHH:mm:ssZ")
            ActionTaken = if ($AutoKill) { "FlaggedForTermination" } else { "Reported" }
        }
        $expiredTasks.Add($taskInfo)
    }
}

$report = [PSCustomObject]@{
    ScannedCount = $scannedCount
    ExpiredCount = $expiredTasks.Count
    MaxAgeMinutes = $MaxAgeMinutes
    ExpiredTasks = $expiredTasks.ToArray()
}

$report | ConvertTo-Json -Depth 5
