param()
$ErrorActionPreference='Stop'
& (Join-Path $PSScriptRoot 'build.ps1') -Test
$compiler=Join-Path $env:SystemRoot 'Microsoft.NET\Framework64\v4.0.30319\csc.exe'
$output=Join-Path $PSScriptRoot 'dist'
$icon=Join-Path $output 'ascend.ico'
$logo=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../../public/brand/logo-icon.png'))
$sources=@('Native.cs','ClientConfig.cs','RiotLauncher.cs','Program.cs','LauncherTheme.cs','Version.cs','ProtocolRegistration.cs','Countdown.cs','PickerReview.cs') | ForEach-Object { Join-Path $PSScriptRoot $_ }
& $compiler /nologo /target:winexe /platform:x64 /codepage:65001 /main:AscendLauncher.PickerReview "/out:$output\PickerReview.exe" /reference:System.Windows.Forms.dll /reference:System.Drawing.dll /reference:System.Runtime.Serialization.dll "/win32icon:$icon" "/resource:$icon,ascend-window.ico" "/resource:$logo,ascend-logo.png" @sources
if($LASTEXITCODE -ne 0) { throw 'Picker review compilation failed.' }
Write-Host 'Built PickerReview.exe: isolated config in dist, no automatic detection; selecting a valid Riot file runs the real launch flow.'
