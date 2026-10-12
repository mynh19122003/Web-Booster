# CHECKLIST TRIỂN KHAI VÀ HOÀN TẤT CÔNG VIỆC

> **Dự án:** ASCEND Gaming / Web-Booster  
> **Tài liệu tham chiếu gốc:** [`docs/product-flow-ui-review-boostroyal.md`](docs/product-flow-ui-review-boostroyal.md)  
> **Thời gian cập nhật:** 07/10/2026  
> **Trạng thái:** Toàn bộ 11 hạng mục (F01 → F11) đã hoàn thành và vượt qua 100% build kiểm thử Next.js 16.

---

## I. Danh sách công việc đã thực hiện (Checklist)

### 1. Luồng mua hàng & Toàn vẹn dữ liệu giao dịch (Ưu tiên P0)

- [x] **[F01] Direct Checkout cho Account:**
  - **Vấn đề ban đầu:** Nút *Buy Account Now* luôn ép người dùng qua `/login` làm đứt gãy luồng mua và mất listing đang xem.
  - **Giải pháp:** Nút mua kích hoạt thẳng modal `checkout`, đóng gói toàn bộ snapshot tài khoản (`accountPurchase`: ID, rank, division, server, level, giá) vào store; nút quay lại dẫn đúng về category accounts của game tương ứng.
  - **Tệp liên quan:** [`components/account/BoostRoyalAccountView.tsx`](components/account/BoostRoyalAccountView.tsx), [`store/useStore.ts`](store/useStore.ts), [`components/ui/Dialogs.tsx`](components/ui/Dialogs.tsx).

- [x] **[F02] Toàn vẹn ngữ cảnh Coach Booking & Giá gói:**
  - **Vấn đề ban đầu:** Đặt lịch từ profile coach làm rơi coach ID/package; giá bị tính lại thành 24 USD/giờ cố định.
  - **Giải pháp:** Hàm `bookSession()` lưu trữ đầy đủ `coachBooking` (coach slug, name, package, format hourly/duo, đơn giá, tổng tiền). Modal checkout hiển thị huy hiệu đặt lịch và tính đúng giá theo huấn luyện viên.
  - **Tệp liên quan:** [`components/coaches/CoachProfile.tsx`](components/coaches/CoachProfile.tsx), [`components/ui/Dialogs.tsx`](components/ui/Dialogs.tsx), [`store/useStore.ts`](store/useStore.ts).

- [x] **[F03] Đồng bộ Đơn hàng & Live Order Tracking:**
  - **Vấn đề ban đầu:** Đơn hàng chỉ lưu mẩu tin demo, màn hình tracking chỉ giả lập chuyển động.
  - **Giải pháp:** Mở rộng `ServiceRequest` lưu `coachBooking` và `accountPurchase`. Component `OrderTracking` kết nối với `useRequests()`, đọc đơn thật trong phiên và hiển thị mã đơn, tiến trình chính xác.
  - **Tệp liên quan:** [`lib/local-records.ts`](lib/local-records.ts), [`components/home/OrderTracking.tsx`](components/home/OrderTracking.tsx).

---

### 2. Điều hướng URL & Logic nghiệp vụ theo từng Game (Ưu tiên P1)

- [x] **[F04] Deep Link URL cho Category & Bảo toàn Draft:**
  - **Vấn đề ban đầu:** Chuyển tab không cập nhật URL; reload hoặc chuyển trang làm reset mất category đã chọn.
  - **Giải pháp:** Đồng bộ tab category với URL query parameter `?category=...` bằng `window.history.replaceState` (không gây giật trang/scroll). `GameSync` đọc query khi load để duy trì đúng danh mục.
  - **Tệp liên quan:** [`components/games/GameProductNav.tsx`](components/games/GameProductNav.tsx), [`components/ui/GameSync.tsx`](components/ui/GameSync.tsx).

- [x] **[F05] Phân tách Schema Dữ liệu Account Đa Game:**
  - **Vấn đề ban đầu:** Account Valorant bị lọt vũ khí Vandal vào mục Agents; dính nhãn Blue Essence/Riot Points của LoL; metadata trang cố định LoL.
  - **Giải pháp:** Làm sạch dữ liệu demo `DEMO-V01` đến `DEMO-V04`, tách biệt Agents và Weapon skins; server dùng NA/EU/AP chuẩn Valorant; metadata trang sinh động theo từng game (`${gameName} Account #${id}`).
  - **Tệp liên quan:** [`data/shop-accounts.ts`](data/shop-accounts.ts), [`app/account/[id]/page.tsx`](app/account/[id]/page.tsx).

- [x] **[F06] Registry Region riêng biệt cho từng Game:**
  - **Vấn đề ban đầu:** Dùng chung danh sách region LoL cho cả Valorant và TFT.
  - **Giải pháp:** Tạo hàm `regionsForGame(game)` cung cấp danh sách cụ thể: LoL (NA, EUW, KR...), Valorant (NA, EU, AP, KR, BR, LATAM), TFT (PC & Mobile regions). Tích hợp vào configurator, form danh mục và shop.
  - **Tệp liên quan:** [`data/regions.ts`](data/regions.ts), [`components/home/ServiceConfigurator.tsx`](components/home/ServiceConfigurator.tsx), [`components/services/CategoryConfigurator.tsx`](components/services/CategoryConfigurator.tsx), [`components/services/AccountShop.tsx`](components/services/AccountShop.tsx).

- [x] **[F07] Bảo toàn Role Valorant:**
  - **Vấn đề ban đầu:** Chọn role trong Valorant bị lưu thành `"Any"` khi xác nhận đơn.
  - **Giải pháp:** Hỗ trợ lưu giữ các role Duelist, Initiator, Controller, Sentinel xuyên suốt modal checkout và payload lưu trữ.
  - **Tệp liên quan:** [`components/ui/Dialogs.tsx`](components/ui/Dialogs.tsx).

- [x] **[F08] Form cấu hình chuyên biệt theo từng Danh mục:**
  - **Vấn đề ban đầu:** Nhiều category dùng chung form text thô sơ, thiếu các mode quan trọng.
  - **Giải pháp:**
    - *TFT Ranked Wins:* Thêm bộ chọn Top 4 Finish vs. 1st Place Only.
    - *LoL Clash:* Thêm chọn Clash Tier (Tier I – IV) và số lượng Booster (1 – 4 người).
    - *Champion Mastery:* Thêm HTML5 datalist gợi ý tướng phổ biến và giới hạn level mục tiêu.
  - **Tệp liên quan:** [`components/services/CategoryConfigurator.tsx`](components/services/CategoryConfigurator.tsx).

- [x] **[F09] Chuẩn hóa Thương hiệu & Đơn vị tiền tệ Game:**
  - **Vấn đề ban đầu:** Còn sót nhiều chuỗi "BoostRoyal" và "BOOSTROYAL SHIELD™".
  - **Giải pháp:** Thay thế toàn bộ bằng thương hiệu "ASCEND Verified" và "ASCEND SHIELD™". Đơn vị tiền tệ hiển thị đúng theo từng game: LoL (BE/RP), Valorant (Radianite/VP), TFT (Realm Crystals/RP).
  - **Tệp liên quan:** [`components/account/BoostRoyalAccountView.tsx`](components/account/BoostRoyalAccountView.tsx).

---

### 3. Nâng cấp Trải nghiệm Catalog Account Shop (Ưu tiên P2)

- [x] **[F10] Bộ lọc nâng cao, Phân trang & Yêu thích (Favorites):**
  - **Vấn đề ban đầu:** Danh sách account render cùng lúc toàn bộ card, thiếu thanh chip xóa bộ lọc, không có lưu yêu thích.
  - **Giải pháp:**
    - Tích hợp hook `useShopFavorites()` lưu danh sách tài khoản yêu thích (nút tim).
    - Thêm thanh **Active Filter Chips** với nút `×` để gỡ từng điều kiện lọc hoặc xóa nhanh toàn bộ.
    - Phân trang *"Load more accounts"* hiển thị 12 tài khoản mỗi đợt.
    - Thêm cảnh báo khi người dùng nhập khoảng giá không hợp lệ (`Min > Max`).
  - **Tệp liên quan:** [`components/services/AccountShop.tsx`](components/services/AccountShop.tsx).

---

### 4. Hạ tầng Kỹ thuật & Tương thích Next.js 16 SSR/SSG

- [x] **[F11] Khắc phục triệt để lỗi Prerender Bailout (`useSearchParams`):**
  - **Vấn đề ban đầu:** Next.js 16 yêu cầu bất kỳ client component nào dùng `useSearchParams()` trên trang render tĩnh phải nằm trong `<Suspense>`.
  - **Giải pháp:** Bọc `<Suspense fallback={null}>` tại toàn bộ các điểm gọi:
    - [`components/layout/SiteShell.tsx`](components/layout/SiteShell.tsx) (bọc `<Dialogs />`)
    - [`components/home/ServiceConfigurator.tsx`](components/home/ServiceConfigurator.tsx) (bọc `<GameProductNav />`)
    - [`app/games/[slug]/page.tsx`](app/games/[slug]/page.tsx) & [`app/services/[slug]/page.tsx`](app/services/[slug]/page.tsx) (bọc `<GameSync />`)
    - [`app/account/[id]/page.tsx`](app/account/[id]/page.tsx) (bọc `<BoostRoyalAccountView />`)
  - **Kết quả kiểm thử:** Lệnh `npm run build` chạy thành công 100%, tạo đầy đủ **48/48 static routes** với mã thoát **exit code 0**.

---

## II. Bảng tóm tắt tệp đã sửa đổi

| Nhóm chức năng | Tệp nguồn | Nội dung thực hiện |
| :--- | :--- | :--- |
| **State & Store** | [`store/useStore.ts`](store/useStore.ts) | Định nghĩa `CoachBooking`, `AccountPurchase`, duy trì price override |
| **Modal & Checkout** | [`components/ui/Dialogs.tsx`](components/ui/Dialogs.tsx) | Recap badge cho Account & Coach, giữ role Valorant |
| **Account Shop & Detail** | [`components/account/BoostRoyalAccountView.tsx`](components/account/BoostRoyalAccountView.tsx) | Nút Direct Checkout, ASCEND branding, currency theo game |
| | [`app/account/[id]/page.tsx`](app/account/[id]/page.tsx) | Dynamic SEO metadata theo game, bọc Suspense |
| | [`components/services/AccountShop.tsx`](components/services/AccountShop.tsx) | Active filter chips, favorites, pagination 12 items |
| | [`data/shop-accounts.ts`](data/shop-accounts.ts) | Sửa sạch schema Agent vs Weapon cho Valorant |
| **Coaching Flow** | [`components/coaches/CoachProfile.tsx`](components/coaches/CoachProfile.tsx) | Handoff toàn vẹn coach slug, package, đơn giá, tổng tiền |
| **Region & Category** | [`data/regions.ts`](data/regions.ts) | Registry `regionsForGame()` phân tách LoL / Valorant / TFT |
| | [`components/services/CategoryConfigurator.tsx`](components/services/CategoryConfigurator.tsx) | Form TFT Top 4 / Hạng 1, Clash tiers & boosters, Mastery datalist |
| | [`components/home/ServiceConfigurator.tsx`](components/home/ServiceConfigurator.tsx) | Đồng bộ regions theo game, bọc Suspense cho navigation |
| **URL Navigation** | [`components/games/GameProductNav.tsx`](components/games/GameProductNav.tsx) | Deep link query `?category=...` |
| | [`components/ui/GameSync.tsx`](components/ui/GameSync.tsx) | Duy trì category khi đổi route |
| **Order Tracking** | [`lib/local-records.ts`](lib/local-records.ts) | Mở rộng schema `ServiceRequest`, hàm `getRequestById()` |
| | [`components/home/OrderTracking.tsx`](components/home/OrderTracking.tsx) | Tra cứu đơn hàng thật từ local session |
| **Layout & Build** | [`components/layout/SiteShell.tsx`](components/layout/SiteShell.tsx) | Suspense boundary cho modal toàn cục |
| | [`app/games/[slug]/page.tsx`](app/games/[slug]/page.tsx) | Suspense boundary cho GameSync |
| | [`app/services/[slug]/page.tsx`](app/services/[slug]/page.tsx) | Suspense boundary cho GameSync |

---

## III. Hạng mục mở rộng khuyến nghị cho giai đoạn tiếp theo (Backend & Delivery)

- [ ] Tích hợp cổng thanh toán thực tế (Stripe, PayPal, Crypto) kết nối API Backend.
- [ ] Xây dựng hệ thống phân phối tài khoản tự động (Instant account credential delivery) gửi qua Email/SMS sau khi thanh toán thành công.
- [ ] Hệ thống phòng chat riêng (Direct Chat) giữa khách hàng và Booster/Coach trên giao diện quản lý đơn.
