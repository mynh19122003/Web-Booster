param([string]$ClientPath, [string]$LauncherPath, [switch]$EnableDiagnostics, [switch]$NoSuccessDialog)
$ErrorActionPreference = 'Stop'
try {
    . (Join-Path $PSScriptRoot 'launcher-functions.ps1')
    Assert-PocDirectory
    if (!(Test-Path -LiteralPath $script:SchemeKey) -and (Test-Path -LiteralPath 'HKLM:\Software\Classes\ascendriot')) { throw 'ascendriot is already registered machine-wide. It will not be overridden.' }
    if ((Test-Path -LiteralPath $script:SchemeKey) -and !(Test-OwnedKey $script:SchemeKey)) {
        throw 'ascendriot is already registered by another handler. It will not be overwritten.'
    }
    if ((Test-Path -LiteralPath $script:ConfigKey) -and !(Test-OwnedKey $script:ConfigKey)) {
        throw 'Existing ASCEND configuration is not owned by this PoC.'
    }
    if (!$LauncherPath) { $LauncherPath = Join-Path $PSScriptRoot '../ascend-launcher/dist/AscendLauncher.exe' }
    if (!(Test-Path -LiteralPath $LauncherPath -PathType Leaf)) { throw 'Build tools/ascend-launcher/build.ps1 before installing the protocol.' }
    $launcher = Get-Item -LiteralPath $LauncherPath
    if ($launcher.Name -cne 'AscendLauncher.exe' -or ($launcher.Attributes -band [IO.FileAttributes]::ReparsePoint)) { throw 'Expected a regular AscendLauncher.exe build.' }
    foreach ($name in @('launch-riot.ps1', 'launcher-functions.ps1')) {
        if (!(Test-Path -LiteralPath (Join-Path $PSScriptRoot $name) -PathType Leaf)) { throw 'A required source script is missing.' }
    }
    $selected = $null
    if ($ClientPath) { $selected = Assert-RiotClient $ClientPath }
    New-Item -ItemType Directory -Path $script:RuntimeDir -Force | Out-Null
    [IO.File]::WriteAllText((Join-Path $script:RuntimeDir '.owner'), $script:Owner)
    foreach ($name in @('launch-riot.ps1', 'launcher-functions.ps1')) {
        $destination = Join-Path $script:RuntimeDir $name
        if ((Test-Path -LiteralPath $destination) -and ((Get-Item -LiteralPath $destination).Attributes -band [IO.FileAttributes]::ReparsePoint)) { throw 'Runtime file cannot be a symbolic link.' }
        Copy-Item -LiteralPath (Join-Path $PSScriptRoot $name) -Destination $destination -Force
    }
    if ($selected) { Save-RiotClient $selected }
    $destination = Join-Path $script:RuntimeDir 'AscendLauncher.exe'
    if ((Test-Path -LiteralPath $destination) -and ((Get-Item -LiteralPath $destination).Attributes -band [IO.FileAttributes]::ReparsePoint)) { throw 'Launcher destination cannot be a symbolic link.' }
    Copy-Item -LiteralPath $launcher.FullName -Destination $destination -Force
    if ($EnableDiagnostics) {
        if (!(Test-Path -LiteralPath $script:ConfigKey)) { New-Item -Path $script:ConfigKey | Out-Null }
        New-ItemProperty -LiteralPath $script:ConfigKey -Name Owner -Value $script:Owner -PropertyType String -Force | Out-Null
        New-ItemProperty -LiteralPath $script:ConfigKey -Name DiagnosticsEnabled -Value 1 -PropertyType DWord -Force | Out-Null
    }
    New-Item -Path $script:SchemeKey -Force | Out-Null
    Set-Item -LiteralPath $script:SchemeKey -Value 'URL:ASCEND Riot Launcher PoC'
    New-ItemProperty -LiteralPath $script:SchemeKey -Name Owner -Value $script:Owner -PropertyType String -Force | Out-Null
    New-ItemProperty -LiteralPath $script:SchemeKey -Name 'URL Protocol' -Value '' -PropertyType String -Force | Out-Null
    New-Item -Path ($script:SchemeKey + '\shell\open\command') -Force | Out-Null
    Set-Item -LiteralPath ($script:SchemeKey + '\shell\open\command') -Value (Get-PocCommand)
    $message = 'ASCEND protocol handler installed for the current user. Client launch has not been tested.'
    if ($NoSuccessDialog) { Write-Host $message } else { Show-PocMessage $message }
} catch {
    if (Get-Command Show-PocMessage -ErrorAction SilentlyContinue) { Show-PocMessage ('Installation failed: ' + $_.Exception.Message) -Failure }
    else { Write-Error 'Unable to load PoC installer. Check source files and machine policy.' }
    exit 1
}
