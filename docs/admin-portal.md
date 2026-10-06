# ASCEND Admin Portal

Orders, assignments, chat and the employee preview extend this portal. See
[the operations handover](admin-operations.md) for added routes and demo flows.

## Workspace and local preview

Source UI: `admin-ui` at `D:\Code\Web-Booster\.worktrees\admin-ui`.
The frontend snapshot is published separately on `admin-ui-publish`, based on
`origin/main` at `69a85ed`, with no backend commits carried over. The source
worktree and its uncommitted changes are preserved.

```powershell
cd D:\Code\Web-Booster\.worktrees\admin-ui-publish
npm run dev -- --webpack --hostname 127.0.0.1 --port 3001
```

Open http://127.0.0.1:3001/admin/login. Choose Super admin, Staff, or View-only staff,
keep the suggested email, and enter any made-up password of at least 8 characters.
No new dependencies were added. This local worktree reuses the root node_modules through
a junction; an independent checkout should run `npm ci` first.

## Routes

| Route                                            | Screen                                                                         |
| ------------------------------------------------ | ------------------------------------------------------------------------------ |
| `/admin/login`                                   | Demo sign-in, role selector, password visibility, reset placeholder            |
| `/admin`                                         | Stats, applications, invitations, activity, quick actions                      |
| `/admin/staff`                                   | Search, status filter, details, permissions, suspend/activate, revoke sessions |
| `/admin/staff/invitations`                       | Create, resend, revoke, inspect invitation                                     |
| `/admin/accept-invitation?token=demo-invitation` | Password/contact onboarding, success/error                                     |
| `/admin/employee-applications`                   | Search by applicant/email/Riot ID and status filters                           |
| `/admin/employee-applications/[id]`              | Review, approve/reject, resend credentials; sample `app-1048`                  |
| `/admin/security`                                | Sessions, revoke confirmation, audit timeline                                  |
| `/admin/profile`                                 | Account, permissions, sign-in details, password change/sign-out                |

## Files and components

Modified application source: `app/admin/page.tsx`. Next may regenerate `next-env.d.ts`
when switching between dev and build; it is not an intentional source change.

New files:

- `app/admin/layout.tsx`, `app/admin/portal.css` and page files for the eight additional routes above.
- `components/admin/portal/AdminShell.tsx`: auth guard, sidebar, topbar, mobile navigation, account/notifications, toast provider.
- `components/admin/portal/Ui.tsx`: DataTable, StatusBadge, PermissionBadgeGroup, AdminStatCard, PageHeader, EmptyState, AccessDenied, SearchFilterBar, ActivityTimeline, Avatar, Field, PermissionFields, ActionMenu, FormModal.
- `components/admin/portal/Dashboard.tsx`: dashboard composition.
- `components/admin/portal/StaffPages.tsx`: staff/invitation tables and modal compositions for invite, permissions, suspend, activation and revocation.
- `components/admin/portal/ApplicationPages.tsx`: application list/detail and approve/reject/resend modal compositions.
- `components/admin/portal/SecurityProfile.tsx`: session table, revoke modal, profile and password form.
- `components/admin/portal/AuthPages.tsx`: login and invitation onboarding.
- `types/admin.ts`: typed users, permissions, staff, invitations, applications, sessions, audit, stats and service inputs.
- `mock-data/admin.ts`: seeded owner, staff, invitations, applications, sessions and activities.
- `lib/admin/config.ts`: navigation, permissions and demo password rules.
- `lib/admin/store.ts`: reactive, tab-scoped persisted demo data.
- `services/admin.ts`: auth, staff, application and security services; dashboard stats.
- `playwright.admin.config.ts`, `tests/admin/portal.spec.ts`: dedicated admin browser checks.
- `docs/admin-portal.md`: this handover.

Sora is loaded using `next/font/google` and scoped to admin. CSS transitions include
page entry, cards, buttons, table rows, modal entry and sidebar; reduced-motion is supported.
Public source files and public navigation are unchanged. Existing SiteShell already handles admin paths.

## Demo behavior and limitations

All admin actions are local simulations. No Laravel auth calls, database writes, real
emails, employee accounts or credentials are created. Passwords are never persisted;
current-password verification is intentionally simulated. Client-side role checks are
demonstration UX, not a security boundary. Forgotten password is an explicit placeholder.
Employee first-login password enforcement remains a backend/employee-portal concern;
the admin approval panel explains that onboarding requirement.

State persists on reload within sessionStorage (`ascend-admin-demo-v1`). To reset, remove
that key in DevTools and reload. Data is not synchronized between tabs or users. Seed history
uses an October 5, 2026 snapshot; pending invitation expiry starts 24 hours from initialization.
Resending rotates a token; used/revoked/expired invitations are rejected. Staff profile fields
are retained on acceptance. Suspended matching staff accounts cannot log in using Staff mode.
Owner mode remains available explicitly for demo exploration.

## API integration seam

`services/admin.ts` contains typed asynchronous mutation methods and list/detail readers:
`adminAuthService`, `staffService`, `employeeApplicationService`, `securityService`.
Replace these implementations with the backend adapter, map snake_case DTOs to the frontend
types, and populate the store from list/detail readers instead of seeds. Components currently
subscribe to the store for instant mock updates; connecting the API requires adding loading,
request-error and refetch handling around those readers.

The supplied auth endpoints are `POST /api/v1/auth/login`, `GET /api/v1/auth/me`, and
`POST /api/v1/auth/change-password`. Verify actual response shapes, permission values,
cookie/token handling and remaining endpoints against the backend before integration.
The mock single-session revocation and audit stream need matching server capabilities;
they are not evidence that those endpoints exist. Remove the role selector and demo fallback
identity when real auth is enabled. The server must enforce all permissions and token expiry.

## Verification

```powershell
npx next typegen
npx tsc --noEmit
npx eslint app/admin components/admin/portal lib/admin services/admin.ts mock-data/admin.ts types/admin.ts tests/admin playwright.admin.config.ts
npx playwright test --config playwright.admin.config.ts
npm run build -- --webpack
```

Browser tests use installed Microsoft Edge on port 3001 and isolated browser contexts.
They cover routes, Sora, runtime errors, view-only permissions, single-use invitation,
mobile overflow, persisted approval/rejection, staff suspend/activate and password-change sign-out.
Screenshots are written to ignored `test-results/` during the complete suite.
