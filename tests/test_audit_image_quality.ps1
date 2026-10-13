Add-Type -AssemblyName System.Drawing

$testDir = "c:\Users\A5\Desktop\growth-workspace-withAI\scratch"
if (-not (Test-Path $testDir)) { New-Item -ItemType Directory -Path $testDir | Out-Null }
$testImgPath = Join-Path $testDir "test_fixture_img.jpg"

$bmp = New-Object System.Drawing.Bitmap 1200, 1200
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.Clear([System.Drawing.Color]::White)
$bmp.Save($testImgPath, [System.Drawing.Imaging.ImageFormat]::Jpeg)
$bmp.Dispose()
$g.Dispose()

try {
    $scriptPath = "c:\Users\A5\Desktop\growth-workspace-withAI\scripts\audit_image_quality.ps1"
    if (-not (Test-Path $scriptPath)) {
        throw "Script not found: $scriptPath"
    }

    $rawJson = & $scriptPath -ImagePath $testImgPath -RequireWhiteBackground -MinResolution 1000
    $result = $rawJson | ConvertFrom-Json
    if (-not $result.IsValid) {
        throw "Expected IsValid == true, got errors: $($result.Errors -join ', ')"
    }
    if ($result.Width -ne 1200 -or $result.Height -ne 1200) {
        throw "Dimensions mismatch: $($result.Width)x$($result.Height)"
    }
    Write-Host "PASS: test_audit_image_quality"
} finally {
    if (Test-Path $testImgPath) {
        Remove-Item $testImgPath -Force -ErrorAction SilentlyContinue
    }
}
