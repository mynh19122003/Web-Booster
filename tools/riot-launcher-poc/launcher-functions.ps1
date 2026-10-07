# Windows PowerShell 5.1. Shared by the installer and installed runtime.
Set-StrictMode -Version 2.0
$ErrorActionPreference = 'Stop'
$script:Owner = 'ASCEND.RiotLauncherPoC.v1'
$script:SchemeKey = 'HKCU:\Software\Classes\ascendriot'
$script:ConfigKey = 'HKCU:\Software\ASCEND\RiotLauncherPoC'
$script:RuntimeDir = [IO.Path]::GetFullPath((Join-Path $env:LOCALAPPDATA 'ASCEND\RiotLauncherPoC'))
$script:SystemPowerShell = Join-Path $env:SystemRoot 'System32\WindowsPowerShell\v1.0\powershell.exe'

function Show-PocMessage([string]$Message, [switch]$Failure) {
    Write-Host $Message
    Add-Type -AssemblyName System.Windows.Forms
    $icon = [Windows.Forms.MessageBoxIcon]::Information
    if ($Failure) { $icon = [Windows.Forms.MessageBoxIcon]::Error }
    [void][Windows.Forms.MessageBox]::Show($Message, 'ASCEND Riot Launcher PoC', [Windows.Forms.MessageBoxButtons]::OK, $icon)
}
function Get-PocCommand {
    $launcher = Join-Path $script:RuntimeDir 'AscendLauncher.exe'
    return ('"{0}" "%1"' -f $launcher)
}
function Test-OwnedKey([string]$Key) {
    if (!(Test-Path -LiteralPath $Key)) { return $false }
    return (Get-Item -LiteralPath $Key).GetValue('Owner', $null) -ceq $script:Owner
}
function Assert-PocDirectory {
    # Runtime ownership is also checked before opt-in diagnostic logging.
    # Never follow a junction/symlink during install or removal.
    foreach ($dir in @((Join-Path $env:LOCALAPPDATA 'ASCEND'), $script:RuntimeDir)) {
        if ((Test-Path -LiteralPath $dir) -and ((Get-Item -LiteralPath $dir).Attributes -band [IO.FileAttributes]::ReparsePoint)) {
            throw 'The PoC directory cannot be a junction or symbolic link.'
        }
    }
    if (Test-Path -LiteralPath $script:RuntimeDir) {
        $marker = Join-Path $script:RuntimeDir '.owner'
        if ((Test-Path -LiteralPath $marker) -and ((Get-Item -LiteralPath $marker).Attributes -band [IO.FileAttributes]::ReparsePoint)) { throw 'Ownership marker cannot be a symbolic link.' }
        if (!(Test-Path -LiteralPath $marker -PathType Leaf) -or [IO.File]::ReadAllText($marker) -cne $script:Owner) {
            throw 'The existing runtime directory is not owned by this PoC. No files were changed.'
        }
    }
}
function Write-PocDiagnostic([string]$Event, [string]$Action = 'NONE') {
    try {
        if (!(Test-OwnedKey $script:ConfigKey)) { return }
        if ((Get-Item -LiteralPath $script:ConfigKey).GetValue('DiagnosticsEnabled', 0) -ne 1) { return }
        Assert-PocDirectory
        $log = Join-Path $script:RuntimeDir 'launcher.log'
        if (!(Test-Path -LiteralPath $script:RuntimeDir -PathType Container)) { return }
        if ((Test-Path -LiteralPath $log) -and ((Get-Item -LiteralPath $log).Attributes -band [IO.FileAttributes]::ReparsePoint)) { return }
        Add-Content -LiteralPath $log -Encoding UTF8 -Value ('{0} pid={1} event={2} action={3}' -f [DateTime]::UtcNow.ToString('o'), $PID, $Event, $Action)
    } catch { Write-Warning 'Local launch diagnostics could not be written.' }
}
function Test-PocDiagnostics {
    return (Test-OwnedKey $script:ConfigKey) -and (Get-Item -LiteralPath $script:ConfigKey).GetValue('DiagnosticsEnabled', 0) -eq 1
}
function Initialize-PocWindows {
    if ('AscendRiotWindow' -as [type]) { return }
    Add-Type @'
using System;
using System.Runtime.InteropServices;
public static class AscendRiotWindow {
 [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr h);
 [DllImport("user32.dll")] public static extern bool IsIconic(IntPtr h);
 [DllImport("user32.dll")] public static extern bool ShowWindowAsync(IntPtr h, int command);
 [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr h);
}
'@
}
function Find-PocRiotWindow([string]$Client, [string[]]$VerifiedPaths = @()) {
    Initialize-PocWindows
    $root = [IO.Path]::GetDirectoryName($Client) + '\'
    $session = (Get-Process -Id $PID).SessionId
    foreach ($p in @(Get-Process | Where-Object { $_.ProcessName -match '^Riot(Client| Client)' -and $_.SessionId -eq $session })) {
        try {
            if (!$p.Path -or !$p.Path.StartsWith($root, [StringComparison]::OrdinalIgnoreCase) -or $p.MainWindowHandle -eq 0) { continue }
            if ($VerifiedPaths -inotcontains $p.Path) { Assert-PocRiotPublisher $p.Path }
            if ([AscendRiotWindow]::IsWindowVisible($p.MainWindowHandle)) { return $p }
        } catch { continue }
    }
    return $null
}
function Test-PocRiotVisibleWindow($Window) {
    return $Window -and [AscendRiotWindow]::IsWindowVisible($Window.MainWindowHandle) -and
        ![AscendRiotWindow]::IsIconic($Window.MainWindowHandle)
}
function Wait-PocRiotVisible([string]$Client, [string]$Ui, [int]$TimeoutSeconds = 15) {
    $timer = [Diagnostics.Stopwatch]::StartNew()
    # These exact paths were signature-checked before launch. No repeated slow
    # Authenticode checks once the window appears; other Riot paths are verified.
    $verified = @($Client, $Ui | Where-Object { $_ })
    do {
        $window = Find-PocRiotWindow $Client $verified
        if (Test-PocRiotVisibleWindow $window) { return $window }
        if ($timer.Elapsed.TotalSeconds -ge $TimeoutSeconds) { break }
        Start-Sleep -Milliseconds 200
    } while ($true)
    return $null
}
function Restore-PocRiotWindow($Process) {
    Initialize-PocWindows
    [void][AscendRiotWindow]::ShowWindowAsync($Process.MainWindowHandle, 9)
    return [AscendRiotWindow]::SetForegroundWindow($Process.MainWindowHandle)
}
function Assert-PocRiotPublisher([string]$Path) {
    $signature = Get-AuthenticodeSignature -LiteralPath $Path
    if ($signature.Status -ne 'Valid' -or !$signature.SignerCertificate -or
        $signature.SignerCertificate.Subject -notmatch '(?:^|,\s*)O="?Riot Games(?:,? Inc\.?)?"?(?:,|$)') {
        throw 'Riot UI signature is not Valid or the publisher is not Riot Games. Launch refused.'
    }
}
function Find-PocRiotUi([string]$Client) {
    $ui = Join-Path ([IO.Path]::GetDirectoryName($Client)) 'RiotClientElectron\Riot Client.exe'
    if (!(Test-Path -LiteralPath $ui -PathType Leaf)) { return $null }
    Assert-PocRiotPublisher $ui
    return $ui
}
function Invoke-PocDetachedProcess([string]$Path, [string[]]$LaunchArguments) {
    if (!('AscendRiotProcess' -as [type])) {
        Add-Type @'
using System;
using System.Text;
using System.ComponentModel;
using System.Runtime.InteropServices;
public static class AscendRiotProcess {
 [StructLayout(LayoutKind.Sequential, CharSet=CharSet.Unicode)]
 struct StartupInfo {
  public int cb; public string reserved, desktop, title;
  public int x,y,xSize,ySize,xChars,yChars,fill,flags;
  public short showWindow,reservedSize; public IntPtr reservedData,input,output,error;
 }
 [StructLayout(LayoutKind.Sequential)]
 struct ProcessInfo { public IntPtr process,thread; public int pid,tid; }
 [DllImport("kernel32.dll", CharSet=CharSet.Unicode, SetLastError=true)]
 static extern bool CreateProcessW(string application, StringBuilder command, IntPtr pa, IntPtr ta,
  bool inheritHandles, uint flags, IntPtr environment, string directory, ref StartupInfo si, out ProcessInfo pi);
 [DllImport("kernel32.dll")] static extern bool CloseHandle(IntPtr handle);
 public static int Start(string path, string[] args) {
  if (path.IndexOf('"') >= 0) throw new ArgumentException("Invalid executable path.");
  var command = new StringBuilder("\"" + path + "\"");
  foreach (var arg in args) {
   if (arg != "--launch-product=league_of_legends" && arg != "--launch-patchline=live")
    throw new ArgumentException("Unexpected Riot argument.");
   command.Append(" ").Append(arg);
  }
  var si = new StartupInfo(); si.cb = Marshal.SizeOf(si);
  si.flags = 1; si.showWindow = 1; // STARTF_USESHOWWINDOW / SW_SHOWNORMAL: Riot UI stays visible.
  ProcessInfo pi;
  // DETACHED_PROCESS: no parent console; no inheritable handles, no wait for client lifetime.
  if (!CreateProcessW(path,command,IntPtr.Zero,IntPtr.Zero,false,0x8,IntPtr.Zero,
      System.IO.Path.GetDirectoryName(path),ref si,out pi)) throw new Win32Exception(Marshal.GetLastWin32Error());
  try { return pi.pid; } finally { CloseHandle(pi.thread); CloseHandle(pi.process); }
 }
}
'@
    }
    return [PSCustomObject]@{Id=[AscendRiotProcess]::Start($Path, [string[]]$LaunchArguments)}
}
function Start-PocRiotProcess([string]$Path, [string[]]$LaunchArguments = @()) {
    # Electron's Node mode is a developer-shell variable, never a client setting.
    # Change only the inherited child environment; restore the handler afterwards.
    $old = [Environment]::GetEnvironmentVariable('ELECTRON_RUN_AS_NODE', 'Process')
    try {
        Remove-Item Env:ELECTRON_RUN_AS_NODE -ErrorAction SilentlyContinue
        return Invoke-PocDetachedProcess $Path $LaunchArguments
    } finally { if ($null -ne $old) { $env:ELECTRON_RUN_AS_NODE = $old } }
}
function Write-PocWindowDiagnostic([string]$Stage, [string]$Action) {
    if (!(Test-PocDiagnostics)) { return }
    $currentSession = (Get-Process -Id $PID).SessionId
    $processes = @(Get-Process | Where-Object { $_.ProcessName -match '^Riot(Client| Client)' -and $_.SessionId -eq $currentSession })
    foreach ($process in $processes) {
        # Do not log native command lines: UI arguments can contain auth secrets.
        Write-PocDiagnostic ('{0} process={1} pid={2} session={3} handle={4} title={5}' -f $Stage, $process.ProcessName, $process.Id, $process.SessionId, $process.MainWindowHandle, ($process.MainWindowTitle -replace '[\r\n]', ' ')) $Action
    }
    Initialize-PocWindows
    $window = @($processes | Where-Object { $_.MainWindowHandle -ne 0 -and [AscendRiotWindow]::IsWindowVisible($_.MainWindowHandle) -and ![AscendRiotWindow]::IsIconic($_.MainWindowHandle) })
    $result = if ($window.Count) { 'VISIBLE_WINDOW_FOUND' } elseif ($processes.Count) { 'PROCESS_RUNNING_NO_VISIBLE_WINDOW' } else { 'NO_RIOT_PROCESS' }
    Write-PocDiagnostic ($Stage + '_' + $result) $Action
}
function Assert-RiotClient([string]$Path) {
    if ([string]::IsNullOrWhiteSpace($Path) -or ![IO.Path]::IsPathRooted($Path) -or !(Test-Path -LiteralPath $Path -PathType Leaf)) {
        throw 'The selected Riot Client file does not exist.'
    }
    $file = Get-Item -LiteralPath $Path
    if ($file.Name -ine 'RiotClientServices.exe') { throw 'Select RiotClientServices.exe.' }
    $signature = Get-AuthenticodeSignature -LiteralPath $file.FullName
    if ($signature.Status -ne 'Valid' -or !$signature.SignerCertificate -or
        $signature.SignerCertificate.Subject -notmatch '(?:^|,\s*)O="?Riot Games(?:,? Inc\.?)?"?(?:,|$)') {
        throw 'Riot Client signature is not Valid or the publisher is not Riot Games. Launch refused.'
    }
    return $file.FullName
}
function Select-RiotClient {
    Add-Type -AssemblyName System.Windows.Forms
    $picker = New-Object Windows.Forms.OpenFileDialog
    $picker.Title = 'Select RiotClientServices.exe (Riot Games signed)'
    $picker.Filter = 'Riot Client|RiotClientServices.exe'
    $picker.CheckFileExists = $true
    try {
        if ($picker.ShowDialog() -ne [Windows.Forms.DialogResult]::OK) { return $null }
        return Assert-RiotClient $picker.FileName
    } finally { $picker.Dispose() }
}
function Save-RiotClient([string]$Path) {
    if ((Test-Path -LiteralPath $script:ConfigKey) -and !(Test-OwnedKey $script:ConfigKey)) {
        throw 'Existing ClientPath configuration belongs to another handler.'
    }
    if (!(Test-Path -LiteralPath $script:ConfigKey)) { New-Item -Path $script:ConfigKey | Out-Null }
    New-ItemProperty -LiteralPath $script:ConfigKey -Name Owner -Value $script:Owner -PropertyType String -Force | Out-Null
    New-ItemProperty -LiteralPath $script:ConfigKey -Name ClientPath -Value $Path -PropertyType String -Force | Out-Null
}
function Find-RiotClient {
    if (Test-Path -LiteralPath $script:ConfigKey) {
        if (!(Test-OwnedKey $script:ConfigKey)) { throw 'ClientPath configuration is not owned by this PoC.' }
        $saved = (Get-Item -LiteralPath $script:ConfigKey).GetValue('ClientPath', $null)
        if ($saved -and (Test-Path -LiteralPath $saved -PathType Leaf)) { return Assert-RiotClient $saved }
    }
    $roots = @($env:SystemDrive + '\', $env:ProgramFiles, ${env:ProgramFiles(x86)}, 'C:\', 'D:\', 'E:\') | Where-Object { $_ } | Select-Object -Unique
    foreach ($root in $roots) {
        $candidate = Join-Path $root 'Riot Games\Riot Client\RiotClientServices.exe'
        if (Test-Path -LiteralPath $candidate -PathType Leaf) {
            $valid = Assert-RiotClient $candidate
            Save-RiotClient $valid
            return $valid
        }
    }
    Show-PocMessage 'Không tìm thấy Riot Client trên máy. Hãy chọn RiotClientServices.exe hoặc hủy để kết thúc.'
    $selected = Select-RiotClient
    if ($selected) { Save-RiotClient $selected }
    return $selected
}
