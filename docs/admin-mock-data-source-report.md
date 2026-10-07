# Admin UI — nguồn dữ liệu mock

Báo cáo ngày 2026-10-07. Theo yêu cầu mới nhất, ngắt toàn bộ API đang gắn vào Admin UI. Báo cáo này thay thế trạng thái tích hợp API trong báo cáo cleanup trước đó.

1. **Branch:** `admin-ui`, HEAD `1408ac3`. Worktree: `D:\Code\Web-Booster\.worktrees\publish-admin-ui-layout`.
2. **Kiến trúc mock:** fixtures tập trung trong `mocks/`; bootstrap và mutations trong `services/mock/`; components gọi service facade. Zustand lưu phiên review trong sessionStorage, khóa phân biệt cấu hình nguồn dữ liệu. Không tự chuyển sang mock khi API lỗi.
3. **Modules MOCK:** Auth, Staff, Dashboard, Orders/Incoming Orders, Assignments, Chat, Security/Profile và Notifications. Dữ liệu và thao tác review được khôi phục từ phiên bản mock trước đó.
4. **Modules API:** Không có module Admin nào đang gọi API. Đã bỏ route BFF auth đang hoạt động và ngắt CurrencyProvider trên `/admin`, vốn tự gọi API tỷ giá. API của giao diện công khai không thuộc phạm vi thay đổi này.
5. **Dashboard:** Có thống kê, đơn gần đây, hoạt động và dữ liệu nhân viên mock; các trang không bị trống sau refactor.
6. **Orders:** Danh sách, tìm kiếm, lọc, phân trang, chi tiết, duyệt, cập nhật tiến độ, tạm dừng và hủy hoạt động với mock.
7. **Assignments:** Giữ hàng chờ, ứng viên, đề nghị nhận đơn, phân công lại và hết hạn đề nghị trong mock service.
8. **Chat:** Giữ hội thoại, tin nhắn, ghi chú nội bộ, gửi tin, đính kèm mock, trạng thái đọc và lưu trữ. Tin đã gửi còn sau reload trong cùng phiên.
9. **Security:** Có phiên đăng nhập và nhật ký mock; đổi mật khẩu mock đăng xuất và bảo vệ route theo trạng thái phiên UI.
10. **Staff:** MOCK; giữ lời mời, nhận lời mời, quyền truy cập, đình chỉ và kích hoạt lại.
11. **Auth:** MOCK; có lựa chọn vai trò phục vụ review quyền UI. Đây là mô phỏng trạng thái đăng nhập, không phải xác thực backend.
12. **API client:** `lib/api/client.ts` vẫn được chuẩn bị cho lần tích hợp sau, hiện không có caller trong Admin. Registry chỉ lưu endpoint backend đã xác minh; chưa đăng ký URL Orders/Chat/Dashboard giả định.
13. **Service layer:** Facade chọn nguồn qua `lib/admin/data-source.ts`; contracts dùng chung tại `services/contracts.ts` và `types/admin.ts`. Adapter API hiện trả lỗi `NOT_IMPLEMENTED`, không fallback và không điền fixtures vào cache API. Kiểm tra mock/api/mixed xác nhận cách ly nguồn.
14. **Base URL/config:** `.env.example` chứa placeholder `BACKEND_API_URL=http://127.0.0.1:8000/api/v1` và tám biến `NEXT_PUBLIC_ADMIN_*_SOURCE=mock`. Không sửa `.env` thật. Biến public được đọc khi build; cần rebuild sau khi đổi nguồn. Base URL backend hiện chưa được sử dụng bởi Admin.
15. **Files thay đổi:** `components/admin/`, CSS `app/admin/`, `components/layout/SiteShell.tsx`, `lib/admin/`, `services/`, `types/admin.ts`, `.env.example`, `lib/api/client.ts`, `lib/api/endpoints.ts`, cấu hình và tests Playwright. Thêm `mocks/`, `services/mock/`, test contracts và test không gọi API. Xóa BFF `app/api/admin/auth/[action]/route.ts` và hai test/server dành riêng cho tích hợp API trước đó. Không đổi backend, database hay logo.
16. **Build:** `npm run build` PASS; TypeScript và tạo các trang hoàn tất.
17. **Lint:** `npm run lint` PASS. `node tests/admin/data-source-contract.mjs`: MOCK/API/MIXED đều PASS. Bộ hồi quy trước chỉnh sửa SiteShell có 21 bài UI PASS; sau chỉnh sửa cuối, chạy lại Operations/Portal/Sources: 13/13 PASS, bao gồm kiểm tra mọi route Admin không phát sinh request `/api/*`, gửi tin và reload. Các kiểm tra UI bao gồm layout, typography, tiếng Việt, modal, đơn hàng, staff, auth và chat.
18. **Git:** Thay đổi chưa commit, chưa stage, chưa push hoặc merge. `git diff --check` sạch. Backend ở worktree gốc không bị chỉnh sửa bởi task này.
19. **Backend còn thiếu:** Chưa có contracts/endpoints được xác minh để tích hợp Dashboard, Orders/Incoming Orders, Assignments, Chat, Notifications và Security audit. Auth/Staff có registry đã xác minh nhưng hiện chủ động ngắt kết nối theo yêu cầu.
20. **Module nên tích hợp tiếp:** Auth trước, sau đó Staff; cần xác minh đầy đủ response/error/session contract rồi triển khai adapter API. Chỉ chuyển nguồn khi được yêu cầu; hiện toàn bộ Admin giữ MOCK.

Không hiển thị nhãn Demo/Mock/Sample/Preview mode trên UI. Tên mock vẫn rõ ràng trong code. Logo trong suốt, theme và bố cục Admin được giữ.
