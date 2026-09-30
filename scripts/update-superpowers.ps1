# Script to pull latest Superpowers updates and verify NTFS link
Write-Host "Updating Superpowers from origin/main..." -ForegroundColor Cyan

if (Test-Path .\superpowers\.git) {
    git -C .\superpowers pull origin main
    $latestCommit = git -C .\superpowers log -1 --oneline
    Write-Host "Superpowers is now at: $latestCommit" -ForegroundColor Green
} else {
    Write-Warning "superpowers directory or .git not found."
}

# Verify Directory Junction
$junctionTarget = (Get-Item "C:\Users\A5\.gemini\config\plugins\superpowers").Target
Write-Host "Active Global Antigravity Junction points to: $junctionTarget" -ForegroundColor Yellow
