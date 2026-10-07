# Portable launcher / custom protocol results

Historical portability round: the current Home/explicit-install/countdown flow and regenerated release are described in [COUNTDOWN-RESULTS.md](COUNTDOWN-RESULTS.md). Hashes/instant-open timing below belong to the prior artifact, not the current build.

## Root cause assessment

Confirmed implementation gap: the previous distribution was a repo-dependent PowerShell installer, not a standalone setup for a fresh PC. Copying the launcher alone did not register HKCU. The developer PC had a working owned handler in `ASCEND\RiotLauncherPoC`; this does not establish any installation on another account/PC.

Also reproduced and fixed during native self-test: Windows passes `ascendriot://test/` after `Start-Process 'ascendriot://test'`. Exact validation previously rejected it. Only that canonical self-test variant is added; Riot action parsing is unchanged.

The user confirmed no second PC is currently available and will test later. Therefore the specific cause of its missing popup (missing install, broken command, dependency, architecture, browser or security block) is **not confirmed**. No second-PC results are fabricated.

## Evidence on development PC

- Release launcher/setup: x64, optimized GUI executables, embedded icon/version 0.1.0.0, `asInvoker` manifest.
- Standalone installation from embedded payload outside the repo, including a path with spaces: PASS. Native self-test visible and auto-close: PASS. This is not a physical clean-machine test.
- Isolated temporary HKCU tests: install, URL Protocol, exact quoted command, repair after deleting registration, stable-path update, owned uninstall and foreign-owner/directory protection: PASS. Tests never modify the live scheme.
- Live setup installation engine then Windows `Start-Process ascendriot://test`: PASS. Installed path is `%LOCALAPPDATA%\ASCEND\Launcher\AscendLauncher.exe`. Native process 41480 logged SUCCESS at `2026-10-07T14:18:58.698Z` and closed at `14:19:00.710Z`; visible window title was `ASCEND Launcher`. No Riot launch for self-test.
- Native core/signature/config/icon tests: PASS.
- Final installed Windows `ascendriot://open/league`: PASS on developer PC. Process 45364 logged `VISIBLE_WINDOW_FOUND` at `2026-10-07T14:28:54.777Z`, SUCCESS and auto-close at `14:28:55.552Z` (approximately 0.8 seconds). No Riot/game process was killed.
- Frontend production build and ESLint: PASS.
- Headless Edge: plain anchor request to League, helper text, native retry href, test URI request in an independent browser, and downloaded setup SHA256 matching the built artifact: PASS. No page errors. External-app confirmations can block further DOM clicks; review does not accept/bypass those prompts or claim an actual browser-to-native opening.
- Sofia claim/chat/limit/persistence review: PASS, zero API requests/page errors. The external protocol click is last so the browser confirmation cannot block unrelated checks.

Final setup: 866,816 bytes; SHA256 `405AD27CFF64679BFD7E3B6E36859F197CDEBFC1F8D15C69FB7758A717180241`. Binary UTF-8/UTF-16 scans found no `D:\Code\Web-Booster` or developer-profile path in launcher/setup. The public download matched this artifact. Header/resource checks are independent of this path scan.

## Machine 2 matrix (pending user's later test)

| Machine 2 check | Result |
|---|---|
| Launcher installed | NOT TESTED |
| Launcher EXE path | Expected `%LOCALAPPDATA%\ASCEND\Launcher\AscendLauncher.exe`; actual not available |
| Protocol Registry exists | NOT TESTED |
| Registry command correct | NOT TESTED |
| `ascendriot://test` via Start-Process | NOT TESTED |
| `ascendriot://test` via browser | NOT TESTED |
| Employee Web button | NOT TESTED |
| ASCEND Launcher visible | NOT TESTED |
| Riot launch | NOT TESTED |

Transfer only `AscendLauncher_0.1.0_x64-setup.exe`. Employee steps and deployment asset requirements are in [DISTRIBUTION.md](DISTRIBUTION.md). No backend/Laravel/API/database changes. Source remains uncommitted/unpushed for this task.
