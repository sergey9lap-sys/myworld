Add-Type -AssemblyName System.Drawing
$files = @(Get-ChildItem 'C:\Users\User\Pictures\Screenshots' -Filter '*.png' -File | Sort-Object Name)
$bmp = New-Object System.Drawing.Bitmap(1200, ([int][math]::Ceiling($files.Count / 6) * 128))
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.Clear([System.Drawing.Color]::White)
$font = New-Object System.Drawing.Font('Arial', 10)
for ($i=0; $i -lt $files.Count; $i++) {
  $im = [System.Drawing.Image]::FromFile($files[$i].FullName)
  $x = ($i % 6)*200; $y = [math]::Floor($i/6)*128
  $g.DrawImage($im, [int]$x, [int]$y, 195, 105)
  $g.DrawString([string]$i, $font, [System.Drawing.Brushes]::Black, [single]$x, [single]($y+107))
  $im.Dispose()
}
$bmp.Save((Join-Path $PSScriptRoot '..\tmp\screens.jpg'), [System.Drawing.Imaging.ImageFormat]::Jpeg)
$g.Dispose(); $bmp.Dispose()
