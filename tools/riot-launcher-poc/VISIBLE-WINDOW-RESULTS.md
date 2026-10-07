# Visible window verification — 2026-10-07

Worktree: `employee-riot-launch-poc`. Only launcher tools changed in this debugging round; no commit, merge or push.

## Evidence and cause

- Installed Riot shortcut targets `E:\Riot Games\Riot Client\RiotClientServices.exe`, no arguments, working directory `E:/Riot Games/Riot Client/`. League shortcut uses `--launch-product=league_of_legends --launch-patchline=live`.
- Initial PoC: Services PID 16184, session 3, window handle 0; no UX. Reopening the shortcut forwarded to that instance. Controlled restart and matching working directory alone did not produce UI. Service log contained `launch_ux: false`.
- Installed modern UI is Riot-signed `RiotClientElectron\Riot Client.exe`, not legacy RiotClientUx. Developer environment contained `ELECTRON_RUN_AS_NODE=1`; removing it for the child launch allowed the actual Electron UI to appear. Existing contaminated background instances were restarted only during authorized debugging, after checking no active Riot game.
- Native inventory later found Riot Client window 1444832. Accessibility exposed Riot Client document and window controls. User confirmed the window was visible and usable, and clarified an earlier disappearance was their own close action.
- Direct handler PID 45292 logged `AFTER_1S_VISIBLE_WINDOW_FOUND` and `AFTER_3S_VISIBLE_WINDOW_FOUND` at 10:29:39/41 UTC. Existing-window foreground attempt returned false; visibility nevertheless remained true. Windows foreground restrictions are preserved.
- Custom protocol League handler PID 42664 logged `AFTER_3S_VISIBLE_WINDOW_FOUND` at 10:30:41 UTC. This confirms common Riot UI visibility, not League navigation or game start.
- Employee button retests reached League handlers PID 42836 and 31304 (latest accepted at 10:32:13 UTC). User confirmed the window appeared, then explicitly confirmed closing it again. Their close preceded the diagnostic snapshots, which correctly recorded no visible window. Button visibility is user-confirmed, with handler invocation correlated; do not interpret those later snapshots as a crash or as visibility proof.

## Results

| Check | Result |
|---|---|
| Direct PowerShell handler | PASS: visible-window diagnostic |
| Custom protocol | PASS: League handler and visible-window diagnostic |
| RiotClientServices running | YES |
| RiotClientUx running | NO: modern `Riot Client.exe` UI is running |
| Visible window handle | YES: 1444832 observed |
| Manual Riot launch visible | PASS: user confirmed |
| ASCEND launch visible | PASS: native inventory and diagnostic |
| Employee button visible launch | PASS: fresh League handler invocations and user-confirmed visible UI; user closed afterwards |
| Cold start through Employee button | Not independently correlated yet |
| Minimized-window restore through Employee button | Not independently verified yet |

Tests: five PowerShell 5.1 syntax files, 17 exact URI/mapping cases, unsigned/non-Riot publisher rejection and child environment cleanup/restoration passed. No frontend changes in this round; no fresh frontend build required. Installed current-user runtime updated. Normal launcher never terminates processes, enters credentials or reads auth tokens.

## Follow-up: console lifetime

Before the fix, a reproduced protocol call left zero live handler processes after 10 seconds. Thus the reported persistent console was not a PowerShell script waiting for Riot lifetime; the old protocol exposed a console and did not explicitly detach launched Riot processes from it. Console inheritance is addressed without terminating any process.

Protocol now hides only PowerShell. A compiled `CreateProcessW` wrapper starts Riot with `DETACHED_PROCESS`, handle inheritance false, correct working directory and `SW_SHOWNORMAL`. Only the two fixed League arguments are accepted by the wrapper. Native process/thread handles are closed immediately; no waiting for child exit. Successful handler completion logs `HANDLER_EXIT_OK` and exits 0.

First corrected protocol launch: handler PID 41684 logged `VISIBLE_WINDOW_FOUND` and `HANDLER_EXIT_OK` at 11:37:20 UTC; handler absent after 12 seconds while Riot UI PID 38224 / handle 1117020 remained responsive.

Second corrected protocol launch: handler PID 39552 logged `VISIBLE_WINDOW_FOUND` and `HANDLER_EXIT_OK` at 11:37:48 UTC; handler absent after 12 seconds, same responsive Riot UI PID 38224 / handle 1117020. Tests passed including native wrapper compilation, rejection of unexpected arguments, hidden protocol console/no NoExit, and cleaned/restored child environment. User confirmation of console behavior from two fresh Employee Web clicks is pending; the two protocol checks are independently verified.

## Follow-up: exit immediately on visible client

Replaced fixed post-launch diagnostic sleeps with visibility polling (200 ms, bounded to 15 seconds). A visible, non-minimized verified Riot window immediately completes the handler. Timeout is logged separately and does not claim visible launch success. Already verified service/UI paths avoid repeated Authenticode verification in the polling loop; other executable paths still require signature validation.

Native protocol test: handler PID 45740 detected Riot UI PID 39740 at 11:42:44.5173761 UTC and recorded `HANDLER_EXIT_OK` at 11:42:44.5432001 UTC, about 26 ms later. Process inspection confirmed no remaining protocol handler, while Riot UI remained responsive. Contract tests include immediate visibility (zero sleeps), delayed visibility (no sleep after detection), and bounded timeout; all passed.
