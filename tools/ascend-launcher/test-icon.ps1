$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Drawing
$icoPath=Join-Path $PSScriptRoot 'dist/ascend.ico'
$bytes=[IO.File]::ReadAllBytes($icoPath)
if([BitConverter]::ToUInt16($bytes,0) -ne 0 -or [BitConverter]::ToUInt16($bytes,2) -ne 1 -or [BitConverter]::ToUInt16($bytes,4) -ne 6) { throw 'Invalid multi-resolution ICO header.' }
$expected=@(16,32,48,64,128,256)
foreach($index in 0..5) {
    $entry=6+16*$index
    $width=if($bytes[$entry] -eq 0){256}else{[int]$bytes[$entry]}
    $height=if($bytes[$entry+1] -eq 0){256}else{[int]$bytes[$entry+1]}
    if($width -ne $expected[$index] -or $height -ne $width) { throw 'Incorrect icon dimensions.' }
    $length=[BitConverter]::ToUInt32($bytes,$entry+8)
    $offset=[BitConverter]::ToUInt32($bytes,$entry+12)
    if($width -eq 256) {
        $stream=[IO.MemoryStream]::new($bytes,$offset,$length)
        $bitmap=[Drawing.Bitmap]::new($stream)
        try {
            if($bitmap.Width -ne $width -or $bitmap.Height -ne $height) { throw 'Incorrect PNG frame dimensions.' }
            if($bitmap.GetPixel(0,0).A -ne 0 -or $bitmap.GetPixel($width-1,$height-1).A -ne 0) { throw 'Opaque PNG background.' }
        } finally { $bitmap.Dispose(); $stream.Dispose() }
    } else {
        if([BitConverter]::ToUInt32($bytes,$offset) -ne 40 -or [BitConverter]::ToInt32($bytes,$offset+4) -ne $width -or [BitConverter]::ToInt32($bytes,$offset+8) -ne $height*2) { throw 'Incorrect DIB frame dimensions.' }
        foreach($point in @(@(0,0),@(($width-1),0),@(0,($height-1)),@(($width-1),($height-1)))) {
            $alphaOffset=$offset+40+(($height-1-$point[1])*$width+$point[0])*4+3
            if($bytes[$alphaOffset] -ne 0) { throw 'Opaque rectangular background found.' }
        }
    }
}
$icon=[Drawing.Icon]::new($icoPath,[Drawing.Size]::new(32,32))
$extracted=[Drawing.Icon]::ExtractAssociatedIcon((Join-Path $PSScriptRoot 'dist/AscendLauncher.exe'))
$expectedBitmap=$icon.ToBitmap(); $actualBitmap=$extracted.ToBitmap()
try {
    if($actualBitmap.Size -ne $expectedBitmap.Size) { throw 'Unexpected executable icon dimensions.' }
    for($y=0;$y -lt $actualBitmap.Height;$y++) {
        for($x=0;$x -lt $actualBitmap.Width;$x++) {
            if($actualBitmap.GetPixel($x,$y).ToArgb() -ne $expectedBitmap.GetPixel($x,$y).ToArgb()) { throw 'Executable icon differs from ASCEND ICO resource.' }
        }
    }
} finally { $actualBitmap.Dispose();$expectedBitmap.Dispose();$extracted.Dispose();$icon.Dispose() }
$assembly=[Reflection.Assembly]::Load([IO.File]::ReadAllBytes((Join-Path $PSScriptRoot 'dist/AscendLauncher.exe')))
foreach($resource in @(
    @{Name='ascend-logo.png';Path=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../../public/brand/logo-icon.png'))},
    @{Name='ascend-window.ico';Path=$icoPath}
)) {
    $stream=$assembly.GetManifestResourceStream($resource.Name)
    if(!$stream) { throw 'Brand resource missing from executable.' }
    $hash=[Security.Cryptography.SHA256]::Create()
    try {
        $embedded=[BitConverter]::ToString($hash.ComputeHash($stream))
        $source=[BitConverter]::ToString($hash.ComputeHash([IO.File]::ReadAllBytes($resource.Path)))
        if($embedded -cne $source) { throw 'Embedded artwork differs from brand source.' }
    } finally { $hash.Dispose(); $stream.Dispose() }
}
Write-Host 'PASS: six ICO resolutions, transparent corners, EXE icon equals ASCEND ICO, body/window resources match their sources.'
