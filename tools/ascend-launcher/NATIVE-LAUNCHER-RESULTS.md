# Native launcher results — 2026-10-07

Worktree/branch: `D:\Code\Web-Booster\.worktrees\employee-riot-launch-poc`, `employee-riot-launch-poc`. This round creates `tools/ascend-launcher/`, updates the owned protocol installer/command/uninstaller and changes only Riot help wording in the frontend. Pre-existing Employee Portal changes remain unstaged; no backend changes, commit, merge or push.

| Requested check | Result / evidence |
|---|---|
| Technology | C# / Windows Forms, x64 Windows GUI executable. Rust/Cargo and .NET SDK unavailable; existing Framework compiler used. No Electron or web runtime. |
| Source files | `Program.cs` (UI), `RiotLauncher.cs` (state/flow), `Native.cs` (Win32/trust), `Tests.cs`, `build.ps1`. |
| Built executable | `D:\Code\Web-Booster\.worktrees\employee-riot-launch-poc\tools\ascend-launcher\dist\AscendLauncher.exe`, 168448 bytes. |
| Installed executable | `C:\Users\phamn\AppData\Local\ASCEND\RiotLauncherPoC\AscendLauncher.exe`; SHA256 matches build: `D6279FA92471AB1268DF9FE52E488C13E2A07E15EBF1E5D6DF0670E815FAEB26`. |
| Registry | HKCU `Software\Classes\ascendriot\shell\open\command` = `"C:\Users\phamn\AppData\Local\ASCEND\RiotLauncherPoC\AscendLauncher.exe" "%1"`. No PowerShell command. |
| Riot detection | Owned saved ClientPath; fixed OS/Program Files/C:/D:/E: installation candidates. Current `E:\Riot Games\Riot Client\RiotClientServices.exe`. |
| Signature protection | WinVerifyTrust + Riot Games signer organization. Service and exact UI sibling separately checked. Real unsigned and Microsoft-publisher fixtures refused. |
| Visible-window detection | EnumWindows, visible/non-minimized, owner exact verified UI executable, current session. Modern Electron UI is recognized; process-only Services is insufficient. |
| Timeout | 30 seconds for window wait, polling every 200 ms; timeout remains ERROR with Retry/Close. Tested with fake clock-shortened wait. |
| Retry | One active attempt, rechecks existing windows; eight-second spawn throttle and per-user/session singleton. Tests prove no rapid duplicate spawn. |
| Existing Riot | PASS: handler nativePid 15808, foreground=True, no spawn records; before/after UI PID set identical. SUCCESS at 19:00:36.523, closed 19:00:37.280 (Asia/Saigon). |
| PowerShell/CMD visible | NO: PE subsystem checked = Windows GUI; no runtime PowerShell/CMD launch. Native protocol inspection found zero old PowerShell handler processes. User confirms no console from Web. |
| Employee Web | PASS by user confirmation: launcher/loading shown, Riot usable, launcher auto-closed, no console. Native protocol traces independently verified; user confirmation is not a browser automation trace. |
| Riot visible | PASS: initial nativePid 42608 detected handle 7934032; later clean-start nativePid 44372 detected handle 1969094. |
| Auto-close | PASS: clean-start SUCCESS 19:01:26.185, LAUNCHER_CLOSED 19:01:26.945 (~760 ms). Initial run also closed ~775 ms after success. |
| Frontend build/lint | PASS: `npm run build` and `npm run lint`. Initial sandbox denied TypeScript worker spawn; rerun with allowed process permissions passed. |
| Launcher build/tests | PASS: Framework compiler, WinExe PE check, URI/launch/window/timeout/retry/signature tests; legacy PS handler contract tests also passed. |
| Git | Existing 7 tracked frontend modifications and untracked Employee UI/scripts/tools remain. This round only changes Riot help in `RiotClientCard.tsx` and launcher tooling/docs. No staging/commit/push. |
| Backend / auto-login | Backend untouched. No credentials, Riot API, account switching, login automation or Play click. |

## Visual review

Observed 460 × 260 borderless ASCEND window: transparent existing logo, centered ASCEND branding, dark background, gold animated ring, “Đang mở Riot Client...” and “Vui lòng chờ trong giây lát.” No percentage. Invalid URI review showed the same branded ERROR window and Close control; it did not spawn Riot. Missing-client and timeout/retry conditions are isolated core tests because Riot is installed on this machine, rather than live uninstall tests.

Controlled restart followed existing user permission: checked no active League/VALORANT, stopped only identified Riot Client user processes in the current session/path; no Vanguard, game or unrelated process touched. The loading UI was observed using Computer Use. The subsequent log proved actual window detection and auto-close. Background-service recovery was separately observed in the first native protocol run.

Common Riot UI success does not assert League navigation or game start. Windows can restrict foreground; this run returned true. Manual browser external-protocol prompt remains user-operated.
