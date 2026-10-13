# PROJECT_CONTEXT — ASCEND

Ngữ cảnh cho AI viết code; đối chiếu repository ngày 10/10/2026. Dự án `ascend-gaming` 1.0.0 là website boosting/coaching và cửa hàng tài khoản game (LoL, TFT, Valorant), gồm giao diện khách hàng và employee. Một số dữ liệu thương mại vẫn là demo; không mặc định toàn bộ ứng dụng đã có backend thanh toán thực.

## 1. Core Tech Stack & Version

Các phiên bản dưới đây là khai báo trong `package.json`.

| Lớp | Công nghệ |
| --- | --- |
| Framework / routing | Next.js **16.3.8**, **App Router**, React / React DOM **19.3.0** |
| Ngôn ngữ | TypeScript **6.0.3**, `strict: true`; alias `@/*` trỏ vào root |
| Styling | Tailwind CSS / PostCSS plugin **4.3.3**, CSS global theo domain và một số CSS Modules |
| State | Zustand **5.0.15**; React hooks cho state cục bộ |
| Dữ liệu server | Mock data trong bộ nhớ; reset khi khởi động lại server |
| Animation / 3D | `motion` **14.0.0** (`motion/react`), GSAP **3.15.0**, Three.js **0.186.1**, Fiber **9.8.1**, Drei **10.7.9** |
| Icons / ảnh | Lucide React **1.51.0**, React Icons `^5.7.0`, Simple Icons / Iconify; `react-easy-crop` `^6.2.4` |
| Chất lượng | ESLint **9.39.5** + Next preset **16.3.8**, Prettier **3.9.9**, Playwright **1.63.0**, Axe **4.13.0** |

Không có Axios, TanStack Query/SWR, NextAuth, Zod/Yup, React Hook Form hay UI kit Shadcn/Radix/MUI. `package.json` không khai báo Node engine.

## 2. Project Architecture & Conventions

Source nằm ngay root, không có `src/` hay backend service riêng.

```text
app/                 App Router: page.tsx, layout.tsx, [slug]/[id]
  api/**/route.ts    HTTP handlers; auth, profile, employee, coaches, requests
components/          account, auth, coaches, employee, games, home, layout,
                     services, ui, three và các domain khác
lib/                 Auth, persistence, Riot, pricing, i18n, shared helpers
utils/               Browser utilities, ví dụ cropImage.ts
store/               Zustand hooks: useStore/useCart/useWallet/useOrders/...
types/               Shared types; domain types cũng nằm trong lib/ và data/
data/                Catalog, giá, mock data, riot-endpoints.json
public/              Images, flags, ranks, logos, videos
scripts/             Tooling .mjs: quyền employee/coach, giá, Riot catalog
tests/               Playwright và node:test; docs/ chứa tài liệu luồng
```

- Component dùng PascalCase `.tsx`; hooks `use*.ts`; phần lớn file `lib/` và `data/` dùng kebab-case. Theo naming của thư mục hiện tại khi thêm file.
- Server Components mặc định; thêm `'use client'` khi cần tương tác/hooks/browser APIs. Không đưa mock state server, filesystem, crypto hay secret vào client bundle.
- `app/layout.tsx` dùng `SiteShell`, các provider ngôn ngữ/tiền tệ và CSS theo domain. Navigation dùng `next/link`, `next/navigation`.
- Types dùng chung đặt gần domain hoặc trong `types/`; props cục bộ có thể khai báo trong component. Không có quy định mọi interface phải nằm trong một file trung tâm.
- Mock state server nằm trong `lib/mock-state.ts`; tài khoản, phiên, chat, coach và cache Riot reset khi server khởi động lại. Các route liên quan chạy Node runtime.

## 3. UI / Design System Patterns

- UI tự xây dựng; reusable primitives/providers ở `components/ui/`. Tailwind v4 dùng `@import "tailwindcss"` và `@theme inline`; CSS domain như `riot-matches.css`, `employee-riot.css`, `support-chat.css`.
- Theme hiện tại là dark: nền `#0F0F10`, surface `#1F1F23`, gold/orange chủ đạo `#FF9F3C`, metallic gold `#F5D7A1`. Dùng token hiện có, CTA vàng/cam, card bo góc có border và hover/focus nhẹ; không tự thêm palette khác.
- Scope selector theo domain (`coach-*`, `riot-*`, `employee-*`). Tránh selector global rộng: CSS không có layer có thể ghi đè Tailwind hoặc ảnh hưởng form/heading khác.
- Lucide cho icon giao diện; logo/game dùng asset và helper hiện có. Font: Rajdhani cho heading, Plus Jakarta Sans cho body, Inter cho giá.
- Text dùng `useLanguage`, `UiText`, hệ thống `lib/i18n*`; tiền dùng helper/provider Currency. Hỗ trợ đa ngôn ngữ và RTL, không hardcode một ngôn ngữ hoặc format giá.
- Giữ responsive, label, focus-visible, status/error accessible. Modal cần focus trap, Escape, khôi phục focus và scroll lock; animation tôn trọng reduced motion.

## 4. Data Handling & API Standards

- Gọi API bằng native `fetch`. JSON dùng `Content-Type: application/json`; upload dùng `FormData`, không tự đặt multipart header. Handler trả `NextResponse.json`; lỗi thường `{ error: "machine-code" }`, success shape tùy endpoint, chưa có envelope thống nhất.
- Form controlled bằng `useState`/`onSubmit`, HTML validation và kiểm tra thủ công; có trạng thái busy/error/success. Server kiểm tra kiểu, độ dài, enum và giá trị số; không chỉ tin validation frontend.
- Auth custom: password salted scrypt, session token hash trong mock state server, cookie `ascend_session` HttpOnly; Google OAuth riêng. Dùng `currentUser()` và kiểm tra quyền/ownership phía server. Mutation phải giữ kiểm tra same-origin; ưu tiên helper `isSameOrigin` cho route mới.
- Role từ mock state: `employee` vào `/employee`; `customer`/`user` vào home `/` (luồng checkout có thể giữ next hợp lệ). Employee thông thường quản lý profile của mình; demo/admin có quyền riêng. Public profile chỉ hiển thị; chỉnh sửa/sync Riot thuộc employee editor có quyền.
- Riot: `lib/riot-api.ts` và catalog allowlist; key chỉ ở server env. LoL/TFT resolve `Name#Tag`, lấy rank/history; Valorant player data cần kết nối RSO được Riot chấp thuận. Không coi API key đơn lẻ là đủ quyền cho mọi endpoint.
- History snapshot lưu trong bộ nhớ khi server chạy, đưa vào render đầu tiên; dữ liệu cũ refresh nền bằng `after()`, client polling/focus với dedupe và giới hạn request. Lỗi upstream giữ snapshot tốt gần nhất.
- Profile/avatar cập nhật giữa component/tab qua custom event và localStorage revision, không phải WebSocket/SSE. Một số Zustand store persist localStorage, có hydration chủ động; wallet/orders local là demo.

## 5. DO's & DON'Ts

**Bắt buộc theo AGENTS/config và cơ chế hiện có:**

- Trước khi viết code Next.js, đọc guide liên quan trong `node_modules/next/dist/docs/`; giữ block Next-generated trong `AGENTS.md`. Theo API hiện tại, bao gồm await `params`/`cookies()` khi cần.
- Giữ TypeScript strict và ranh giới server/client; server xác thực role/ownership trước đọc hoặc ghi dữ liệu riêng. Dùng prepared SQL, không nối input vào câu SQL.
- Không công khai secret bằng `NEXT_PUBLIC_*`, response hay log; không commit `.env*`, `.data/`, build output. Không reset/xóa thay đổi không liên quan trong working tree.

**Quy ước cho code mới (không phải mọi mục đều là lint rule):**

- Tái sử dụng component, token, helper và domain types; tránh `any`, dùng `unknown` và narrowing cho dữ liệu không tin cậy. Không thêm ORM/UI kit/validation framework khi chưa cần.
- Không truy cập browser APIs trong SSR/module initialization; `'use client'` vẫn có prerender. Cleanup listener, request và object URL; giữ trạng thái loading/error và accessibility.
- Không biến mock wallet/orders/reviews thành dữ liệu production, không thay dữ liệu Riot thật bằng mock, không thêm nút sync/edit vào public profile.
- Kiểm tra phù hợp với thay đổi: `npm run typecheck`, `npm run lint`, `npm run build`; backend dùng `npm run test:auth-riot`, avatar có `tests/avatar-crop.test.mjs`, UI dùng `npm run test:e2e`. Playwright mặc định dùng MS Edge; server test dùng `next start`, cần build nếu không dùng server có sẵn.
