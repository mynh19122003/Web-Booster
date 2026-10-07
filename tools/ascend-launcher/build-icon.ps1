# Resize/format conversion only. Source of truth stays in public/brand.
param([string]$OutputPath = (Join-Path $PSScriptRoot 'dist/ascend.ico'))
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$sourcePath = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../../public/brand/logo-icon.png'))
$source = [Drawing.Bitmap]::new($sourcePath)
$frames = @()
try {
    foreach ($size in @(16,32,48,64,128,256)) {
        $bitmap = [Drawing.Bitmap]::new($size,$size,[Drawing.Imaging.PixelFormat]::Format32bppArgb)
        $graphics = [Drawing.Graphics]::FromImage($bitmap)
        $stream = [IO.MemoryStream]::new()
        try {
            $graphics.Clear([Drawing.Color]::Transparent)
            $graphics.CompositingMode = [Drawing.Drawing2D.CompositingMode]::SourceCopy
            $graphics.InterpolationMode = [Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
            $graphics.PixelOffsetMode = [Drawing.Drawing2D.PixelOffsetMode]::HighQuality
            $scale = [Math]::Min($size / $source.Width, $size / $source.Height)
            $width = [int][Math]::Round($source.Width * $scale)
            $height = [int][Math]::Round($source.Height * $scale)
            $rect = [Drawing.Rectangle]::new([int](($size-$width)/2),[int](($size-$height)/2),$width,$height)
            $graphics.DrawImage($source,$rect,0,0,$source.Width,$source.Height,[Drawing.GraphicsUnit]::Pixel)
            if ($size -eq 256) { $bitmap.Save($stream,[Drawing.Imaging.ImageFormat]::Png) }
            else {
                # Classic 32-bit DIB frames for Windows Shell compatibility.
                $binary=[IO.BinaryWriter]::new($stream,[Text.Encoding]::UTF8,$true)
                try {
                    $maskStride=[int]([Math]::Ceiling($size/32.0)*4)
                    $binary.Write([uint32]40); $binary.Write([int32]$size); $binary.Write([int32]($size*2))
                    $binary.Write([uint16]1); $binary.Write([uint16]32); $binary.Write([uint32]0)
                    $binary.Write([uint32]($size*$size*4+$maskStride*$size))
                    foreach($unused in 1..4) { $binary.Write([uint32]0) }
                    for($y=$size-1;$y -ge 0;$y--) {
                        for($x=0;$x -lt $size;$x++) {
                            $pixel=$bitmap.GetPixel($x,$y)
                            $binary.Write([byte]$pixel.B); $binary.Write([byte]$pixel.G); $binary.Write([byte]$pixel.R); $binary.Write([byte]$pixel.A)
                        }
                    }
                    for($y=$size-1;$y -ge 0;$y--) {
                        $mask=[byte[]]::new($maskStride)
                        for($x=0;$x -lt $size;$x++) {
                            if($bitmap.GetPixel($x,$y).A -eq 0) {
                                $byteIndex=[int][Math]::Floor($x/8.0)
                                $mask[$byteIndex]=$mask[$byteIndex] -bor (128 -shr ($x%8))
                            }
                        }
                        $binary.Write($mask)
                    }
                } finally { $binary.Dispose() }
            }
            $frames += [PSCustomObject]@{Size=$size;Data=$stream.ToArray()}
        } finally { $stream.Dispose(); $graphics.Dispose(); $bitmap.Dispose() }
    }
} finally { $source.Dispose() }
New-Item -ItemType Directory -Path ([IO.Path]::GetDirectoryName([IO.Path]::GetFullPath($OutputPath))) -Force | Out-Null
$file = [IO.File]::Create($OutputPath)
$writer = [IO.BinaryWriter]::new($file)
try {
    $writer.Write([uint16]0); $writer.Write([uint16]1); $writer.Write([uint16]$frames.Count)
    $offset = 6 + 16*$frames.Count
    foreach ($frame in $frames) {
        $dimension = if ($frame.Size -eq 256) { 0 } else { $frame.Size }
        $writer.Write([byte]$dimension); $writer.Write([byte]$dimension)
        $writer.Write([byte]0); $writer.Write([byte]0)
        $writer.Write([uint16]1); $writer.Write([uint16]32)
        $writer.Write([uint32]$frame.Data.Length); $writer.Write([uint32]$offset)
        $offset += $frame.Data.Length
    }
    foreach ($frame in $frames) { $writer.Write([byte[]]$frame.Data) }
} finally { $writer.Dispose(); $file.Dispose() }
Write-Host "Brand ICO: $OutputPath (16, 32, 48, 64, 128, 256)"
