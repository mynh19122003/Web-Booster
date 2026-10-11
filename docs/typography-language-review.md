# Review font, cỡ chữ và chuyển ngôn ngữ — 11/10/2026

## Kết luận

Font tổng thể phù hợp với website gaming: Plus Jakarta Sans cho nội dung, Rajdhani cho tiêu đề tiếng Anh và Inter cho giá. Trang chủ có phân cấp rõ và tiếng Việt có dấu hiển thị tốt. Tuy nhiên, chưa nên coi typography và đa ngôn ngữ là hoàn thiện: nhiều nhãn 8–11px khó đọc, một số vùng bỏ qua font theo locale, và chuyển ngôn ngữ làm lộ lỗi hydration cùng nhiều nội dung chưa dịch.

Đây là báo cáo review. Không sửa mã giao diện hoặc dữ liệu dịch trong lần rà soát này.

## Phạm vi và bằng chứng

- Rà cấu hình font/CSS dùng chung, provider ngôn ngữ, catalog, các trang và component trong `app/` và `components/`.
- Duyệt 31 đường dẫn ở Chrome, viewport 1440×1000 và 390×844: trang chủ, dịch vụ, rank/duo, ba game, coach/danh sách và Luna, boosters, account, cart, checkout, profile, wallet, messages, support/contact, reviews, careers, about, blog/bài viết, terms/privacy, login/employee login, employee/coach/Riot và admin. Một số trang được bảo vệ chuyển hướng khi chưa đăng nhập; không xem đây là xác nhận giao diện nhân viên hoặc trạng thái tài khoản đã đăng nhập.
- Đo DOM chi tiết 24 lượt trang/viewport, gồm checkout boost có phần tài khoản Riot và tùy chọn đơn hàng. Không thấy tràn ngang toàn tài liệu trong 24 lượt đo này. Điều này không bảo đảm mọi menu, trạng thái hoặc locale đều không tràn.
- Thử menu tiếng Đức, Nhật, Ả Rập và Việt; quan sát giao diện sau reload/chuyển trang. Bộ đo cho tiếng Việt ghi nhận 24 lỗi hydration. Thông báo đăng nhập được kiểm tra bằng response 401 mô phỏng, không đăng nhập hay gửi thanh toán thật.
- Quét 940 vị trí gọi dịch có câu literal trong component/trang. Với mỗi ngôn ngữ ngoài EN/VI, có 361 vị trí thiếu bản dịch, tương ứng 325 câu khác nhau sau khi chuẩn hóa. VI không thiếu trong tập literal này nhờ bản dịch trực tiếp. Đây không phải tỷ lệ hoàn thiện của toàn website: không bao gồm nội dung động, JSX viết trực tiếp, chất lượng dịch hay tất cả câu `t(key)`.
- Dữ liệu đo và ảnh nằm trong `output/playwright/` được Git bỏ qua: `audit-summary.json`, `catalog-audit.json`, `typography-*.png`, `language-*.png`. Đọc hướng dẫn Next.js cài trong dự án về font và internationalization.

## Các vấn đề cần sửa

### 1. P2 — Ngôn ngữ đã lưu gây hydration mismatch ở Suspense

Vị trí: `components/layout/SiteShell.tsx:41`, `components/ui/LanguageProvider.tsx:23`, `components/ui/Dialogs.tsx:24`.

Tái hiện: chọn VI, rồi tải lại trang chủ/dịch vụ/coach/checkout. Console báo server và client khác text; diff chỉ vào `Dialogs`, ví dụ `Your saved plans` → `Kế hoạch đã lưu`. Provider lấy snapshot server là EN, sau mount cập nhật theo localStorage; boundary hộp thoại có thể hydrate sau khi context đã đổi. React phải dựng lại boundary. Bộ đo thu được 24 sự kiện lỗi hydration trong chuỗi 24 lượt trang/viewport; số sự kiện không chứng minh mỗi trang có đúng một lỗi. Cần xem từng stack khi sửa.

Khuyến nghị: dùng locale từ request/cookie/URL làm snapshot ban đầu thống nhất cho server và client; hoặc giữ riêng boundary cần hydrate ở locale ban đầu cho đến khi hydrate xong. Không dùng `suppressHydrationWarning` để che lỗi text. Xác nhận bằng reload và chuyển trang với locale đã lưu, bao gồm các dialog mở sau đó.

### 2. P2 — Menu quảng bá 24 ngôn ngữ nhưng phần mới thiếu bản dịch

Vị trí: `lib/i18n.ts:154`, `components/account/PasswordSettings.tsx:11`, `components/coaches/CoachingSessionFormats.tsx:14`, `components/employee/CustomerOrderPanel.tsx:24` và nhiều component mới khác.

`translateText` trả lại câu tiếng Anh khi không tìm thấy bản dịch. Quét literal tìm 325 câu khác nhau thiếu ở cả 22 locale ngoài EN/VI. Trên coach ở DE, thanh điều hướng đã dịch nhưng `Duo packages`, `Selected package`, `Play with them, or learn from them.` và nút đặt gói vẫn tiếng Anh. Checkout JA/AR còn `Your plan`, `Confirmation`, `Credit card`, `Your details`, `Continue with Apple Pay`.

Khuyến nghị: đưa nội dung mới vào catalog có key ổn định, kiểm tra coverage theo locale trong quá trình cập nhật. Ưu tiên hành trình mua dịch vụ, đăng nhập, lỗi và tài khoản; sau đó coach/Riot và khu nhân viên. Giữ tên game, người chơi, Riot ID và nội dung người dùng theo bản gốc là hợp lý.

### 3. P2 — Nội dung blog và chính sách không đi qua hệ thống dịch

Vị trí: `app/blog/page.tsx:23`, `app/blog/[slug]/page.tsx:32`, `app/legal/[slug]/page.tsx:132`, `components/ui/PageIntro.tsx:26`.

Chọn VI rồi mở `/blog/build-a-better-warmup`: header tiếng Việt nhưng tiêu đề, category và ba đoạn bài viết vẫn tiếng Anh. Trang terms/privacy cũng render trực tiếp tiêu đề section và paragraph tiếng Anh. `PageIntro` với props trực tiếp không dịch chúng.

Khuyến nghị: thêm dữ liệu bài viết/chính sách theo locale và truyền locale vào intro/nội dung. Nếu chỉ cung cấp bản tiếng Anh, hiển thị rõ ngôn ngữ nội dung và gắn `lang="en"` cho bài để công cụ đọc màn hình phát âm đúng.

### 4. P2 — Lỗi đăng nhập giữ nguyên tiếng Anh

Vị trí: `components/auth/AuthPanel.tsx:52`, `app/api/auth/login/route.ts:23`.

Form tiếng Việt nhận response 401 `{ error: "Email or password is incorrect." }`; UI hiển thị nguyên câu tiếng Anh. Client lấy `result.error`, tạo Error và đưa thẳng `caught.message` vào state. Việc form có `t()` không bao phủ thông báo từ API.

Khuyến nghị: API trả mã lỗi ổn định, client ánh xạ mã sang catalog của locale đang chọn. State lưu mã lỗi thay vì câu đã dịch để khi đổi ngôn ngữ thông báo cũng đổi. Áp dụng tương tự cho đăng ký, hồ sơ, checkout và Riot; chưa khẳng định toàn bộ các endpoint này có cùng lỗi nếu chưa tái hiện riêng.

### 5. P2 — Chữ phụ quá nhỏ ở coach, account và checkout

Vị trí tiêu biểu: `app/glass.css:456`, `app/glass.css:744`, `app/glass.css:750`, `app/glass.css:1997`, `app/globals.css:1361`.

Đo ở mobile 390px: badge coach verified/MVP là 8px, giá theo trận và nhãn peak rank có vùng 9px. DOM trên profile Luna có 106 phần tử chứa text trực tiếp dưới 12px; trang account có 131. Các số này là số phần tử, có thể gồm nhóm cha/con và vùng cần scroll, không phải số câu riêng hoặc toàn bộ đều xuất hiện cùng lúc trong viewport. Trên ảnh, badge và đơn vị giá thực sự nhỏ dù tiêu đề chính vẫn rõ.

Khuyến nghị: giữ chữ 8–10px chỉ cho dấu hiệu trang trí không thiết yếu. Đưa nhãn/badge hữu ích lên ít nhất 12px, ghi chú/đơn vị giá 12–13px, label/form 14px và nội dung cần đọc 15–16px. Rà màu chữ phụ cùng nền, tăng line-height và khoảng trống sau khi tăng size để tránh cắt chữ. Đây là đề xuất thiết kế; không coi 12px là ngưỡng WCAG bắt buộc.

### 6. P2 — Một số selector bỏ qua font locale

Vị trí: `app/order-workspace.css:19` và `:114`; đối chiếu override locale tại `app/glass.css:2037`.

CSS chung đổi `--font-heading` sang body font cho VI/RU/BG và font hệ thống cho JA/ZH/KO/AR. Nhưng heading phần `Tài khoản Riot Games` và legend `Tùy chọn đơn hàng` dùng trực tiếp `--font-ascend-heading`. DOM tiếng Việt xác nhận chúng vẫn có family Rajdhani, trong khi heading thanh toán và thông tin dùng Plus Jakarta Sans. Trên support cũng có nhãn dùng Rajdhani dù đã chọn VI.

Khuyến nghị: mọi component dùng token semantic `--font-heading`/`--font-body`/`--font-price`, tránh biến nguồn font cụ thể. Kiểm tra dấu tiếng Việt, Cyrillic và glyph châu Á; cần xem glyph thực tế vì computed family chỉ cho biết font stack, không khẳng định font nào render từng ký tự.

### 7. P3 — Input đăng nhập mobile chưa thống nhất với checkout

Vị trí: `app/glass.css:1308` và các rule input auth trong `app/globals.css`.

Ở 390px, input email/password vẫn 14px. Checkout đã lên 16px, gồm thông tin billing, Riot và ghi chú. Hai form cùng website có độ dễ đọc khác nhau.

Khuyến nghị: dùng 16px cho input mobile toàn bộ auth/profile/form. Chrome Windows đã được đo; chưa kiểm tra Safari/iOS hoặc hành vi zoom khi focus trên thiết bị thật.

### 8. P3 — Bản dịch máy cần biên tập theo ngữ cảnh game

Vị trí: `lib/i18n/generated-ui-phrases.ts:8` và `:9`.

DE dịch `Name A–Z` thành `Nennen Sie A–Z`, và `listed skin` thành `gelistete Haut`, làm sai nghĩa nhãn sắp xếp và trang phục game. Có catalog không đồng nghĩa bản dịch đúng ngữ cảnh.

Khuyến nghị: lập glossary cho skin, rank, booster, duo, placements, VOD; review thủ công nhãn giao dịch và hành động chính. Ưu tiên các locale thực sự được hỗ trợ trước khi mở rộng thêm.

## Hệ cỡ chữ đề xuất

| Vai trò | Desktop | Mobile | Font |
| --- | --- | --- | --- |
| Hero | 56–72px | 36–44px | Heading theo locale |
| Tiêu đề trang | 36–48px | 28–34px | Heading theo locale |
| Tiêu đề section | 24–32px | 22–28px | Heading theo locale |
| Tiêu đề card | 18–22px | 18–20px | Body hoặc heading semantic |
| Nội dung | 15–16px | 15–16px | Plus Jakarta Sans/fallback locale |
| Label/nút | 14–16px | 14–16px | Body |
| Input | 14–16px | 16px | Body |
| Chú thích/badge/đơn vị giá | 12–13px | 12–13px | Body; Inter cho số tiền |

Body line-height khoảng 1.5–1.7; heading 1.15–1.3, tăng phù hợp với VI/AR/CJK. Tránh tăng size đồng loạt bằng selector `*`: badge, bảng, menu và card cần được bố trí lại tại component.

## Những phần hiện làm tốt và giới hạn

- Nội dung tiếng Việt trên home và form checkout nhìn rõ, font có dấu phù hợp. Main heading và body có phân cấp, giá dùng font số riêng.
- Menu DE/JA/AR/VI đổi ngôn ngữ và lưu lựa chọn sau reload thành công. Kiểm tra hai tab xác nhận tab thứ nhất cập nhật khi tab thứ hai đổi lựa chọn. `html.lang` theo locale và `dir="rtl"` cho AR. Hình ảnh checkout cho thấy bố cục chính Arabic được đảo hướng. Chưa kiểm tra mọi icon/mũi tên và dialog RTL.
- Currency sử dụng locale trong `Intl.NumberFormat`, billing dùng tên quốc gia theo locale. Một số điểm khác vẫn `toFixed()` hoặc chọn riêng VI/EN; cần chuẩn hóa khi triển khai rộng hơn.
- Auth routes không có selector ngôn ngữ riêng: người dùng đổi từ header trước khi vào login. Có thể thêm selector gọn trên auth nếu muốn người dùng đổi trực tiếp.
- SSR vẫn trả `lang="en"`, hero tiếng Anh, metadata tiếng Anh; ngôn ngữ đổi ở client. Nếu cần SEO theo ngôn ngữ, triển khai locale qua request/URL và metadata tương ứng.
- Review ở Chrome local, không phải kiểm thử production, Safari/Firefox hoặc biên tập chuẩn bản ngữ cho 24 locale. Các khu cần tài khoản nhân viên/admin được rà bằng mã nguồn; chưa thao tác vào dữ liệu thật.

## Thứ tự xử lý

1. Sửa hydration và bảo đảm locale server/client thống nhất.
2. Hoàn thiện dịch của checkout/auth/lỗi, sau đó coach/profile/Riot.
3. Chuẩn hóa token font và các vùng chữ 8–11px; thống nhất input mobile 16px.
4. Dịch blog/chính sách, biên tập glossary và kiểm tra lại DE/JA/AR trên mobile.
