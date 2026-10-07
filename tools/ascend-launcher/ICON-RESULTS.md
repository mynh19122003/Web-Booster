# ASCEND launcher brand icon — 2026-10-07

| Requested result | Evidence |
|---|---|
| Website icon | `app/layout.tsx` metadata uses `public/brand/app-icon.png`; `components/ui/AscendLogo.tsx` uses `public/brand/logo-icon.png` for icon-only branding. |
| Brand source | `public/brand/logo-icon.png`, 395 × 390. `public/brand/README.md` documents that the 64 px app-icon is resized from this source. No asset guessing or horizontal wordmark. |
| Transparent background | YES. Source corner alpha = 0; every generated frame has transparent corners. Existing metallic gold/orange artwork and physical dark metal remain unchanged. |
| Launcher body | Original PNG embedded as `ascend-logo.png`; SHA256 equals the website source. Centered inside a 72 px box with aspect ratio preserved. No crop/stretch/new artwork. |
| Window icon | Generated ICO embedded as `ascend-window.ico`, explicitly assigned to `Form.Icon`. Embedded bytes match generated file. |
| Taskbar / Alt+Tab | ASCEND window icon; user verified it after an Employee Web launch. |
| Executable / Explorer icon | Compiler `/win32icon` resource. Icon extracted using Windows associated-icon API matches ASCEND ICO pixel-for-pixel at 32 px. |
| Generated ICO | `tools/ascend-launcher/dist/ascend.ico`: 16, 32, 48, 64, 128, 256 px. Small frames use 32-bit DIB/alpha/AND masks; 256 px uses transparent PNG for Windows compatibility. |
| Launcher source paths | Body consumes `public/brand/logo-icon.png` directly; icon conversion consumes the same file. No separate copied PNG. `build-icon.ps1` regenerates formats on each build. |
| Build | PASS: WinExe / GUI subsystem, icon tests and all existing URI/signature/window/retry tests. EXE `tools/ascend-launcher/dist/AscendLauncher.exe` = 496640 bytes. |
| Installed build | `%LOCALAPPDATA%\ASCEND\RiotLauncherPoC\AscendLauncher.exe`, SHA256 matches build: `5FE5282A8AC50E2564463982FDCC5DE1D473E5289E600D8EC09912BAF57A6840`. |
| Employee Web | PASS by user confirmation: icon correct in body/taskbar/Alt+Tab, Riot opens, launcher closes, no console. |
| PowerShell visible | NO. Native protocol continues pointing directly to WinExe. |
| Riot visible / self-close | PASS. Protocol test nativePid 45568 found real window at 20:13:21.337 (Asia/Saigon), SUCCESS at 20:13:21.340, closed at 20:13:22.286 (~946 ms). User independently confirmed the Web flow. |

## Changed files this round

`Program.cs`, `build.ps1`, `README.md`; added `build-icon.ps1`, `test-icon.ps1`, this report. ICO and EXE are generated under ignored `dist/`. No website/product UI assets or frontend/backend code changed in this round. Success text now includes a checkmark; error state retains the same icon; border uses the requested subtle slate color. Existing native launch/window detection behavior remains.

`test-icon.ps1` verifies ICO directory dimensions, transparent corners in DIB/PNG frames, Windows-extracted EXE icon, and exact embedded PNG/ICO hashes. No external image service or recoloring is used: only transparent contain resize and file-format conversion.

Earlier `NATIVE-LAUNCHER-RESULTS.md` size/hash records refer to the pre-icon build; the values here describe the currently installed build. No commit/push. No frontend build needed because no frontend file changed.
