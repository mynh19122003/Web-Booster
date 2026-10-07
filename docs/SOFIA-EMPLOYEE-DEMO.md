# Sofia employee mock demo — 2026-10-07

Branch/worktree: `employee-riot-launch-poc`, `D:\Code\Web-Booster\.worktrees\employee-riot-launch-poc`.

| Check | Result |
|---|---|
| Account / password | `sofia@ascend.demo` / `Ascend@123`, public mock credentials in `lib/workflow/demo.ts`. Prior admin mock had only minimum-length password validation; no exact demo password existed. |
| Role / login | “Nhân sự / Employee” replaces the Sofia read-only preset on `/admin/login`. Sofia email routes to mock employee auth even when another preset is selected. Other admin presets retain their original flow. No real auth contract changes. |
| Redirect | `/employee`, employee identity `emp-sofia`, role `EMPLOYEE`. Any prior admin user identity in the tab is cleared. |
| Initial state | Fresh demo: 0 active orders, maximum 1; greeting Sofia, Online / Sẵn sàng, empty-state CTA “Xem đơn có thể nhận”. |
| Available mock orders | New `ASC-1054`: League of Legends, Rank Boost, Emerald IV → Diamond IV, VN2, reward 450000 VND. Existing League OPEN orders including ASC-1047/1045/1043 remain available; tests require at least three. |
| Claim | PASS: available list → confirmation modal → IN_PROGRESS assigned to Sofia → `/employee/orders/ASC-1054`. |
| Limit | PASS: 1/1; other claim buttons disabled with “Bạn đã đạt giới hạn đơn đang thực hiện.” Existing service limit checks remain. |
| Chat | Locked before claim; unlocked afterward, welcome customer message displayed, employee message sent and visible. All local mock data. |
| Riot card | Locked before claim; Ready/Sẵn sàng mở after claim, `PlayerSofia#VN2`. Native client status remains Chưa xác minh because the browser has no native acknowledgement. |
| Riot click | PASS: actual user-gesture click emitted `ascendriot://open/league`, observed with browser CDP navigation event. No fake toast-only implementation or delayed launch. This automated check does not accept the external-app prompt or claim a new native window test. |
| Persistence | Existing localStorage `ascend-order-flow-v1` keeps claims/chat; sessionStorage `ascend-employee-identity` restores the employee session. Reload test passed. Additive initialization adds Sofia/ASC-1054 to old projections without resetting existing orders. Re-login does not erase a previously claimed Sofia order. |
| Build / lint | `npm run build` PASS; `npm run lint` PASS. |
| Browser review | `node scripts/review-sofia-demo.mjs` PASS: wrong-password rejection, preset, redirect, 0/1, pre-claim locks, claim, chat, protocol, reload, 1/1 lockout and separate-context admin login regression. Zero API requests and page errors in Sofia flow. |
| Git | Existing worktree remains dirty and unstaged. This task changes `AuthPages.tsx`, `EmployeePages.tsx`, `RiotClientCard.tsx`, `mocks/workflow.ts`, `services/workflow.ts`; adds demo constants, review script and this document. Earlier Employee/launcher work is preserved. No commit/push/reset/merge. |
| Backend | Untouched: no Laravel, database, migrations, real auth/order endpoints or API-contract changes. No native launcher changes this round. |

Preview: `http://127.0.0.1:3108/admin/login`. Select Nhân sự / Employee, use the public credentials above. For a fresh 0/1 demo, use a new browser profile/context; a profile that already claimed an order deliberately resumes that claim.
