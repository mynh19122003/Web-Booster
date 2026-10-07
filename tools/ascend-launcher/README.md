# ASCEND Launcher — native Windows PoC

Small C# / Windows Forms application, compiled as x64 `WinExe` using the Windows .NET Framework compiler already installed on the test machine. Rust/Cargo and .NET SDK were absent. No Electron, WebView, downloaded packages, PowerShell/CMD child, localhost service or Riot API in the runtime.

## Build and install

For another PC, use the standalone `AscendLauncher_0.1.0_x64-setup.exe` built by `build-setup.ps1 -Test`. It installs into `%LOCALAPPDATA%\ASCEND\Launcher`, registers/repairs `ascendriot`, and supplies an uninstall entry without requiring repo scripts. See [distribution instructions](DISTRIBUTION.md) and [multi-PC validation matrix](MULTI-PC-RESULTS.md). The commands below are the legacy developer PoC setup, not the Employee distribution flow.

From the `employee-riot-launch-poc` worktree:

```powershell
powershell.exe -NoProfile -File tools/ascend-launcher/build.ps1 -Test
powershell.exe -NoProfile -File tools/riot-launcher-poc/install-protocol.ps1 -ClientPath 'E:\Riot Games\Riot Client\RiotClientServices.exe' -EnableDiagnostics -NoSuccessDialog
Start-Process 'ascendriot://open/league'
```

Output: `tools/ascend-launcher/dist/AscendLauncher.exe`. Build output is ignored by Git. Requires Windows x64 and .NET Framework 4.5+; build uses `Framework64/v4.0.30319/csc.exe`. PowerShell is used only for manual build/install/debug.

### One brand source for body, window and EXE

Website metadata uses `public/brand/app-icon.png` (64 × 64). The website icon component uses the higher-resolution source `public/brand/logo-icon.png` (395 × 390); `public/brand/README.md` confirms the app icon derives from it. This same transparent master is embedded unchanged as `ascend-logo.png` for the body, drawn with preserved aspect ratio inside a centered 72 px box.

`build-icon.ps1` converts only size/format from that master into `dist/ascend.ico`: 16/32/48/64/128 px 32-bit DIB frames plus a 256 px PNG frame, all transparent. No new artwork, recoloring or copied PNG. Every build regenerates the ICO. Compiler `/win32icon` embeds it as the Windows EXE resource for Explorer/Task Manager; embedded `ascend-window.ico` is explicitly assigned to `Form.Icon` for window/taskbar/Alt+Tab. No separate ICO is needed by the installed runtime. `test-icon.ps1` checks all six dimensions/transparency and compares the EXE-extracted icon with the generated ICO.

Installer copies the single resource-embedded executable into `%LOCALAPPDATA%\ASCEND\RiotLauncherPoC\AscendLauncher.exe`. The HKCU protocol command is exactly `"<installed executable>" "%1"`. Existing owner checks, saved ClientPath, diagnostics preference and uninstall protections remain. No admin or global execution-policy changes. Read/build the source before installing this unsigned local PoC executable.

## Behavior

Current Home/protocol/countdown behavior is documented in [COUNTDOWN-RESULTS.md](COUNTDOWN-RESULTS.md). Manual startup opens Home; protocol opening prepares Riot then counts down 60 seconds unless Riot is already running. Explicit install/repair/remove actions live in Home. Setup no longer silently registers on a fresh install. The launch-engine details below still apply after Open Now/countdown.

- Borderless 460 × 440 centered window, dark background, gold accent, existing transparent `public/brand/logo-icon.png` embedded unchanged. Real monotonic countdown and gold progress bar; no fake loading percentage.
- States: STARTING, FINDING_RIOT, LAUNCHING, WAITING_FOR_WINDOW, SUCCESS, ERROR. UI remains responsive while the worker verifies and opens Riot.
- Only one allowlisted URI argument: `ascendriot://open/league`, `ascendriot://open/riot`, or `ascendriot://test` (also its Windows-normalized `ascendriot://test/`). Self-test displays success for two seconds without looking for or opening Riot. No decoding, query, fragment, extra argument or arbitrary executable/flags; Riot actions retain exact matching.
- Discovery validates `%LOCALAPPDATA%\ASCEND\launcher-config.json` (`riotClientPath`) first, then fixed installation candidates on OS drive, Program Files, C:, D:, E:, then the existing owned HKCU ClientPath. Invalid saved paths fall through. No recursive disk scan.
- Missing installation expands the branded window to 460 × 330 and offers a native Windows file picker. Only a readable absolute regular `RiotClientServices.exe` with trusted Riot Games signature can be saved. Selection persists locally and automatically resumes opening; cancellation leaves the fallback screen. Error screens offer Retry, change path and Close. See [path-picker validation report](PATH-PICKER-RESULTS.md) for test results and remaining manual review.
- WinVerifyTrust validates embedded Authenticode trust; the signer organization must be Riot Games. UI sibling is verified independently. No launching unsigned or another publisher's same-name file.
- League uses the installed shortcut's two fixed flags. The modern `RiotClientElectron\Riot Client.exe` UI is launched with its own working directory; the older UX sibling is also recognized. The known service-only `launch_ux: false` path is not treated as successful UI launch.
- Native `CreateProcessW` uses DETACHED_PROCESS, non-inherited handles and SW_SHOWNORMAL. `ELECTRON_RUN_AS_NODE` is removed only around child creation and restored in the launcher process. No system/user environment change; no console attachment.
- EnumWindows checks a visible, non-minimized window owned by an exact verified UI executable in the current session. No process-exists shortcut. Modern installations do not count a Services-only window as UI success.
- Existing verified window: restore/attempt foreground, do not spawn another client. Windows may deny foreground; actual window visibility is still checked.
- On real visibility, show SUCCESS for 750 ms, then close. Wait for a window at most 30 seconds, polling every 200 ms. Timeout shows Retry/Close. No success claim on timeout.
- Retry checks windows again, runs at most one attempt at a time and limits repeated spawn attempts to one per eight seconds. Per-user/session named mutex prevents overlapping launcher windows and brings the existing launcher forward. Never kills Riot, games or Vanguard.
- Opt-in local diagnostics reuse the owned `launcher.log`: timestamps, state, fixed action, verified path, PID, window handle, duration, result. Never read/log native command lines, account data, passwords or tokens.
- Closing the launcher cancels its wait; Riot is left running. No auto-login, input injection, account switching or automatic Play click.

## Verification

`build.ps1 -Test` compiles the production WinExe, checks PE subsystem = Windows GUI, then runs isolated core tests with fake process/window operations. Cases cover strict URI rejection, existing-window focus/no spawn, fixed League/Riot mappings, missing client, signature refusal, timeout and retry throttling. Real unsigned and Microsoft-signed fixtures are refused. Tests never launch real Riot or edit registry.

Manual acceptance: closed/background Riot → protocol → loading → visible Riot → launcher closes; already visible/minimized Riot → restore → close; missing client → Retry/Close; web click → browser's Open prompt (user accepts) → same native behavior. A common Riot UI does not prove League navigation or game start.
