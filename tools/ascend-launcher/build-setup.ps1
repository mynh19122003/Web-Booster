param([switch]$Test)
$ErrorActionPreference='Stop'
& (Join-Path $PSScriptRoot 'build.ps1') -Test:$Test
$compiler=Join-Path $env:SystemRoot 'Microsoft.NET\Framework64\v4.0.30319\csc.exe'
$output=Join-Path $PSScriptRoot 'dist'
$name='AscendLauncher_0.1.0_x64-setup.exe'
$setup=Join-Path $output $name
$payload=Join-Path $output 'AscendLauncher.exe'
$icon=Join-Path $output 'ascend.ico'
$sources=@('Setup.cs','Installation.cs','ClientConfig.cs','Native.cs','RiotLauncher.cs','Version.cs','ProtocolRegistration.cs','Countdown.cs') | ForEach-Object { Join-Path $PSScriptRoot $_ }
& $compiler /nologo /target:winexe /platform:x64 /optimize+ /utf8output /codepage:65001 /main:AscendLauncher.SetupProgram "/out:$setup" /reference:System.Windows.Forms.dll /reference:System.Drawing.dll /reference:System.Runtime.Serialization.dll "/win32manifest:$PSScriptRoot\app.manifest" "/win32icon:$icon" "/resource:$icon,ascend-window.ico" "/resource:$payload,launcher.exe" @sources
if($LASTEXITCODE -ne 0){throw 'Setup compilation failed.'}
foreach($file in @($setup,$payload)) {
 $bytes=[IO.File]::ReadAllBytes($file);$offset=[BitConverter]::ToInt32($bytes,60)
 if([BitConverter]::ToUInt16($bytes,$offset+4)-ne 0x8664 -or [BitConverter]::ToUInt16($bytes,$offset+92)-ne 2){throw 'Release artifacts must be x64 Windows GUI executables.'}
 if([Diagnostics.FileVersionInfo]::GetVersionInfo($file).FileVersion -ne '0.1.0.0'){throw 'Unexpected release version.'}
}
$download=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../../public/downloads'))
New-Item -ItemType Directory -Path $download -Force | Out-Null
Copy-Item -LiteralPath $setup -Destination (Join-Path $download $name) -Force
$hash=(Get-FileHash -LiteralPath $setup -Algorithm SHA256).Hash
[IO.File]::WriteAllText((Join-Path $output ($name+'.sha256')),$hash+'  '+$name+[Environment]::NewLine)
if($Test) {
 $sources=@('InstallationTests.cs','Installation.cs','ClientConfig.cs','Native.cs','RiotLauncher.cs','Version.cs','ProtocolRegistration.cs','Countdown.cs') | ForEach-Object { Join-Path $PSScriptRoot $_ }
 & $compiler /nologo /target:exe /platform:x64 /utf8output /codepage:65001 "/out:$output\InstallationTests.exe" /reference:System.Runtime.Serialization.dll @sources
 if($LASTEXITCODE -ne 0){throw 'Installation tests compilation failed.'}
 & (Join-Path $output 'InstallationTests.exe') $payload $setup
 if($LASTEXITCODE -ne 0){throw 'Installation tests failed.'}
}
if($Test) {
 $logo=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../../public/brand/logo-icon.png'))
 $sources=@('FlowTests.cs','Program.cs','LauncherTheme.cs','Native.cs','ClientConfig.cs','RiotLauncher.cs','Version.cs','ProtocolRegistration.cs','Countdown.cs') | ForEach-Object { Join-Path $PSScriptRoot $_ }
 & $compiler /nologo /target:exe /platform:x64 /utf8output /codepage:65001 /main:AscendLauncher.FlowTests "/out:$output\FlowTests.exe" /reference:System.Windows.Forms.dll /reference:System.Drawing.dll /reference:System.Runtime.Serialization.dll "/resource:$icon,ascend-window.ico" "/resource:$logo,ascend-logo.png" @sources
 if($LASTEXITCODE -ne 0){throw 'Flow tests compilation failed.'}
 & (Join-Path $output 'FlowTests.exe') $payload
 if($LASTEXITCODE -ne 0){throw 'Flow tests failed.'}
}
Write-Host "Distribution: $setup"
Write-Host "SHA256: $hash"
