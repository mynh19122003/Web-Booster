# Contract tests: no registry writes, picker, or real native process launches.
$ErrorActionPreference = 'Stop'
$testDir = Join-Path ([IO.Path]::GetTempPath()) ('ASCEND-handler-test-' + [Guid]::NewGuid().ToString('N'))
$testDir = [IO.Path]::GetFullPath($testDir)
$tempRoot = [IO.Path]::GetFullPath([IO.Path]::GetTempPath())
if (!$testDir.StartsWith($tempRoot, [StringComparison]::OrdinalIgnoreCase)) { throw 'Unsafe test path.' }
New-Item -ItemType Directory -Path $testDir | Out-Null
try {
    $parseCount = 0
    foreach ($file in Get-ChildItem -LiteralPath $PSScriptRoot -Filter '*.ps1') {
        $tokens = $null; $errors = $null
        [void][Management.Automation.Language.Parser]::ParseFile($file.FullName, [ref]$tokens, [ref]$errors)
        if ($errors.Count) { throw ('Parser failed: ' + $file.Name) }
        $parseCount++
    }
    Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'launch-riot.ps1') -Destination (Join-Path $testDir 'launch-riot.ps1')
    $helper = @'
function Show-PocMessage { param($Message, [switch]$Failure) }
function Write-PocDiagnostic { param($Event, $Action) }
function Write-PocWindowDiagnostic { param($Stage, $Action) }
function Test-PocDiagnostics { return $false }
function Find-RiotClient { return 'C:\Verified Riot\RiotClientServices.exe' }
function Assert-RiotClient { param($Path) return $Path }
function Find-PocRiotWindow { param($Client) return $null }
function Find-PocRiotUi { param($Client) return $null }
function Wait-PocRiotVisible { param($Client, $Ui) return [PSCustomObject]@{Id=123;MainWindowHandle=456} }
function Start-PocRiotProcess { param($Path, $LaunchArguments=@()) return Start-Process -FilePath $Path -ArgumentList $LaunchArguments -WindowStyle Normal -WorkingDirectory ([IO.Path]::GetDirectoryName($Path)) -PassThru }
function Start-Process {
    param($FilePath, $ArgumentList, $WindowStyle, $WorkingDirectory, [switch]$PassThru)
    @{ FilePath = $FilePath; Arguments = @($ArgumentList); WindowStyle = $WindowStyle; WorkingDirectory = $WorkingDirectory } | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $PSScriptRoot 'launch-result.json')
    return [PSCustomObject]@{Id=123}
}
'@
    [IO.File]::WriteAllText((Join-Path $testDir 'launcher-functions.ps1'), $helper, [Text.UTF8Encoding]::new($true))
    $runner = @'
$request = Get-Content -LiteralPath (Join-Path $PSScriptRoot 'request.json') -Raw | ConvertFrom-Json
$launchArguments = @($request.Arguments)
& (Join-Path $PSScriptRoot 'launch-riot.ps1') @launchArguments
exit $LASTEXITCODE
'@
    [IO.File]::WriteAllText((Join-Path $testDir 'runner.ps1'), $runner, [Text.UTF8Encoding]::new($true))
    $cases = @(
        @{ Arguments = @(); Valid = $false },
        @{ Arguments = @(''); Valid = $false },
        @{ Arguments = @('ascendriot://open/riot'); Valid = $true },
        @{ Arguments = @('ascendriot://open/league'); Valid = $true },
        @{ Arguments = @('ascendriot://run/calc'); Valid = $false },
        @{ Arguments = @('ascendriot://open/../../something'); Valid = $false },
        @{ Arguments = @('ascendriot://open/x/../league'); Valid = $false },
        @{ Arguments = @('ascendriot://open/league?x=1'); Valid = $false },
        @{ Arguments = @('ascendriot://open/league#x'); Valid = $false },
        @{ Arguments = @('ascendriot://open/%6ceague'); Valid = $false },
        @{ Arguments = @('https://open/league'); Valid = $false },
        @{ Arguments = @('ascendriot://other/league'); Valid = $false },
        @{ Arguments = @('ASCENDRIOT://open/league'); Valid = $false },
        @{ Arguments = @('ascendriot://open/league/'); Valid = $false },
        @{ Arguments = @('ascendriot://open/league', 'extra'); Valid = $false },
        @{ Arguments = @('ascendriot://open/league"payload'); Valid = $false },
        @{ Arguments = @("ascendriot://open/league`n"); Valid = $false }
    )
    $powershellExe = Join-Path $env:SystemRoot 'System32\WindowsPowerShell\v1.0\powershell.exe'
    foreach ($case in $cases) {
        $resultFile = Join-Path $testDir 'launch-result.json'
        if (Test-Path -LiteralPath $resultFile) { Remove-Item -LiteralPath $resultFile }
        $json = @{ Arguments = @($case.Arguments) } | ConvertTo-Json
        [IO.File]::WriteAllText((Join-Path $testDir 'request.json'), $json, [Text.UTF8Encoding]::new($true))
        & $powershellExe -NoProfile -File (Join-Path $testDir 'runner.ps1') | Out-Null
        $code = $LASTEXITCODE
        $launched = Test-Path -LiteralPath $resultFile
        if ($case.Valid) {
            if ($code -ne 0 -or !$launched) { throw 'Valid mapping failed in mocked runtime.' }
            $result = Get-Content -LiteralPath $resultFile -Raw | ConvertFrom-Json
            if ($result.FilePath -cne 'C:\Verified Riot\RiotClientServices.exe') { throw 'Unexpected executable mapping.' }
            if ($result.WorkingDirectory -cne 'C:\Verified Riot') { throw 'Working directory does not match installed executable.' }
            $actual = @($result.Arguments | Where-Object { $null -ne $_ })
            if ($case.Arguments[0] -ceq 'ascendriot://open/league') {
                if ($actual.Count -ne 2 -or $actual[0] -cne '--launch-product=league_of_legends' -or $actual[1] -cne '--launch-patchline=live') { throw 'League arguments are not fixed.' }
            } elseif ($actual.Count -ne 0) { throw 'Basic Riot launch must have no arguments.' }
        } elseif ($code -ne 2 -or $launched) { throw 'Invalid input was not safely rejected.' }
    }
    # Real Authenticode verification must refuse an unsigned same-name file.
    . (Join-Path $PSScriptRoot 'launcher-functions.ps1')
    function Find-PocRiotWindow {
        param($Client, $VerifiedPaths)
        $script:windowChecks++
        if ($script:windowChecks -ge $script:visibleOnCheck) { return [PSCustomObject]@{Id=123;MainWindowHandle=456} }
        return $null
    }
    function Test-PocRiotVisibleWindow { param($Window) return $null -ne $Window }
    function Start-Sleep { param($Milliseconds) $script:pollSleeps++ }
    $script:windowChecks=0; $script:pollSleeps=0; $script:visibleOnCheck=1
    $found=Wait-PocRiotVisible 'C:\Verified Riot\RiotClientServices.exe' $null
    if (!$found -or $script:pollSleeps -ne 0) { throw 'Visible client did not complete immediately.' }
    $script:windowChecks=0; $script:pollSleeps=0; $script:visibleOnCheck=2
    $found=Wait-PocRiotVisible 'C:\Verified Riot\RiotClientServices.exe' $null
    if (!$found -or $script:pollSleeps -ne 1) { throw 'Newly visible client incurred an extra wait.' }
    $script:windowChecks=0; $script:pollSleeps=0; $script:visibleOnCheck=100
    $found=Wait-PocRiotVisible 'C:\Verified Riot\RiotClientServices.exe' $null 0
    if ($found -or $script:pollSleeps -ne 0) { throw 'Visibility timeout did not stop.' }
    $detachedLauncher = (Get-Command Invoke-PocDetachedProcess).ScriptBlock
    $protocolCommand = Get-PocCommand
    if ($protocolCommand -cne ('"' + (Join-Path $script:RuntimeDir 'AscendLauncher.exe') + '" "%1"') -or $protocolCommand -match 'powershell') { throw 'Protocol must target native launcher with one quoted URI.' }
    $rejected = $false
    try { & $detachedLauncher 'C:\NotLaunched.exe' @('--unexpected') | Out-Null } catch { $rejected = $true }
    if (!$rejected -or !('AscendRiotProcess' -as [type])) { throw 'Native launcher compilation/argument guard failed.' }
    # Exercise the real child-launch helper with a harmless process mock.
    function Invoke-PocDetachedProcess {
        param($Path, $LaunchArguments)
        if (Test-Path Env:ELECTRON_RUN_AS_NODE) { throw 'Electron Node mode leaked to the client.' }
        if ($Path -cne 'C:\Verified Riot\RiotClientElectron\Riot Client.exe') { throw 'UI launch path incorrect.' }
        return [PSCustomObject]@{Id=123}
    }
    $originalElectron = $env:ELECTRON_RUN_AS_NODE
    try {
        $env:ELECTRON_RUN_AS_NODE = '1'
        Start-PocRiotProcess 'C:\Verified Riot\RiotClientElectron\Riot Client.exe' | Out-Null
        if ($env:ELECTRON_RUN_AS_NODE -cne '1') { throw 'Caller environment was not restored.' }
    } finally {
        Remove-Item Env:ELECTRON_RUN_AS_NODE -ErrorAction SilentlyContinue
        if ($null -ne $originalElectron) { $env:ELECTRON_RUN_AS_NODE = $originalElectron }
    }
    $unsigned = Join-Path $testDir 'RiotClientServices.exe'
    [IO.File]::WriteAllText($unsigned, 'Unsigned test fixture; not an executable.')
    $rejected = $false
    try { Assert-RiotClient $unsigned | Out-Null } catch { $rejected = $true }
    if (!$rejected) { throw 'Unsigned client was accepted.' }
    Copy-Item -LiteralPath $powershellExe -Destination $unsigned -Force
    $signature = Get-AuthenticodeSignature -LiteralPath $unsigned
    if ($signature.Status -ne 'Valid') { throw 'Signed non-Riot fixture could not be verified; this check did not run.' }
    $rejected = $false
    try { Assert-RiotClient $unsigned | Out-Null } catch { $rejected = $true }
    if (!$rejected) { throw 'Signed non-Riot publisher was accepted.' }
    Write-Host ('PASS: {0} PS5.1 syntax files, {1} raw URI/mapping cases, real unsigned and signed non-Riot client rejection. No registry or real application launch.' -f $parseCount, $cases.Count)
} finally {
    # Exact newly created temp directory, verified above; no outside paths.
    if ($testDir.StartsWith($tempRoot, [StringComparison]::OrdinalIgnoreCase) -and (Test-Path -LiteralPath $testDir)) { Remove-Item -LiteralPath $testDir -Recurse -Force }
}
