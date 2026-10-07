# Deliberately no param block: accept exactly one positional raw URI.
$ErrorActionPreference = 'Stop'
$requestArgs = @($args)
try {
    . (Join-Path $PSScriptRoot 'launcher-functions.ps1')
    Write-PocDiagnostic 'HANDLER_RECEIVED'
    if ($requestArgs.Count -ne 1 -or $requestArgs[0] -isnot [string] -or
        @('ascendriot://open/league', 'ascendriot://open/riot') -cnotcontains $requestArgs[0]) {
        # No decoding or URI normalization. Never echo the rejected payload.
        Write-PocDiagnostic 'URI_REJECTED'
        Show-PocMessage 'Invalid launch request. Only the two documented ASCEND URLs are accepted.' -Failure
        exit 2
    }
    $action = $requestArgs[0]
    $diagnosticAction = if ($action -ceq 'ascendriot://open/league') { 'LEAGUE' } else { 'RIOT' }
    Write-PocDiagnostic 'URI_ACCEPTED' $diagnosticAction
    $client = Find-RiotClient
    if (!$client) { Write-PocDiagnostic 'SELECTION_CANCELLED' $diagnosticAction; exit 0 }
    # Verify again immediately before every process launch.
    $client = Assert-RiotClient $client
    $workingDirectory = [IO.Path]::GetDirectoryName($client)
    Write-PocDiagnostic ('LAUNCH_CONFIG client=' + $client + ' cwd=' + $workingDirectory) $diagnosticAction
    Write-PocWindowDiagnostic 'BEFORE' $diagnosticAction
    $existingWindow = Find-PocRiotWindow $client
    $ui = if ($existingWindow) { $existingWindow.Path } else { Find-PocRiotUi $client }
    $spawn = $null
    Write-PocDiagnostic 'VERIFIED_LAUNCH_ATTEMPT' $diagnosticAction
    if ($action -ceq 'ascendriot://open/league') {
        $spawn = Start-PocRiotProcess $client @('--launch-product=league_of_legends', '--launch-patchline=live')
        if (!$existingWindow -and $ui) { Start-Sleep -Seconds 1 }
    } elseif (!$existingWindow -and !$ui) {
        $spawn = Start-PocRiotProcess $client
    }
    if ($existingWindow) {
        $focused = Restore-PocRiotWindow $existingWindow
        Write-PocDiagnostic ('EXISTING_WINDOW_RESTORED foreground=' + $focused) $diagnosticAction
    } elseif ($ui) {
        # This installed client uses Electron; Services alone logged launch_ux=false.
        $uiSpawn = Start-PocRiotProcess $ui
        Write-PocDiagnostic ('UI_REQUEST_SENT path=' + $ui + ' pid=' + $uiSpawn.Id) $diagnosticAction
    }
    Write-Host 'Launch request sent. This does not confirm that the client is visible.'
    Write-PocDiagnostic 'PROCESS_REQUEST_SENT' $diagnosticAction
    if ($spawn) { Write-PocDiagnostic ('SPAWN_PID_' + $spawn.Id) $diagnosticAction }
    $visibleWindow = Wait-PocRiotVisible $client $ui
    if ($visibleWindow) {
        Write-PocDiagnostic ('VISIBLE_WINDOW_FOUND pid=' + $visibleWindow.Id + ' handle=' + $visibleWindow.MainWindowHandle) $diagnosticAction
    } else { Write-PocDiagnostic 'VISIBLE_WINDOW_TIMEOUT' $diagnosticAction }
    # No diagnostic sleeps or client-lifetime waits after visibility is confirmed.
    Write-PocDiagnostic 'HANDLER_EXIT_OK' $diagnosticAction
    exit 0
} catch {
    if (Get-Command Write-PocDiagnostic -ErrorAction SilentlyContinue) { Write-PocDiagnostic 'LAUNCH_ERROR' }
    if (Get-Command Show-PocMessage -ErrorAction SilentlyContinue) {
        Show-PocMessage ('Riot launch failed: ' + $_.Exception.Message) -Failure
    } else {
        Add-Type -AssemblyName System.Windows.Forms
        [void][Windows.Forms.MessageBox]::Show('ASCEND runtime is missing or blocked. Reinstall the PoC handler.', 'ASCEND Riot Launcher PoC')
    }
    exit 1
}
