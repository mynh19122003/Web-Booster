# Kết quả kiểm thử — 07/10/2026

**A: PASS — Frontend và scripts sẵn sàng kiểm thử.**

**B: WAITING_FOR_WINDOWS_TEST — Chưa xác nhận Windows end-to-end.** Máy có Riot Client nhưng chưa cài handler hoặc gọi client thật. Cài/gọi/quan sát cửa sổ là bước người dùng thực hiện theo README.

## Worktree và phạm vi

- Branch `employee-riot-launch-poc`, tạo từ `main` tại `e6dc5d0`.
- Worktree `D:\Code\Web-Booster\.worktrees\employee-riot-launch-poc`, baseline sạch.
- Chưa stage, commit, push hoặc merge trong task này; `main` không đổi.
- Workspace gốc nhánh `backend` đã có các thay đổi tracked/untracked từ trước, được giữ nguyên. Task không sửa/kiểm thử Laravel, backend API, database, migration, auth production hoặc `.env`.
- Mock Orders/Admin/Chat/Dashboard/Complaints/Security được giữ; không thêm nguồn state order mới hay endpoint. Store hiện tại dùng `ascend-order-flow-v1`; session mock dùng cơ chế hiện có. Không lưu credential/token, không auto-login Riot.

## Frontend — PASS

Kiểm tra bằng Edge headless/Playwright trên Windows, cả development và production. Script: `scripts/review-riot-poc.mjs`.

| Kiểm tra | Bằng chứng |
| --- | --- |
| Available Orders | `/employee/orders/available`, card giữ fixtures có sẵn, confirm gồm region; nhận đơn redirect `/employee/orders/ASC-1047` với toast |
| State thống nhất | OPEN → IN_PROGRESS, employeeId đúng; chỉ một assignment sau double-click; assignment.claimedAt = order.startedAt, timeline có nhận/bắt đầu; order biến mất khỏi Available, count 1/1 |
| Refresh | startedAt và assignment giữ nguyên; chat composer và Riot gate vẫn mở |
| Giới hạn | Count lấy từ các IN_PROGRESS của employee hiện tại; limit 1 chặn đơn thứ hai, không hardcode count |
| Access | OPEN locked; pending review/completed/cancelled/paused không bật launch/composer; detail của employee khác bị projection hiện tại từ chối hoàn toàn |
| Chat | Gửi mock message sau claim; service recheck IN_PROGRESS và employeeId |
| Launch | CDP quan sát đúng một navigation `ascendriot://open/league` từ click; không tự gọi khi claim/mount; zero API/localhost requests |
| Trạng thái | Card luôn Chưa xác minh; các flags mock clientOpen/verified cũ không tạo báo thành công; browser request không có acknowledgement native |
| Responsive | 1920, 1440, 1366, 1024, 768, 390: không page overflow, help modal nằm trong viewport; Escape đóng modal và trả focus |
| Platform | macOS/iPhone user-agent: button disabled và hướng dẫn chỉ hỗ trợ Windows; đây là UX hint |
| Development | Nút tạo thêm nhân viên Riot PoC có 0 active và limit 1, giữ nguyên tất cả orders; không reset mock khác. Help development hiện đúng môi trường |
| Production | Không có nút chuẩn bị fixture hoặc phần hướng dẫn development/command/path máy |
| Storage lỗi | JSON hỏng và snapshot thiếu cấu trúc được phục hồi về fixture; zero page errors/hydration errors |
| Build/lint | `npm run build` exit 0, 59 pages; `npm run lint` exit 0. `npm run typecheck` sau generated types exit 0 |

Standalone typecheck lần đầu trước build thiếu `PageProps` do worktree chưa có generated Next types; production build tạo types và kiểm tra TypeScript thành công. Không sửa các routes không liên quan để xử lý chuyện này.

Layout: desktop thông tin/progress/timeline/chat ở main; Riot/customer/status/reward/báo vấn đề ở sidebar. ≤1024px về một cột. Card dùng game/region thực tế của mock order, giữ nguyên fixtures; Riot display ID là `MockPlayer#VN2`.

## PowerShell — PASS trong phạm vi contract/read-only

`test-handler.ps1` chạy trên Windows PowerShell **5.1.26100.9444**, exit 0:

- Parse 5 script files bằng parser PS5.1.
- 17 raw URI/mapping cases: hai URL hợp lệ, empty/missing input, sai scheme/host, traversal, query/fragment, encoded variant, uppercase/trailing slash, argument thừa, quote/control character.
- Với helper mock, invalid input exit 2 và không gọi launch; valid actions giữ executable có dấu cách và fixed arguments.
- Hàm Authenticode thật từ chối fixture unsigned cùng tên và executable Microsoft có chữ ký Valid được copy thành RiotClientServices.exe. Không chạy các fixtures.
- Không cài registry, mở picker hoặc launch ứng dụng thật trong contract tests.

Read-only quan sát máy:

- **PASS:** `E:\Riot Games\Riot Client\RiotClientServices.exe` tồn tại; Authenticode **Valid**, subject `CN="Riot Games, Inc.", O="Riot Games, Inc.", …`; `Assert-RiotClient` chấp nhận.
- Scheme `ascendriot` không có ở HKCU/HKLM khi kiểm tra. Chưa ghi `ClientPath`.

Runtime dự kiến sau cài, **chưa được cài bởi task**:

```text
%LOCALAPPDATA%\ASCEND\RiotLauncherPoC\launch-riot.ps1
HKCU\Software\Classes\ascendriot
HKCU\Software\ASCEND\RiotLauncherPoC\ClientPath
```

Command quote PowerShell hệ thống/handler/`"%1"`, dùng `-NoProfile -ExecutionPolicy Bypass -File`; không dùng `-Command`. `open/riot` không có arguments; `open/league` chỉ có `--launch-product=league_of_legends` và `--launch-patchline=live`.

## Windows native — NOT_RUN / WAITING_FOR_WINDOWS_TEST

| Kiểm tra native | Trạng thái |
| --- | --- |
| Installed handler direct `open/riot` | NOT_RUN — chưa cài handler; chưa quan sát client xuất hiện |
| Installed handler direct `open/league` | NOT_RUN — chưa xác nhận client chung/trang League hoặc flags |
| Registry protocol và browser Chrome/Edge tương tác | NOT_RUN — headless URI observation không thay thế bước này |
| Chấp nhận/hủy prompt browser thật | NOT_RUN — không suy ra kết quả từ focus/visibility/timeout |
| Chọn/hủy picker, client thiếu/đang chạy | NOT_RUN |
| Native path có dấu cách/vị trí khác | NOT_RUN cho launch; path Riot có dấu cách đã kiểm tra chữ ký read-only |
| Cài lại/gỡ/cài lại, collision handler khác | NOT_RUN — scripts đã chuẩn bị ownership checks, chưa thực hiện lifecycle |
| Policy block | NOT_RUN — không thay policy CurrentUser/LocalMachine hoặc vượt bảo vệ |

Để hoàn tất B: làm theo [README](README.md), cài thủ công, chạy direct hai action, protocol hai action, rồi claim/click trong Chrome/Edge và ghi quan sát từng action. Nếu chỉ mở client chung, ghi đúng kết quả đó, không coi là đã vào League/game.

## Các file task

Sửa: `app/employee/layout.tsx`, `components/workflow/EmployeePages.tsx`, `EmployeeShell.tsx`, `WorkflowChat.tsx`, `lib/workflow/store.ts`, `services/workflow.ts`, `services/workflow-adapter.ts`.

Thêm: `app/employee/riot.css`, `components/workflow/RiotClientCard.tsx`, `scripts/review-riot-poc.mjs`; trong `tools/riot-launcher-poc/`: installer, uninstaller, launcher, shared functions, contract test, README và báo cáo này.

Git status giữ thay đổi chưa commit thuộc frontend/tools; không stage backend/secrets/log/file cài đặt trên máy. Screenshots kiểm tra nằm ở temp, không đưa vào repository.
