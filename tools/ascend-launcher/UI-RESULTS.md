# Launcher UI review — 2026-10-07

UI-only update on `employee-riot-launch-poc`. Existing uncommitted portability/countdown work is preserved. No backend, frontend, launch engine or protocol registration logic changes in this task.

- Font: locally available Segoe UI, sizes in pixels. Title 28px bold; countdown 68px bold; unit/subtitle 16px; brand 13px; buttons 15–16px. Compiler source encoding is explicitly UTF-8 (`/codepage:65001`); Program.cs has a UTF-8 BOM.
- UI: `Program.cs`; shared colors, typography and rounded button drawing: `LauncherTheme.cs`.
- Window: 440×520 logical pixels (previously 460×440). Centered 64px logo with subtle gold glow, quiet border and inset 36px close target.
- Countdown: number block y=250..330; unit y=330..354. No overlap; the unit sits directly below the number.
- Progress: 384×8 rounded slate track, gold elapsed-time fill (0 at start, full at expiry).
- Countdown actions: 186×48 each, 12px column gap. Full-width 384×40 quiet remove action below. Hover, keyboard focus cues, disabled colors and native button keyboard behavior retained.
- Build: `build-setup.ps1 -Test` PASS. Icon, client detection, signature/URI checks, installation and all countdown flow checks PASS. No real Riot launch in these tests.
- Visual review: `review-ui.ps1` PASS; actual Vietnamese labels checked. DrawToBitmap captures of the real WinForms form: `dist/ui-home.png`, `dist/ui-countdown.png`, `dist/ui-missing.png`, `dist/ui-countdown-150.png`. The last is a simulated layout/font scaling review, not a physical 150%-DPI monitor test. Manifest remains DPI-unaware, so Windows applies display scaling to the native window.
- Distribution: `dist/AscendLauncher_0.1.0_x64-setup.exe` and refreshed `public/downloads/` copy. SHA256 `F1FEDD6D122510E74646D089FAB775CF70085F7E32702D0E4A5BB68295065712`.
- Installed launcher updated through the existing installation implementation; installed EXE hash matches this build. No need to reinstall the protocol for the UI update.
- Git: `git diff --check` PASS. New UI changes remain uncommitted; no push. Existing dirty changes from earlier tasks remain.

Reproduce after building: `powershell -File tools/ascend-launcher/review-ui.ps1`. Review uses fake Riot detection and a unique HKCU test subtree, removed on completion. No external fonts, network requests, or frontend lint needed for this native UI change.
