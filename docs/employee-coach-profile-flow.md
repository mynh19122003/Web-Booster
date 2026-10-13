# Employee — Luồng cập nhật Coach Profile

> Ghi chú lịch sử: các mục SQLite bên dưới mô tả backend cũ. Bản preview hiện dùng mock state trong bộ nhớ và reset khi khởi động lại server; xem README.

> Luồng hiện tại, quyền sở hữu tài khoản và trạng thái nhận coaching được mô tả tại [coach-account-ownership.md](./coach-account-ownership.md). Nội dung bên dưới là bản thiết kế ban đầu.

**Ngày:** 10/10/2026  
**Phạm vi:** toàn bộ luồng employee quản lý thông tin coach, bao gồm phần hiện có (Riot account) và phần cần bổ sung (profile động).

---

## 1. Tổng quan

Employee có hai nhóm công việc liên quan đến coach:

| Nhóm | Trạng thái | Đường dẫn |
|------|-----------|-----------|
| Liên kết Riot account để hiển thị match history | Đã có | `/employee/coaches` |
| Cập nhật thông tin profile (rank, giá, bio, online…) | Chưa có | — |

Toàn bộ thông tin profile hiện tại được hard-code trong `data/coaches.ts`. Chỉ dữ liệu Riot account (gameName, tagLine, platform, puuid) được lưu xuống SQLite và có thể thay đổi qua UI.

---

## 2. Luồng hiện có: Liên kết Riot Account

### 2.1 Đường đi đầy đủ

```
[1] /employee/login
    AuthPanel (audience="employee")
    Xac thuc email/password, kiem tra role = "employee"
    Redirect /employee

[2] /employee  [Dashboard]
    SupportInbox — xu ly yeu cau khach hang
    Link → /employee/coaches

[3] /employee/coaches
    CoachRiotAccounts component
    GET /api/employee/coaches
    Tra ve: danh sach tat ca coach + trang thai Riot account hien tai

[4] Moi coach: component <Connection>
    Form nhap:
      • Riot ID  (dang GameName#Tag)
      • Server   (dropdown: na1, euw1, kr, ap, br1, ...)
    Nut: "Verify & link" / "Disconnect"

[5] Nhan "Verify & link"
    PATCH /api/employee/coaches
    Body: { slug, gameName, tagLine, platform }
    Server goi Riot Account V1 de xac minh account ton tai
    Luu vao SQLite (coach_riot_accounts):
      slug | game_name | tag_line | platform | puuid | updated_at

[6] Profile coach cong khai  /coaches/[slug]
    CoachGameplay component
    GET /api/coaches/[slug]/matches
    Doc coach_riot_accounts, goi riotMatchHistory (Match V5 / TFT V1)
    Hien thi 10 tran gan nhat voi ket qua thuc tu Riot API
```

### 2.2 Bản đồ file

| Vai trò | File |
|---------|------|
| DB read/write | `lib/coach-riot-db.ts` |
| API employee (GET + PATCH) | `app/api/employee/coaches/route.ts` |
| API công khai (match history) | `app/api/coaches/[slug]/matches/route.ts` |
| UI employee | `components/coaches/CoachRiotAccounts.tsx` |
| UI công khai | `components/coaches/CoachGameplay.tsx` |
| Riot API wrapper | `lib/riot-api.ts` |

### 2.3 Ràng buộc bảo mật hiện tại

- `GET /api/employee/coaches` — yêu cầu `role === "employee"`, trả về 403 nếu không.
- `PATCH /api/employee/coaches` — thêm kiểm tra same-origin header.
- `GET /api/coaches/[slug]/matches` — công khai nhưng chỉ nhận slug đã biết; không trả về PUUID hay API key.
- Valorant bị vô hiệu hóa (`coach.game === "valorant"` trả lỗi `unsupported-coach`) vì match history Valorant yêu cầu Riot Sign On được phê duyệt.

---

## 3. Giới hạn hiện tại

Các trường sau được hard-code trong `data/coaches.ts` — không có luồng UI hay API nào để employee sửa:

| Trường | Kiểu | Ghi chú |
|--------|------|---------|
| `name` | string | Tên hiển thị |
| `peakRank` | string | Rank cao nhất |
| `rating` | number | Điểm đánh giá |
| `reviewCount` | number | Số lượt review |
| `hourlyRate` | number | Giá mỗi giờ (USD) |
| `online` | boolean | Trạng thái trực tuyến |
| `isMvp` | boolean | Badge MVP |
| `sessionFormats` | array | live / vod |
| `languages` | array | Ngôn ngữ hỗ trợ |
| `roles` | array | Role trong game |
| `students` | number | Số học viên |
| `yearsCoaching` | number | Năm kinh nghiệm |
| `bioKey` | string | Key tra i18n cho bio |
| `accent` | string | Màu accent trên UI |
| Avatar | file | `/public/images/coaches/[slug].svg` |

---

## 4. Luồng cần bổ sung: Cập nhật Profile động

Để employee chỉnh sửa đầy đủ coach profile, cần thêm ba thành phần: DB table, API endpoint và UI form.

### 4.1 DB table mới: `coach_profiles`

```sql
CREATE TABLE IF NOT EXISTS coach_profiles (
  slug         TEXT PRIMARY KEY,
  online       INTEGER,    -- 0/1, NULL = dung default tu data/
  hourly_rate  REAL,       -- NULL = dung default
  is_mvp       INTEGER,    -- 0/1, NULL = dung default
  bio_override TEXT,       -- NULL = dung bioKey tu i18n
  session_live INTEGER,    -- 0/1
  session_vod  INTEGER,    -- 0/1
  updated_at   INTEGER NOT NULL
);
```

Logic merge: giá trị trong DB ghi đè giá trị hard-code; `NULL` = giữ nguyên default từ `data/coaches.ts`.

### 4.2 API mới

```
PATCH /api/employee/coaches/[slug]/profile
```

Body (tất cả optional):

```json
{
  "online": true,
  "hourlyRate": 26,
  "isMvp": false,
  "bioOverride": "Custom bio text...",
  "sessionLive": true,
  "sessionVod": false
}
```

Validation:
- `hourlyRate`: number, 1–500
- `bioOverride`: string, max 1000 ký tự hoặc `null` để reset về default
- Các boolean: `true | false | null`

### 4.3 Merge data trong server component

```ts
// app/coaches/[slug]/page.tsx
import { coachFor } from "@/data/coaches";
import { coachProfileOverride } from "@/lib/coach-profile-db";

const base = coachFor(slug);
const override = coachProfileOverride(slug);

const coach = {
  ...base,
  online:         override?.online      ?? base.online,
  hourlyRate:     override?.hourlyRate  ?? base.hourlyRate,
  isMvp:          override?.isMvp       ?? base.isMvp,
  sessionFormats: [
    ...((override?.sessionLive ?? base.sessionFormats.includes("live")) ? ["live" as const] : []),
    ...((override?.sessionVod  ?? base.sessionFormats.includes("vod"))  ? ["vod"  as const] : []),
  ],
};
```

### 4.4 UI form trong `/employee/coaches`

Mỗi coach card trong `CoachRiotAccounts` bổ sung một section "Profile settings":

```
+- Luna -------------------------------------------------------+
|  [Riot account]                                              |
|  Luna#EUW1 · EUW            [Disconnect]                    |
|                                                              |
|  [Profile settings]                                          |
|   Online status   (o) Online  ( ) Offline                   |
|   Hourly rate     [  24  ] USD / hour                        |
|   MVP badge       [x] Enabled                               |
|   Session formats [x] Live    [x] VOD review                 |
|   Bio override    [                              ]           |
|                   [ Leave empty to use default  ]           |
|                                                              |
|                               [Save profile]                 |
+--------------------------------------------------------------+
```

---

## 5. Thứ tự triển khai & Trạng thái hoàn thành

| Bước | Công việc | Ưu tiên | Trạng thái | Ghi chú triển khai |
|------|-----------|---------|------------|-------------------|
| 1 | Tạo `lib/coach-profile-db.ts` + SQLite migration | P1 | Đã hoàn thành | Bảng `coach_profiles` SQLite với schema đầy đủ, merge helpers |
| 2 | Tạo `app/api/employee/coaches/[slug]/profile/route.ts` | P1 | Đã hoàn thành | GET + PATCH có same-origin header check, employee role guard, validation |
| 3 | Cập nhật `CoachRiotAccounts` — thêm section Profile settings | P1 | Đã hoàn thành | Component `CoachProfileEditor.tsx` responsive, dark mode, collapsible |
| 4 | Merge override vào server component `/coaches/[slug]` | P1 | Đã hoàn thành | `app/coaches/[slug]/page.tsx`, `/coaches`, `CoachProfile`, `CoachDirectory` |
| 5 | Upload avatar qua API | P2 | Đã hoàn thành | `app/api/employee/coaches/[slug]/avatar/route.ts`, base64 preview & storage |
| 6 | Bổ sung `rating`, `reviewCount`, `languages`, `roles` vào bảng override | P2 | Đã hoàn thành | Hỗ trợ đầy đủ trong DB, API, editor và giao diện công khai |


---

## 6. Tài liệu liên quan

- [`docs/employee-messaging.md`](./employee-messaging.md) — cấp quyền employee, luồng hỗ trợ khách hàng
- [`docs/riot-match-history.md`](./riot-match-history.md) — Riot API key, rate limit, caching
- [`lib/coach-riot-db.ts`](../lib/coach-riot-db.ts) — DB operations hiện tại cho Riot account
- [`app/api/employee/coaches/route.ts`](../app/api/employee/coaches/route.ts) — API employee hiện tại
- [`data/coaches.ts`](../data/coaches.ts) — dữ liệu static của coach
