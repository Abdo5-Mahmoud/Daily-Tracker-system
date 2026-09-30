
Add-Type -AssemblyName System.Drawing

$inputPath = "c:\Users\A5\Desktop\growth-workspace-withAI\local-business-store\store-marketing\AmazonProducts\1st_P\processed\01_MAIN_HERO_WHITE.jpg"
$outputPath = "c:\Users\A5\Desktop\growth-workspace-withAI\local-business-store\store-marketing\AmazonProducts\1st_P\processed\01_MAIN_HERO_WHITE_OPTIMIZED_2000PX.jpg"

$bmp = [System.Drawing.Bitmap]::FromFile($inputPath)
$width = $bmp.Width
$height = $bmp.Height

# Find bounding box of non-pure-white pixels
$minX = $width
$maxX = 0
$minY = $height
$maxY = 0

for ($y = 0; $y -lt $height; $y++) {
    for ($x = 0; $x -lt $width; $x++) {
        $c = $bmp.GetPixel($x, $y)
        # Check if pixel is not white (allowing slight threshold for compression artifacts)
        if ($c.R -lt 250 -or $c.G -lt 250 -or $c.B -lt 250) {
            if ($x -lt $minX) { $minX = $x }
            if ($x -gt $maxX) { $maxX = $x }
            if ($y -lt $minY) { $minY = $y }
            if ($y -gt $maxY) { $maxY = $y }
        }
    }
}

$objWidth = $maxX - $minX + 1
$objHeight = $maxY - $minY + 1

Write-Host "Object detected: X=$minX..$maxX (W=$objWidth), Y=$minY..$maxY (H=$objHeight)"

# Desired output: 2000x2000 px, object fills 90% of the height or width
$targetSize = 2000
$targetOccupancy = 0.90
$maxAllowedDimension = $targetSize * $targetOccupancy

$scale = [Math]::Min($maxAllowedDimension / $objWidth, $maxAllowedDimension / $objHeight)
$destW = [int]($objWidth * $scale)
$destH = [int]($objHeight * $scale)

$destX = [int](($targetSize - $destW) / 2)
$destY = [int](($targetSize - $destH) / 2)

$outBmp = New-Object System.Drawing.Bitmap $targetSize, $targetSize, ([System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
$g = [System.Drawing.Graphics]::FromImage($outBmp)
$g.Clear([System.Drawing.Color]::White)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

$srcRect = New-Object System.Drawing.Rectangle $minX, $minY, $objWidth, $objHeight
$destRect = New-Object System.Drawing.Rectangle $destX, $destY, $destW, $destH

$g.DrawImage($bmp, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)

$bmp.Dispose()
$g.Dispose()

# Save with 95% quality JPEG
$encoder = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.FormatDescription -eq "JPEG" }
$encoderParams = New-Object System.Drawing.Imaging.EncoderParameters 1
$encoderParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter ([System.Drawing.Imaging.Encoder]::Quality, [long]95)

$outBmp.Save($outputPath, $encoder, $encoderParams)
$outBmp.Dispose()

Write-Host "Successfully saved optimized hero image to $outputPath (2000x2000, 90% frame fill)"
