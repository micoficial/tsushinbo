param([string]$OutDir)
Add-Type -AssemblyName System.Drawing

function New-Brush([string]$hex) { return New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml($hex)) }
function RoundRect([System.Drawing.Graphics]$g, $brush, [float]$x, [float]$y, [float]$w, [float]$h, [float]$r) {
  $p = New-Object System.Drawing.Drawing2D.GraphicsPath
  $d = $r * 2
  $p.AddArc($x, $y, $d, $d, 180, 90); $p.AddArc($x + $w - $d, $y, $d, $d, 270, 90)
  $p.AddArc($x + $w - $d, $y + $h - $d, $d, $d, 0, 90); $p.AddArc($x, $y + $h - $d, $d, $d, 90, 90)
  $p.CloseFigure(); $g.FillPath($brush, $p); $p.Dispose()
}
$fontName = 'Yu Gothic UI'
$installed = (New-Object System.Drawing.Text.InstalledFontCollection).Families | ForEach-Object { $_.Name }
if (-not ($installed -contains $fontName)) { $fontName = 'Meiryo' }

# ---- OGP 1200x630 ----
$bmp = New-Object System.Drawing.Bitmap 1200, 630
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = 'AntiAlias'; $g.TextRenderingHint = 'AntiAliasGridFit'; $g.InterpolationMode = 'HighQualityBicubic'
$g.Clear([System.Drawing.ColorTranslator]::FromHtml('#f7f5f0'))
$navy = New-Brush '#1f3f73'; $ink = New-Brush '#1c2333'; $muted = New-Brush '#5d6676'; $white = New-Brush '#ffffff'; $line = New-Brush '#e3dfd6'
$g.FillRectangle($navy, 0, 0, 1200, 14)

$fTitle = New-Object System.Drawing.Font($fontName, 92, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$fSub = New-Object System.Drawing.Font($fontName, 36, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$fSmall = New-Object System.Drawing.Font($fontName, 28, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
$fKey = New-Object System.Drawing.Font($fontName, 30, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$fGrade = New-Object System.Drawing.Font('Segoe UI', 40, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)

$g.DrawString('会社の通信簿', $fTitle, $ink, 64, 92)
$g.DrawString('残業・有給・育休・離職率を', $fSub, $muted, 70, 236)
$g.DrawString('国の公開データで5段階評定', $fSub, $muted, 70, 286)
RoundRect $g (New-Brush '#dcefe3') 70 372 360 56 28
$g.DrawString('無料・登録なし・3万社超', $fKey, (New-Brush '#16794a'), 92, 382)
$g.DrawString('micoficial.github.io/tsushinbo', $fSmall, $muted, 72, 540)

# report card illustration
RoundRect $g $line 716 70 424 492 26
RoundRect $g $white 712 64 424 492 26
$g.DrawString('通 信 簿', $fKey, $ink, 752, 92)
$g.FillRectangle($ink, 752, 140, 344, 3)
$rows = @(@('残業の少なさ', '4', '#3f8f5a'), @('有給の取りやすさ', '5', '#16794a'), @('男性の育休', '5', '#16794a'), @('勤続年数', '3', '#6f7a86'), @('女性管理職', '2', '#b7741c'))
$y = 162
foreach ($r in $rows) {
  $g.DrawString($r[0], $fSmall, $ink, 752, ($y + 14))
  RoundRect $g (New-Brush $r[2]) 1030 ($y + 6) 64 64 14
  $sf = New-Object System.Drawing.StringFormat; $sf.Alignment = 'Center'; $sf.LineAlignment = 'Center'
  $g.DrawString($r[1], $fGrade, $white, (New-Object System.Drawing.RectangleF(1030, ($y + 6), 64, 64)), $sf)
  $g.FillRectangle($line, 752, ($y + 76), 344, 2)
  $y += 76
}
$bmp.Save((Join-Path $OutDir 'og.png'), [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose(); $bmp.Dispose()

# ---- アイコン 180x180 ----
$s = 180
$bmp = New-Object System.Drawing.Bitmap $s, $s
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = 'AntiAlias'
$g.Clear([System.Drawing.ColorTranslator]::FromHtml('#1f3f73'))
$k = $s / 64
RoundRect $g $white (12 * $k) (15 * $k) (26 * $k) (7 * $k) (3.5 * $k)
RoundRect $g $white (12 * $k) (28.5 * $k) (26 * $k) (7 * $k) (3.5 * $k)
RoundRect $g $white (12 * $k) (42 * $k) (26 * $k) (7 * $k) (3.5 * $k)
RoundRect $g (New-Brush '#3fbf7f') (42 * $k) (13 * $k) (11 * $k) (11 * $k) (3 * $k)
RoundRect $g (New-Brush '#a8dcbc') (42 * $k) (26.5 * $k) (11 * $k) (11 * $k) (3 * $k)
RoundRect $g (New-Brush '#f2b45a') (42 * $k) (40 * $k) (11 * $k) (11 * $k) (3 * $k)
$bmp.Save((Join-Path $OutDir 'icon-180.png'), [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose(); $bmp.Dispose()
"font=$fontName"


