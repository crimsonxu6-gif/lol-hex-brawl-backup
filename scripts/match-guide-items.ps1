param(
  [Parameter(Mandatory=$true)][string]$Image,
  [Parameter(Mandatory=$true)][int]$X,
  [Parameter(Mandatory=$true)][int]$Y,
  [int]$Size = 64,
  [int]$Count = 6,
  [int]$Gap = 5,
  [int]$Padding = 1,
  [int]$Top = 8
)

Add-Type -AssemblyName System.Drawing

$root = Resolve-Path (Join-Path $PSScriptRoot '..')
$itemDir = Join-Path $root '.cache\ddragon-16.13.1-items'
$itemData = (Get-Content -Raw -Encoding UTF8 (Join-Path $itemDir 'item-zh_CN.json') | ConvertFrom-Json).data
$guidePath = (Resolve-Path $Image).Path
$guide = [System.Drawing.Bitmap]::new($guidePath)

function Resize-Bitmap([System.Drawing.Bitmap]$Bitmap, [int]$Width, [int]$Height) {
  $resized = [System.Drawing.Bitmap]::new($Width, $Height)
  $g = [System.Drawing.Graphics]::FromImage($resized)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.DrawImage($Bitmap, 0, 0, $Width, $Height)
  $g.Dispose()
  return $resized
}

function Crop-Bitmap([System.Drawing.Bitmap]$Bitmap, [int]$Left, [int]$Top, [int]$Width, [int]$Height) {
  $rect = [System.Drawing.Rectangle]::new($Left, $Top, $Width, $Height)
  return $Bitmap.Clone($rect, $Bitmap.PixelFormat)
}

function Diff-Bitmap([System.Drawing.Bitmap]$A, [System.Drawing.Bitmap]$B) {
  $sum = 0.0
  $count = 0
  for ($py = 0; $py -lt $A.Height; $py += 2) {
    for ($px = 0; $px -lt $A.Width; $px += 2) {
      $ca = $A.GetPixel($px, $py)
      $cb = $B.GetPixel($px, $py)
      $sum += [math]::Pow($ca.R - $cb.R, 2)
      $sum += [math]::Pow($ca.G - $cb.G, 2)
      $sum += [math]::Pow($ca.B - $cb.B, 2)
      $count += 3
    }
  }
  return [math]::Sqrt($sum / [math]::Max(1, $count))
}

$icons = @()
Get-ChildItem -File $itemDir -Filter '*.png' | ForEach-Object {
  $id = [int]($_.BaseName)
  $meta = $itemData.$($_.BaseName)
  if ($null -eq $meta -or $meta.maps.'12' -eq $false) { return }
  $bmp = [System.Drawing.Bitmap]::new($_.FullName)
  $icons += [pscustomobject]@{
    Id = $id
    Name = $meta.name
    Bitmap = (Resize-Bitmap $bmp 64 64)
  }
  $bmp.Dispose()
}

for ($slot = 0; $slot -lt $Count; $slot++) {
  $left = $X + ($slot * ($Size + $Gap)) + $Padding
  $topY = $Y + $Padding
  $cropSize = $Size - (2 * $Padding)
  $crop = Crop-Bitmap $guide $left $topY $cropSize $cropSize
  $sample = Resize-Bitmap $crop 64 64
  $matches = foreach ($icon in $icons) {
    [pscustomobject]@{
      Slot = $slot + 1
      Id = $icon.Id
      Name = $icon.Name
      Score = [math]::Round((Diff-Bitmap $sample $icon.Bitmap), 2)
    }
  }
  Write-Output "slot $($slot + 1) crop=[$left,$topY,$cropSize]"
  $matches | Sort-Object Score | Select-Object -First $Top | Format-Table -AutoSize
  $crop.Dispose()
  $sample.Dispose()
}

$guide.Dispose()
foreach ($icon in $icons) {
  $icon.Bitmap.Dispose()
}
