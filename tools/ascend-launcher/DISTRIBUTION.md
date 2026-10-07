# ASCEND Launcher 0.1.0 — Windows x64

## File to send to another Employee PC

**`AscendLauncher_0.1.0_x64-setup.exe`** from `tools/ascend-launcher/dist/`.

This one file embeds the optimized release launcher and ASCEND icon. No repo, Node, Rust, VS Code, PowerShell script or WebView2 is needed on the Employee PC. Requires Windows 10/11 x64 with .NET Framework 4.5+; current Windows installations include a compatible Framework. Windows ARM/32-bit are not release targets. Launcher/setup are currently **unsigned development builds**; signing is a separate distribution requirement. Do not bypass security warnings or disable protection.

## Employee instructions

1. Download the setup and open it as the Windows account that will use Employee Web.
2. Click **Cài đặt / Cập nhật**. It installs per-user without Administrator privileges.
3. Click **Mở launcher**, then **CÀI GIAO THỨC** in Launcher Home. Fresh setup copies the files but does not silently register the protocol. Manual launcher startup never starts a Riot countdown.
4. Open Employee Web, accept/claim the order as usual, then click **MỞ RIOT CLIENT**. Accept the browser's Open confirmation yourself if requested. Launcher verifies registration and Riot installation, then counts down 60 real seconds. **MỞ NGAY** skips the delay; **HỦY** returns Home without launching. If Riot is already visible or appears during the countdown, launcher focuses it and closes promptly.
5. If Riot is not found, use the launcher's native picker to select the signed `RiotClientServices.exe`.

For repair, open launcher manually and select **SỬA GIAO THỨC** (or the setup's explicit Repair action). **GỠ TOÀN BỘ GIAO THỨC** removes only ASCEND-owned handlers after confirmation and leaves the launcher/config/Riot intact. The website cannot invoke it after removal: open launcher manually and click **CÀI GIAO THỨC** to re-enable. This registers the runtime current EXE path; moving that file afterwards requires repair from its new location.

Windows Settings → Apps → ASCEND Launcher separately offers full application uninstall; it removes the active owned handler only if ownership and installed command match. Existing Riot configuration and unrelated files are retained. Uninstall launched from the installed setup runs a temporary maintenance copy so loaded files can be removed; that temporary EXE is left for normal Windows temp cleanup.

Each Windows account needs its own installation. Copying `AscendLauncher.exe` alone does **not** register the custom protocol. The website cannot install/register it or read Registry status.

## Installed structure

```text
%LOCALAPPDATA%\ASCEND\Launcher\
  AscendLauncher.exe
  AscendLauncherSetup.exe
  .owner
%LOCALAPPDATA%\ASCEND\launcher-config.json  # retained Riot path
```

Icons and assets are embedded. HKCU registration:

```text
Software\Classes\ascendriot
  (Default) = URL:ASCEND Riot Launcher
  URL Protocol = ""
  Owner = ASCEND.Launcher.v1
  DefaultIcon = "<installed AscendLauncher.exe>",0
  shell\open\command = "<absolute installed AscendLauncher.exe>" "%1"
```

The launcher accepts explicit migration/repair from the owned old PoC handler and refuses unrelated handlers, including an existing machine-wide handler when no per-user handler exists. Setup refuses unowned installation directories. Existing registration survives an update; fresh setup does not register it until a user install/repair action. No developer username/path is embedded in the artifact. `asInvoker` manifests prevent setup-name elevation heuristics from selecting a different account's HKCU.

Allowed protocol actions: `ascendriot://test`, `ascendriot://open/riot`, `ascendriot://open/league`. Windows normalizes the authority-only test URI to `ascendriot://test/`; this exact spelling is also allowed. Queries, fragments, extra segments/arguments and arbitrary launch commands remain rejected.

## Publish the download

Build on Windows:

```powershell
tools/ascend-launcher/build-setup.ps1 -Test
```

This writes the setup to `dist/` and `public/downloads/`. Build/deploy the website **with that generated public file included**, or host the setup as a release asset and set `NEXT_PUBLIC_ASCEND_LAUNCHER_DOWNLOAD_URL` before `npm run build`. The current release setup and SHA256 sidecar are committed in public/downloads so deployment from main includes the default download. Commit rebuilt release assets with launcher updates; other generated EXEs remain ignored. No automatic download or installation occurs.

## Debug order

The setup's diagnostic text shows the installed path, file existence, Registry command, ownership-related installation information, URL Protocol presence, architecture and version. Copy that text when requesting help; it does not claim browser or Riot status.

For a developer investigating a PC, check HKCU registration first, then native Windows resolution, browser confirmation and finally the website. Optional commands below are diagnostic tools, **not Employee installation steps**:

```powershell
reg query HKCU\Software\Classes\ascendriot /s
Start-Process 'ascendriot://test'
Start-Process 'ascendriot://open/league'
```

The user can also enter the URI manually in Windows Run or the browser address bar. Do not automate security prompts. Absence of a browser popup alone does not distinguish a remembered choice, missing/broken handler, browser policy or Windows security block. Local protocol startup does not justify changing firewall settings.

Framework guidance: [Microsoft .NET Framework installation guide](https://learn.microsoft.com/en-us/dotnet/framework/install/). Association-change notification: [Microsoft Default Programs documentation](https://learn.microsoft.com/en-us/windows/win32/shell/default-programs).
