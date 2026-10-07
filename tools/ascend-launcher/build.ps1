param([switch]$Test)
$ErrorActionPreference='Stop'
$compiler=Join-Path $env:SystemRoot 'Microsoft.NET\Framework64\v4.0.30319\csc.exe'
if(!(Test-Path -LiteralPath $compiler)) { throw 'Windows .NET Framework C# compiler not found.' }
$output=Join-Path $PSScriptRoot 'dist'
New-Item -ItemType Directory -Path $output -Force | Out-Null
$logo=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../../public/brand/logo-icon.png'))
$icon=Join-Path $output 'ascend.ico'
& (Join-Path $PSScriptRoot 'build-icon.ps1') -OutputPath $icon
$sources=@('Native.cs','ClientConfig.cs','RiotLauncher.cs','Program.cs','LauncherTheme.cs','Version.cs','ProtocolRegistration.cs','Countdown.cs') | ForEach-Object { Join-Path $PSScriptRoot $_ }
& $compiler /nologo /target:winexe /platform:x64 /optimize+ /utf8output /codepage:65001 "/out:$output\AscendLauncher.exe" /reference:System.Windows.Forms.dll /reference:System.Runtime.Serialization.dll /reference:System.Drawing.dll "/win32manifest:$PSScriptRoot\app.manifest" "/win32icon:$icon" "/resource:$icon,ascend-window.ico" "/resource:$logo,ascend-logo.png" @sources
if($LASTEXITCODE -ne 0) { throw 'Launcher compilation failed.' }
$bytes=[IO.File]::ReadAllBytes((Join-Path $output 'AscendLauncher.exe'))
$peOffset=[BitConverter]::ToInt32($bytes,60)
if([BitConverter]::ToUInt16($bytes,$peOffset+92) -ne 2) { throw 'Launcher must use the Windows GUI subsystem, never a console subsystem.' }
if($Test) {
    & (Join-Path $PSScriptRoot 'test-icon.ps1')
    & $compiler /nologo /target:exe /platform:x64 /utf8output /codepage:65001 "/out:$output\LauncherTests.exe" /reference:System.Runtime.Serialization.dll /reference:System.Drawing.dll (Join-Path $PSScriptRoot 'Native.cs') (Join-Path $PSScriptRoot 'ClientConfig.cs') (Join-Path $PSScriptRoot 'RiotLauncher.cs') (Join-Path $PSScriptRoot 'Tests.cs')
    if($LASTEXITCODE -ne 0) { throw 'Test compilation failed.' }
    & (Join-Path $output 'LauncherTests.exe')
    if($LASTEXITCODE -ne 0) { throw 'Launcher tests failed.' }
}
Write-Host "Built: $output\AscendLauncher.exe"
