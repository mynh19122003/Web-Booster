# ASCEND Riot Launcher PoC

Runtime hiện tại là native `AscendLauncher.exe`, không chạy PowerShell/CMD. Xem [hướng dẫn launcher](../ascend-launcher/README.md) để biết UI, timeout, retry, chữ ký và điều kiện kiểm thử. Các script `launch-riot.ps1`/`launcher-functions.ps1` giữ lại để debug và cài/gỡ protocol; chúng không phải protocol runtime nữa.

## Build và cài

Tại worktree của dự án:

```powershell
powershell.exe -NoProfile -File tools/ascend-launcher/build.ps1 -Test
powershell.exe -NoProfile -File tools/riot-launcher-poc/install-protocol.ps1 -ClientPath 'E:\Riot Games\Riot Client\RiotClientServices.exe' -EnableDiagnostics -NoSuccessDialog
Start-Process 'ascendriot://open/league'
```

Đường dẫn E: là vị trí đã xác minh trên máy test; thay bằng vị trí RiotClientServices.exe thực tế của máy khác. File phải tồn tại và có chữ ký Valid của Riot Games. Không bỏ qua chữ ký khi test. Nếu không truyền ClientPath, launcher dùng config đã lưu hoặc các vị trí cố định; thiếu client hiện lỗi và Retry/Close trong ASCEND Launcher.

EXE build: `tools/ascend-launcher/dist/AscendLauncher.exe`.

EXE được cài: `%LOCALAPPDATA%\ASCEND\RiotLauncherPoC\AscendLauncher.exe`.

HKCU `Software\Classes\ascendriot\shell\open\command`:

```text
"<LOCALAPPDATA>\ASCEND\RiotLauncherPoC\AscendLauncher.exe" "%1"
```

Installer chỉ cập nhật handler có Owner `ASCEND.RiotLauncherPoC.v1`, không ghi HKLM, không cần admin. Giữ ClientPath đã lưu; từ chối runtime/junction không thuộc PoC. Script build/install là thao tác thủ công dành cho developer. Website không tải hoặc thực thi script.

## URL và Web

Chỉ accept chính xác một trong hai URL:

- `ascendriot://open/league`
- `ascendriot://open/riot`

Không query/fragment, trailing slash, normalization, exe path hay arbitrary args. Caller nào trên máy cũng có thể gọi protocol; frontend mock Ready không phải authentication ở Windows. Web chỉ ghi “Đã gửi yêu cầu mở Riot Client.”, không biết tiến độ native hay fake success. User tự chọn Open trong prompt của browser; hủy prompt không mở client.

## Debug và logs

Diagnostics opt-in dùng owned `%LOCALAPPDATA%\ASCEND\RiotLauncherPoC\launcher.log`. Native records có `nativePid`, state, fixed action, verified Riot path, window handle, duration, result. Không credential/token/account data/command lines.

Debug script vẫn chấp nhận cùng allowlist và có thể gọi trực tiếp:

```powershell
powershell.exe -NoProfile -File tools/riot-launcher-poc/launch-riot.ps1 'ascendriot://open/riot'
powershell.exe -NoProfile -File tools/riot-launcher-poc/test-handler.ps1
```

Debug script có thể hiện console vì được developer chạy thủ công; Employee protocol không trỏ tới script này. Native launcher và script đều không kill Riot trong flow bình thường, không auto-login, đọc lockfile auth, bấm Play hay đổi tài khoản.

## Gỡ

```powershell
powershell.exe -NoProfile -File tools/riot-launcher-poc/uninstall-protocol.ps1
```

Gỡ chỉ owned HKCU protocol/config và các file PoC đã biết, gồm native EXE. Không gỡ Riot, không dừng game/Vanguard, không xóa đệ quy file lạ. Từ chối nếu Owner/command đã bị thay bởi handler khác.

Các báo cáo [PowerShell visibility trước migration](VISIBLE-WINDOW-RESULTS.md) và `TEST-RESULTS.md` là lịch sử debug. Báo cáo native mới ở [NATIVE-LAUNCHER-RESULTS.md](../ascend-launcher/NATIVE-LAUNCHER-RESULTS.md).