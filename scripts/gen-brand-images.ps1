# Sinh ảnh thương hiệu tĩnh: og-default.png (1200x630) và apple-icon.png (180x180).
# Chạy: powershell -ExecutionPolicy Bypass -File scripts/gen-brand-images.ps1
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$root = if ($PSScriptRoot) { Split-Path -Parent $PSScriptRoot } else { (Get-Location).Path }
$navy = [System.Drawing.ColorTranslator]::FromHtml('#1E3A8A')
$navyDark = [System.Drawing.ColorTranslator]::FromHtml('#12275E')
$orange = [System.Drawing.ColorTranslator]::FromHtml('#F97316')
$white = [System.Drawing.Color]::White
$softBlue = [System.Drawing.ColorTranslator]::FromHtml('#DBEAFE')
$mutedBlue = [System.Drawing.ColorTranslator]::FromHtml('#93C5FD')

function New-Font([string]$family, [float]$size, [System.Drawing.FontStyle]$style) {
  return New-Object System.Drawing.Font($family, $size, $style, [System.Drawing.GraphicsUnit]::Pixel)
}

# ---------- og-default.png ----------
$ogWidth = 1200
$ogHeight = 630
$ogBitmap = New-Object System.Drawing.Bitmap($ogWidth, $ogHeight)
$ogGraphics = [System.Drawing.Graphics]::FromImage($ogBitmap)
$ogGraphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$ogGraphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit

$ogRect = New-Object System.Drawing.Rectangle(0, 0, $ogWidth, $ogHeight)
$ogGradient = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
  $ogRect, $navy, $navyDark, [System.Drawing.Drawing2D.LinearGradientMode]::ForwardDiagonal
)
$ogGraphics.FillRectangle($ogGradient, $ogRect)

# Vòng trang trí mờ phía sau logo
$decorPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(30, 255, 255, 255), 2)
$ogGraphics.DrawEllipse($decorPen, 880, 55, 520, 520)

# Logo vòng tròn bên phải
$ringPen = New-Object System.Drawing.Pen($white, 34)
$ogGraphics.DrawEllipse($ringPen, 880, 205, 250, 250)
$ogGraphics.FillEllipse((New-Object System.Drawing.SolidBrush($orange)), 1070, 190, 76, 76)

# Chấm cam nhấn mạnh góc trái trên
$ogGraphics.FillEllipse((New-Object System.Drawing.SolidBrush($orange)), 96, 96, 16, 16)
$accentPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(90, 249, 115, 22), 4)
$ogGraphics.DrawLine($accentPen, 128, 104, 420, 104)

$titleFont = New-Font 'Segoe UI' 96 ([System.Drawing.FontStyle]::Bold)
$taglineFont = New-Font 'Segoe UI' 40 ([System.Drawing.FontStyle]::Regular)
$bulletFont = New-Font 'Segoe UI' 26 ([System.Drawing.FontStyle]::Regular)
$urlFont = New-Font 'Segoe UI' 28 ([System.Drawing.FontStyle]::Bold)

$ogGraphics.DrawString('Ôn Thi THPT', $titleFont, (New-Object System.Drawing.SolidBrush($white)), 96, 190)
$ogGraphics.DrawString('Luyện đề theo tư duy', $taglineFont, (New-Object System.Drawing.SolidBrush($softBlue)), 100, 320)
$ogGraphics.DrawString(
  'Đề thi thử sát cấu trúc  ·  Lời giải chi tiết',
  $bulletFont, (New-Object System.Drawing.SolidBrush($mutedBlue)), 100, 390
)
$ogGraphics.DrawString('onthithpt.vn', $urlFont, (New-Object System.Drawing.SolidBrush($orange)), 100, 518)

$ogBitmap.Save((Join-Path $root 'public\og-default.png'), [System.Drawing.Imaging.ImageFormat]::Png)
$ogGraphics.Dispose()
$ogBitmap.Dispose()

# ---------- apple-icon.png ----------
$iconSize = 180
$iconBitmap = New-Object System.Drawing.Bitmap($iconSize, $iconSize)
$iconGraphics = [System.Drawing.Graphics]::FromImage($iconBitmap)
$iconGraphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$iconGraphics.Clear($navy)

$iconRingPen = New-Object System.Drawing.Pen($white, 12)
$iconGraphics.DrawEllipse($iconRingPen, 46, 46, 88, 88)
$iconGraphics.FillEllipse((New-Object System.Drawing.SolidBrush($orange)), 118, 38, 26, 26)

$iconBitmap.Save((Join-Path $root 'app\apple-icon.png'), [System.Drawing.Imaging.ImageFormat]::Png)
$iconGraphics.Dispose()
$iconBitmap.Dispose()

Write-Output 'Đã sinh public/og-default.png và app/apple-icon.png'
