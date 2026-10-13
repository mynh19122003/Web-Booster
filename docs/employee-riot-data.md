# Đăng nhập theo role và dữ liệu Riot

Role được đọc từ bảng `users` khi xác thực và khi kiểm tra session. Tài khoản `employee` luôn đăng nhập vào `/employee`, kể cả khi mở form khách hàng, dùng Google hoặc có tham số `next`. Tài khoản `user` và role cũ `customer` mặc định vào trang Home `/`. Các đường dẫn quay lại như `/checkout` được giữ cho user; đường dẫn nhân viên, API, admin, trang đăng nhập và URL ngoài website bị loại bỏ. Đăng ký không cho phép tự cấp quyền employee.

Nhân viên mở **Dữ liệu game Riot** từ `/employee`, hoặc truy cập `/employee/riot`. Trang này cung cấp toàn bộ 65 endpoint **GET lấy dữ liệu** của Account V1 và 24 nhóm API LoL, TFT, Valorant trong danh mục Riot được kiểm tra ngày 2026-10-10. Bao gồm rank, mastery, Clash, challenges, spectator, summoner, trận đấu/timeline/replay, trạng thái game, giải đấu, Valorant content và các API PC/console. Các API POST/PUT tạo hoặc sửa giải đấu không thuộc chức năng lấy dữ liệu này. LoR/Riftbound và API chạy trong game client cục bộ nằm ngoài ba game/REST API của yêu cầu.

## Cấu hình máy chủ

Thêm các biến cần dùng vào `.env.local` hoặc secret environment của hosting, sau đó khởi động lại máy chủ:

```dotenv
# Key dùng chung, hoặc cấu hình key riêng theo game bên dưới.
RIOT_API_KEY=
RIOT_LOL_API_KEY=
RIOT_TFT_API_KEY=
RIOT_VALORANT_API_KEY=

# Key giải đấu được Riot cấp, dùng riêng cho tournament/tournament-stub.
RIOT_TOURNAMENT_API_KEY=

# Riot Sign On Client Secret Basic được Riot phê duyệt.
RIOT_RSO_CLIENT_ID=
RIOT_RSO_CLIENT_SECRET=
RIOT_RSO_REDIRECT_URI=https://your-domain.example/api/employee/riot/callback
```

Key riêng của game được ưu tiên trước `RIOT_API_KEY`. Key thông thường không đảm bảo quyền truy cập mọi sản phẩm/endpoint; Riot có thể yêu cầu production key hoặc cấp quyền bổ sung. Không dùng tiền tố `NEXT_PUBLIC_` cho các biến này.

## Cách lấy dữ liệu

Để tra lịch sử trận đấu trực tiếp, mở `/employee/coaches`, nhập Riot ID trong **một ô** dạng `Name#Tag` (ví dụ `BLG Lucyiu#BLG`), chọn máy chủ và bấm **Đồng bộ Riot API**. Luồng LoL/TFT dùng Account V1 để lấy PUUID, tìm active region, xác nhận summoner, rồi đọc danh sách và chi tiết tối đa 20 trận qua Match V5/TFT Match V1. Giao diện có thẻ rank/LP/thắng/thua/tỉ lệ thắng, bộ lọc chế độ và 20 trận gần đây. LoL hiển thị tướng, cấp độ, trang bị, KDA, CS/phút, vàng và sát thương; TFT hiển thị thứ hạng. Rank được lấy bằng League V4 `/lol/league/v4/entries/by-puuid/{puuid}` hoặc TFT League V1 `/tft/league/v1/by-puuid/{puuid}`. Bước tra cứu không thay đổi liên kết công khai. Bấm **Lưu liên kết cho coach** khi muốn cập nhật hồ sơ coach.

`POST /api/employee/riot/history` chỉ cho employee đã đăng nhập và request cùng origin; body `{ "riotId": "Name#Tag", "game": "lol", "platform": "vn2" }` (`game` có thể là `tft`). Kết quả không chứa key hoặc PUUID. Khoảng trắng quanh tên/tag được bỏ; thiếu tag hoặc nhiều dấu `#` bị từ chối. Nếu key thiếu hoặc Riot trả 401/403, form báo lỗi key; 404 báo kiểm tra tài khoản/máy chủ; 429 chờ theo `Retry-After`.

Đối với các API dữ liệu khác ở `/employee/riot`:

1. Chọn game và `account-v1 → Get account by riot id`, nhập game name và tag riêng (không kèm `#`), chọn cluster Account V1 gần nhất: ASIA, AMERICAS hoặc EUROPE.
2. PUUID trả về được dùng để điền các truy vấn tiếp theo. Với LoL/TFT, chọn **Get active region** để lấy `/riot/account/v1/region/by-game/{game}/by-puuid/{puuid}`. Với Valorant, dùng **Get active shard**; tham số game tự động là `val`.
3. Chọn endpoint cần dùng và host mà endpoint hỗ trợ. API platform dùng VN2/EUW1/NA1…; Match dùng cluster; Valorant dùng AP/EU/NA… Danh mục host lấy trực tiếp từ tài liệu của từng endpoint.
4. Nhập match ID, act ID, queue, champion ID… theo dữ liệu Riot; bấm **Lấy dữ liệu**. Có thể tải toàn bộ response JSON. API có phân trang cho phép truyền `start`, `count`, `page`, `startIndex`, `size` tương ứng.

Form liên kết coach LoL/TFT cũng gọi Active Region trước khi xác minh Summoner để lưu máy chủ đang hoạt động khi Riot trả về platform hợp lệ. Lịch sử công khai của coach vẫn dùng API đã liên kết, không công khai console tra cứu của nhân viên.

## Riot Sign On và Valorant

Nút **Kết nối Riot** dùng OAuth với scope `openid`, state gắn với tài khoản nhân viên và redirect URI được cấu hình trên máy chủ. Callback gọi Account V1 `/accounts/me` bằng Bearer token. Access token nằm trong cookie HttpOnly được mã hóa AES-256-GCM, gắn với user ID và hết hạn theo token (tối đa một giờ); không trả về trình duyệt trong JSON và không lưu refresh token. Khi hết hạn, kết nối lại. Đăng xuất xóa kết nối Riot.

API `/me` và LoL RSO Match dùng token này. Dữ liệu người chơi Valorant PC/console yêu cầu kết nối RSO; matchlist chỉ truy vấn PUUID đã kết nối, chi tiết trận chỉ trả về nếu tài khoản đó xuất hiện trong trận. API content/status/leaderboard dùng API key với quyền thích hợp. Các profile coach Valorant chưa được tự động công khai: tài khoản Riot kết nối ở console là tài khoản của nhân viên hiện tại.

## Giới hạn và xác minh

`GET /api/employee/riot` trả danh mục và trạng thái cấu hình cho employee; thêm `endpoint`, `game`, `region` cùng các tham số của endpoint để lấy dữ liệu. Server kiểm tra session/role trong DB, giới hạn host/path/query theo danh mục, encode từng path parameter, chặn URL tùy ý và không theo redirect upstream. API trả lỗi 401/403 cho truy cập không hợp lệ; thiếu key, key bị từ chối, RSO hết hạn, không có dữ liệu và quota đều có trạng thái riêng.

Response thành công được cache 60 giây, tối đa 200 mục trong một process; truy vấn trùng đang chạy được gộp. Client và server tôn trọng `Retry-After`. Hạn mức phát triển bảo thủ được dùng chung với luồng coach; triển khai nhiều process cần cache/rate limiter dùng chung.

Danh mục không tự quét toàn bộ dữ liệu Riot hay tự gọi cả 65 API cùng lúc. Nhiều endpoint cần ID/queue/act và quyền khác nhau, có phân trang và quota riêng. Dữ liệu thực phụ thuộc key được cấp và sự đồng ý qua RSO.

```sh
npm run riot:sync       # đồng bộ lại endpoint từ tài liệu Riot chính thức
npm run test:auth-riot  # kiểm tra auth/role/routing/cache/RSO/quota với mock state và HTTP Riot giả lập
npm run typecheck
```

Nguồn chính thức: [Riot API reference](https://developer.riotgames.com/apis), [LoL](https://developer.riotgames.com/docs/lol), [TFT](https://developer.riotgames.com/docs/tft), [Valorant/RSO](https://developer.riotgames.com/docs/valorant), [rate limits](https://developer.riotgames.com/docs/portal).
