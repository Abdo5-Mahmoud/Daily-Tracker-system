param(
    [Parameter(Mandatory = $true)]
    [string]$ImagePath,
    [int]$MinResolution = 1000,
    [switch]$RequireWhiteBackground,
    [string]$TargetAspectRatio = ""
)

Add-Type -AssemblyName System.Drawing

if (-not (Test-Path $ImagePath)) {
    $errObj = [PSCustomObject]@{
        IsValid = $false
        Errors = @("File not found: $ImagePath")
    }
    $errObj | ConvertTo-Json -Compress
    exit 1
}

$fileItem = Get-Item $ImagePath
$bmp = $null
$errors = [System.Collections.Generic.List[string]]::new()
$whiteScore = 1.0

try {
    $bmp = [System.Drawing.Bitmap]::FromFile($ImagePath)
    $w = $bmp.Width
    $h = $bmp.Height

    # 1. Resolution Check
    if ($w -lt $MinResolution -or $h -lt $MinResolution) {
        $errors.Add("Resolution too low: ${w}x${h} (minimum: ${MinResolution}px)")
    }

    # 2. Aspect Ratio Check
    $gcd = {
        param($a, $b)
        while ($b -ne 0) {
            $t = $b
            $b = $a % $b
            $a = $t
        }
        return [Math]::Abs($a)
    }
    $divisor = & $gcd $w $h
    $ratioW = [int]($w / $divisor)
    $ratioH = [int]($h / $divisor)
    $computedRatio = "${ratioW}:${ratioH}"

    # Normalized aspect ratio simplification for common e-commerce ratios
    $ratioFloat = [double]$w / [double]$h
    $aspectSummary = if ([Math]::Abs($ratioFloat - 1.0) -lt 0.02) {
        "1:1"
    } elseif ([Math]::Abs($ratioFloat - 0.8) -lt 0.02) {
        "4:5"
    } elseif ([Math]::Abs($ratioFloat - 1.777) -lt 0.04) {
        "16:9"
    } else {
        $computedRatio
    }

    if ($TargetAspectRatio -and ($aspectSummary -ne $TargetAspectRatio)) {
        $errors.Add("Aspect ratio mismatch: got $aspectSummary, expected $TargetAspectRatio")
    }

    # 3. White Background Check (Four corners and boundary margins)
    if ($RequireWhiteBackground) {
        $samplePoints = @(
            @{ X = 5; Y = 5 },
            @{ X = $w - 6; Y = 5 },
            @{ X = 5; Y = $h - 6 },
            @{ X = $w - 6; Y = $h - 6 },
            @{ X = [int]($w / 2); Y = 5 },
            @{ X = [int]($w / 2); Y = $h - 6 }
        )
        $whiteCount = 0
        foreach ($pt in $samplePoints) {
            $px = $bmp.GetPixel($pt.X, $pt.Y)
            if ($px.R -ge 248 -and $px.G -ge 248 -and $px.B -ge 248) {
                $whiteCount++
            }
        }
        $whiteScore = [Math]::Round(($whiteCount / $samplePoints.Count), 2)
        if ($whiteScore -lt 0.8) {
            $errors.Add("Border is not pure white (white score: $whiteScore, threshold: 0.8)")
        }
    }

    $result = [PSCustomObject]@{
        IsValid = ($errors.Count -eq 0)
        Width = $w
        Height = $h
        AspectSummary = $aspectSummary
        CalculatedRatio = $computedRatio
        FileSizeBytes = $fileItem.Length
        WhiteScore = $whiteScore
        Errors = $errors.ToArray()
    }

    $result | ConvertTo-Json -Depth 5
}
finally {
    if ($bmp -ne $null) {
        $bmp.Dispose()
    }
}
