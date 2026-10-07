param()
$ErrorActionPreference='Stop'
$compiler=Join-Path $env:SystemRoot 'Microsoft.NET\Framework64\v4.0.30319\csc.exe'
$output=Join-Path $PSScriptRoot 'dist'
$icon=Join-Path $output 'ascend.ico'
$logo=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../../public/brand/logo-icon.png'))
$sources=@('UiReview.cs','FlowTests.cs','Program.cs','LauncherTheme.cs','Native.cs','ClientConfig.cs','RiotLauncher.cs','Version.cs','ProtocolRegistration.cs','Countdown.cs') | ForEach-Object {Join-Path $PSScriptRoot $_}
& $compiler /nologo /target:exe /platform:x64 /codepage:65001 /main:AscendLauncher.UiReview "/out:$output\UiReview.exe" /reference:System.Windows.Forms.dll /reference:System.Drawing.dll /reference:System.Runtime.Serialization.dll /reference:System.Core.dll "/resource:$icon,ascend-window.ico" "/resource:$logo,ascend-logo.png" @sources
if($LASTEXITCODE -ne 0){throw 'UI review compilation failed.'}
& (Join-Path $output 'UiReview.exe') (Join-Path $output 'AscendLauncher.exe') $output
if($LASTEXITCODE -ne 0){throw 'UI review failed.'}
