# ASCEND: Staff UI and brand update

Work branch: `admin-ui`. Worktree: `D:/Code/Web-Booster/.worktrees/publish-admin-ui-layout`.
The main checkout remains on `backend` to preserve its existing uncommitted work. No branch merge, commit or push was performed.

## Removed frontend

- `/employee` layout and `/employee/orders`, `/employee/orders/available`, `/employee/orders/[id]`.
- `/admin/employee-applications` and its detail page.
- `EmployeePreview.tsx`, `ApplicationPages.tsx`, and the unreferenced legacy `AdminDashboard.tsx`.
- Application mock data, application state/types/service, dashboard recruitment cards, notifications and preview links.
- Preview identity state and Employee-only CSS.

Assignment components are now `StaffCandidateCard` and `AssignStaffModal`; the candidate type is `StaffCandidate`. Operational candidates are also STAFF accounts in the mock staff directory. Suspended accounts cannot receive new assignments. Demo storage keys moved to v2 so stale application/preview state is not rehydrated.

## Navigation and roles

Roles remain `SUPER_ADMIN` and `STAFF`. The read-only demo is a STAFF permission preset.

- Tổng quan.
- ĐƠN HÀNG: Đơn hàng, Đơn mới, Phân công.
- NHÂN SỰ: Nhân sự quản trị, Lời mời (owner only).
- LIÊN LẠC: Tin nhắn.
- BẢO MẬT: Bảo mật, Hồ sơ cá nhân.

Visible assignment, chat, workload, search, status and notification labels use Nhân sự/Staff. API-related raw fields (`employeeId`, `employeeNotes`), raw chat enum `EMPLOYEE`, legacy permission values and record IDs remain compatible; presentation maps them to staff terminology. They do not enable a separate Employee portal.

Unknown admin URLs render a Vietnamese not-found page with `noindex` within the admin layout. Next.js may stream that page with HTTP 200; removed employee URLs return HTTP 404. The skip link hydrates consistently for unmatched routes.

## Brand assets and placement

`public/brand/logo-icon.png`, `logo-horizontal.png`, `app-icon.png` are exact crops/resizing from the supplied JPG. See `public/brand/README.md` for crop coordinates.

`AscendLogo.tsx` uses the supplied images for the public navbar (desktop/mobile), admin sidebar (expanded/collapsed), workspace mark and admin login/invitation branding. Browser metadata and Organization structured data reference the new app icon. Wordmark and tagline are baked into the supplied horizontal image: ASCEND / BOOST YOUR POTENTIAL.

The three logo assets now have transparent PNG alpha backgrounds. The shared logo component renders them normally without screen blending, preserving the metallic colors on admin surfaces. Admin accents/focus use Prime Gold `#FF9F3C`, with Charcoal `#0F0F10` and Slate `#1F1F23` surfaces. Layout, animation and fonts remain in place. The shared dependency root is configured for Turbopack so this worktree builds using the repository's node_modules junction.

## API preparation

- `lib/api/client.ts`: environment-based base URL, JSON requests, optional in-memory bearer token argument, abort signal via RequestInit, typed error/status/details, empty responses. No endpoint is invoked merely by importing it.
- `.env.example`: `NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000/api/v1` (public configuration, no secret).
- `services/contracts.ts`: auth, staff, orders, assignments, dashboard and chat interfaces.
- `services/auth.service.ts`, `staff.service.ts`, `order.service.ts`, `dashboard.service.ts`, `chat.service.ts`: typed mock adapters with contract checks.
- `services/admin.ts` and `operations.ts`: existing local mock implementations and permission logic, retained for existing consumers.
- `types/`: domain models; `mock-data/`: seed records; `lib/admin/`: sessionStorage stores and loading hooks; `components/admin/`: UI.

Admin auth (login/me/logout/change-password), staff list/detail/permissions/status/session revocation/invitations, orders/assignment actions, dashboard and chat remain mock. The public authentication implementation was not changed. No unverified Laravel endpoints are called. The existing UI reads stores; real adapters must populate these stores or replace their selectors with returned API state when integrated.

## Verification

- Production `npm run build`: passed, including TypeScript and route generation.
- `npm run typecheck`: passed.
- `npm run lint`: passed with no errors or warnings.
- Browser regression: 16/16 passed (portal, operations, Vietnamese copy and staff/brand checks). Responsive checks cover 1440, 768 and 390 px and all requested Admin pages, including order details. Checks cover staff assignment, read-only permissions, chat, invitations, suspension/reactivation, password change, removed routes and collapsed sidebar.
- Git whitespace check: passed with Windows CRLF handling.
- Changes remain uncommitted. No backend file was changed in this worktree; the original backend checkout's changes were left untouched.

## Next API phase

Verify the existing Laravel auth/staff contracts first, including response envelopes, permission names, JWT handling and validation errors. Replace the corresponding mock adapter and store reader together, then exercise login/me/logout/change-password and staff invitations/permissions/status/session revocation. Keep orders/dashboard/chat mocks until their endpoints exist. Add integration tests using actual responses at that phase.
