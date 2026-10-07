$ErrorActionPreference = 'Stop'
try {
    . (Join-Path $PSScriptRoot 'launcher-functions.ps1')
    Assert-PocDirectory
    foreach ($key in @($script:SchemeKey, $script:ConfigKey)) {
        if ((Test-Path -LiteralPath $key) -and !(Test-OwnedKey $key)) { throw 'Ownership mismatch. No registry keys or runtime files were removed.' }
    }
    if (Test-Path -LiteralPath $script:SchemeKey) {
        $commandKey = $script:SchemeKey + '\shell\open\command'
        if (!(Test-Path -LiteralPath $commandKey) -or (Get-Item -LiteralPath $commandKey).GetValue('') -cne (Get-PocCommand)) {
            throw 'Protocol command changed. Removal refused.'
        }
    }
    # Delete only the two exact owned registry roots, after verifying ownership.
    foreach ($key in @($script:SchemeKey, $script:ConfigKey)) {
        if (Test-Path -LiteralPath $key) { Remove-Item -LiteralPath $key -Recurse -Force }
    }
    if (Test-Path -LiteralPath $script:RuntimeDir) {
        # Never recursively remove runtime directories or unknown files.
        foreach ($name in @('AscendLauncher.exe', 'launch-riot.ps1', 'launcher-functions.ps1', 'launcher.log')) {
            $target = [IO.Path]::GetFullPath((Join-Path $script:RuntimeDir $name))
            if ([IO.Path]::GetDirectoryName($target) -cne $script:RuntimeDir) { throw 'Runtime target escaped the owned directory.' }
            if (Test-Path -LiteralPath $target) { Remove-Item -LiteralPath $target -Force }
        }
        $remaining = @(Get-ChildItem -LiteralPath $script:RuntimeDir -Force | Where-Object { $_.Name -ne '.owner' })
        if ($remaining.Count -gt 0) {
            Show-PocMessage ('Protocol removed; additional files retained. Review manually: ' + $script:RuntimeDir)
            exit 0
        }
        Remove-Item -LiteralPath (Join-Path $script:RuntimeDir '.owner') -Force
        Remove-Item -LiteralPath $script:RuntimeDir -Force
    }
    Show-PocMessage 'ASCEND PoC registry and owned runtime files removed. Riot Client was not changed.'
} catch {
    if (Get-Command Show-PocMessage -ErrorAction SilentlyContinue) { Show-PocMessage ('Removal incomplete: ' + $_.Exception.Message + ' Review: ' + $script:RuntimeDir) -Failure }
    else { Write-Error 'Unable to load PoC uninstaller. Check source files and machine policy.' }
    exit 1
}
