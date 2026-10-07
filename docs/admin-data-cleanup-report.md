ASCEND Admin Portal — báo cáo ngày 07/10/2026

1. **Branch:** `admin-ui`, HEAD `1f14391`. Làm tại `D:\Code\Web-Booster\.worktrees\publish-admin-ui-layout`, nằm trong thư mục Web-Booster. Worktree này sạch trước task và chứa UI/logo mới nhất. Các thay đổi backend có sẵn tại checkout gốc được giữ nguyên.

2. **Mock files đã xóa:** `mock-data/admin.ts`, `orders.ts`, `orderAssignments.ts`, `conversations.ts`, `messages.ts`. Không còn import runtime tới thư mục này.

3. **Dữ liệu giả đã loại bỏ:** tài khoản, khách hàng, nhân sự, lời mời, đơn hàng, ứng viên phân công, tiến độ, lịch sử, hội thoại, tin nhắn, thông báo, phiên bảo mật và nhật ký hoạt động. Store khởi tạo rỗng, chỉ giữ cache trong bộ nhớ; không persist hoặc rehydrate dữ liệu thử từ sessionStorage. Types, layout và component hữu ích được giữ.

4. **Fake login:** đã xóa. Không còn chọn vai trò thử, email điền sẵn hoặc đăng nhập bằng mật khẩu bất kỳ. Chỉ phản hồi auth thành công từ backend mới cấp quyền vào workspace. Cookie phiên HttpOnly/SameSite=Strict; token không trả vào JSON phía trình duyệt và không lưu trong localStorage/sessionStorage.

5. **Fake staff:** đã xóa. Giữ bảng, tiêu đề cột, tìm kiếm, lọc, quyền và form mời. Chức năng ghi chưa nối API được khóa; không tự tạo tài khoản, lời mời hoặc toast thành công.

6. **Fake orders:** đã xóa. Giữ bảng, tìm kiếm, bộ lọc, phân trang và component thao tác/chi tiết/phân công. Không dựng đối tượng đơn hàng dự phòng cho ID không tìm thấy.

7. **Fake chat:** đã xóa hội thoại, tin nhắn, ngữ cảnh đơn hàng, unread giả, mô phỏng đang nhập và tệp đính kèm mẫu. Composer/send/upload bị khóa khi chưa có API hoặc hội thoại thật.

8. **Fake dashboard stats:** đã xóa. Các giá trị chưa có nguồn hiển thị `—`, không coi dữ liệu thiếu là số 0. Bỏ avatar nhân sự mẫu và ngày cập nhật mẫu. Ngày trên header là ngày hiện tại theo múi giờ Việt Nam.

9. **Fake notifications:** đã xóa. Không có chấm unread cố định hoặc badge đếm giả. Popover có trạng thái chưa có thông báo/chưa khả dụng.

10. **Fake security sessions:** đã xóa IP, thiết bị, phiên và hoạt động mẫu. Bảng và timeline vẫn còn; các thông tin phiên trong Profile hiển thị `—` khi chưa có dữ liệu.

11. **Services:** `auth.service.ts`, `staff.service.ts`, `order.service.ts`, `assignment.service.ts`, `chat.service.ts`, `dashboard.service.ts`, `security.service.ts`. Có interfaces trong `services/contracts.ts`. Các exports cũ trong `admin.ts`/`operations.ts` giữ tương thích cho component hiện tại; không còn mock mutations.

12. **API client:** `lib/api/client.ts` dùng cùng origin `/api/admin`, JSON headers, cookie credentials, no-store, timeout và lỗi có kiểm soát. BFF `app/api/admin/auth/[action]/route.ts` dùng env server `BACKEND_API_URL`, tương thích `NEXT_PUBLIC_API_BASE_URL` nếu cấu hình cũ có sẵn. Chỉ sửa `.env.example`; không sửa env thật. Registry endpoint nằm trong `lib/api/endpoints.ts`. `ApiFeatureUnavailableError` có code `NOT_IMPLEMENTED`; không đoán URL cho module chưa có API.

13. **Auth readiness:** đã có adapter/BFF cho login, me, logout, change-password và accept-invitation theo route/request/resource được đọc từ backend hiện tại. Role/status và cấu trúc user được xác minh trước khi cấp phiên Admin. Change-password/logout chỉ báo thành công và xóa phiên sau khi backend xác nhận. Cần cấu hình URL backend thật và kiểm thử triển khai với Laravel ở phase tích hợp. Chưa có luồng UI đổi mật khẩu ban đầu; tài khoản `must_change_password` bị từ chối truy cập Admin có kiểm soát. Chưa thêm refresh tự động.

14. **Staff readiness:** contracts và registry đã sẵn sàng. Đã xác minh endpoint list/detail/invitations/permissions/activate/suspend/revoke-sessions/resend/revoke từ `D:\Code\Web-Booster\backend\routes\api.php`. Adapter staff chưa gọi các endpoint đó: trả `NOT_IMPLEMENTED`, không dùng cache rỗng giả vờ API thành công. Phase tiếp theo cần BFF, mapping response, phân trang và xử lý validation/authorization thật.

15. **Orders API còn thiếu:** danh sách/tìm kiếm/lọc/phân trang, chi tiết, hàng chờ mới, review, cập nhật trạng thái, tiến độ, ghi chú, hủy/hoàn thành và lịch sử đơn. Không có URL giả cho các chức năng này.

16. **Chat API còn thiếu:** danh sách hội thoại, tin nhắn theo hội thoại/kênh, gửi tin, ghi chú nội bộ, read/unread, archive và liên kết ngữ cảnh đơn; upload/realtime cần hợp đồng riêng. Không tự tạo conversation theo mã đơn.

17. **Dashboard API còn thiếu:** số liệu tổng quan và doanh thu theo khoảng thời gian/múi giờ, thống kê trạng thái, đơn gần đây, nhân sự và lời mời. Security/activity/notifications chưa có API đọc tương ứng được xác minh trong audit này.

18. **Empty/unavailable states:** giữ UI và thêm trạng thái cho đơn hàng, đơn mới, phân công, nhân sự, lời mời, hội thoại, thông báo, phiên bảo mật, hoạt động và thống kê. Order detail báo “Không tìm thấy dữ liệu đơn hàng.” Không dựng ngữ cảnh chat bên phải khi không có đơn. Các bảng rỗng vẫn giữ tiêu đề cột. Các module dùng query hook có loading/success/empty/error/unavailable và retry; Profile lấy user từ auth, không có user thì loading.

19. **Error states:** chuẩn hóa tiếng Việt cho 401/403/404/422/429/500 và lỗi mạng/502/503; không fallback về seed khi lỗi. Lỗi me dẫn về trang đăng nhập với thông báo không tải được tài khoản. Bộ kiểm thử đã đóng cổng backend kiểm thử và xác nhận login báo lỗi 502, không vào Admin hoặc dựng dữ liệu giả.

20. **Build:** `npm run build` PASS trên bản cuối, bao gồm kiểm tra TypeScript và generate routes. Next worker cần quyền chạy ngoài sandbox; build thành công sau khi cấp quyền thực thi.

21. **Lint/QA:** `npm run lint` PASS. Bộ Playwright mới 17/17 PASS; sau chỉnh unread thành `—`, kiểm thử chat/form được chạy lại riêng và PASS. QA các route `/admin/login`, `/admin`, `/admin/orders`, `/admin/incoming-orders`, `/admin/assignments`, `/admin/orders/[id]`, `/admin/chat`, `/admin/staff`, `/admin/staff/invitations`, `/admin/security`, `/admin/profile`, `/admin/accept-invitation`; thêm route Admin đã gỡ và Employee 404. Kiểm tra 8 viewport từ 390px đến 1920px và form mời không tràn viewport. Test transport sử dụng server chỉ nằm trong `tests/admin/`; production không import hoặc khởi động server này, không gọi Laravel/database thật để tạo dữ liệu kiểm thử. Các suite cũ phụ thuộc seed đã được thay bằng suite auth/empty-state/layout phù hợp hành vi mới.

22. **Git status:** thay đổi chưa stage/commit, gồm frontend Admin, services/types/API client/BFF, template env, tests và báo cáo. `git diff --check` PASS. Không commit, push hoặc merge; HEAD không đổi. Không đưa env thật, mật khẩu/tài khoản thật, JWT thật hoặc API key vào thay đổi.

23. **Backend:** không sửa `backend/`, Laravel, migration hoặc database. Chỉ đọc routes/requests/resources để xác minh hợp đồng. Logo transparent hiện tại trong `public/brand/` không bị thay đổi; giữ thiết kế dark/gold, typography và các layout hiện tại.

24. **Công việc backend/tích hợp tiếp theo:** xây các API Orders/Assignments/Chat/Dashboard/Security/Activity/Notifications còn thiếu; bổ sung candidate availability/workload, đề nghị/phân công lại và lịch sử phản hồi. Xác minh và tích hợp Staff API đã tồn tại. Chốt hợp đồng phân trang/filter, quyền, lỗi và timestamp trước khi bật capability từng module. Sau đó nối query/cache bằng dữ liệu thật, bật thao tác khi adapter đã hoàn tất, kiểm thử auth với Laravel và hoàn thiện initial-password/refresh nếu cần.
