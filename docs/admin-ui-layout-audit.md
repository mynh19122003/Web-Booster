# ASCEND Admin UI audit — 2026-10-06

Worktree: `D:/Code/Web-Booster/.worktrees/admin-ui`
Branch: `admin-ui`. The original workspace remains on `backend`. No changes were made to main, backend, API routes, services or mock data. No commit, merge or push was performed.

## Findings and fixes

| Component | Root cause | Fix |
| --- | --- | --- |
| Assign employee / Reassign | Shared text-input selectors also matched radio inputs, setting full width and padding; the oversized radio appeared to overlap avatars/cards. | Exclude radios in both root and modal selectors. Preserve the small native radio and keyboard selection. Avatar stays in normal flow at 44px. No artificial z-index was added. |
| Assign modal width | Shared width was 520px. A 760px max-width did not increase that width. | Set actual width to min(960px, viewport minus 32px). Keep two candidate columns on wide screens and one at 760px and below. |
| Candidate cards | Entire unavailable card had opacity 0.45. Long text lacked wrapping and facts had unequal columns. | Keep full opacity, distinct background/border and explicit unavailable/at-capacity text; preserve disabled selection. Equal fact columns and wrap long names, games and ranks. |
| Assignment summary | The generic direct-span flex rule also stretched the status badge. | Apply flex only to the summary text span. |
| Review order | JSX rendered body content only for cancel. The order prop and typed mock fields were already correct. | Render customer/email, game, service, current/target, region, price, priority/queue/options and submitted date. Two columns on desktop, one on mobile. |
| Pause / Complete / Start / Cancel | Confirmation dialog bodies were empty except cancellation reason. | Add customer, service/game and current/target summary to confirm the affected order. Preserve all existing mock actions. |
| Shared FormModal | Entire dialog overflowed/scrolled; header/footer could leave view. There was no body-scroll lock or synchronous submit guard. | Limit height to min(85dvh, 800px); flex form with fixed header/footer and scrollable body. Thin dark scrollbar, overscroll containment and long-text wrapping. Lock background body scrolling and restore previous overflow on cleanup. Use ref guard against repeated submissions plus existing loading/disabled state. |

The native dialog retains its top-layer stacking, backdrop, focus handling, Escape support and close button. Existing Sora font, sidebar/topbar, gaming theme, accents and animations were retained. No mock/type mismatch was found; no `any` or service normalization was introduced.

## Files changed in this task

- `components/admin/portal/Ui.tsx`
- `components/admin/operations/OrderUi.tsx`
- `app/admin/portal.css`
- `app/admin/operations.css`
- `tests/admin/layout-audit.spec.ts` (new)
- `tests/admin/modal-audit.spec.ts` (new)
- `tests/admin/review-order.spec.ts` (new)
- `docs/admin-ui-layout-audit.md` (this report)

The Admin Portal files were already untracked at task start. Therefore normal `git diff --stat` does not include these edits. Existing changes in `app/admin/page.tsx` and `components/layout/SiteShell.tsx` were preserved.

## Verification

- Read the installed Next.js CSS guide before editing.
- `npm run lint`: PASS (exit 0).
- `npm run build`: FAIL due to existing worktree node_modules symlink outside Turbopack filesystem root.
- `npm run build -- --webpack`: PASS, including TypeScript and all 51 routes. No build configuration was changed to hide the Turbopack limitation.
- Development regression/viewport suite: 15/15 PASS before the final extra confirmation summaries.
- Final production suite: 17/17 PASS against the final webpack build.
- Additional production Review Order test: 1/1 PASS. Repeated `requestSubmit()` only records one review; loading disables submit; status becomes WAITING_ASSIGNMENT; no /api/v1 requests occur.
- `git diff --check`: PASS.

Seven tested viewport sizes: 1920x1080, 1440x900, 1366x768, 1280x720, 1024x768, 768x1024, 390x844.

At every size, audited dashboard, orders, incoming orders, assignments, ASC-1049 detail, chat, staff, invitations, employee applications, app-1048 detail, security and profile. Checked horizontal overflow, dialog bounds, footer visibility, body-scroll lock, Escape, radio/avatar sizing and scrolling to the last employee and Submitted field.

Additional desktop/mobile dialog checks: Invite Staff, Edit Permissions, Suspend, Activate, Revoke Sessions, Revoke Session, Approve, Reject, Resend Credentials, Assign, Reassign, Review, Pause, Cancel, Complete, chat customer/employee dialogs and context drawer. Existing regression tests cover archive/reopen chat and password change. Change Password is an inline profile form in this UI, not a dialog.

Inspected screenshots at desktop and mobile, including settled Assign screenshots and the bottom of the employee list. Evidence is generated under `test-results/` (ignored by git).

## Final Git and remaining issues

Final working branch in the UI worktree: `admin-ui`. Working tree remains dirty with the pre-existing portal files plus the UI fixes and new audit tests/report. No files were staged. The original backend workspace was left intact.

No remaining layout defect was observed in the tested routes and modal states. The default Turbopack build still has the dependency-symlink environment limitation described above. This was a mock UI audit; backend integration was outside scope.

## Publication note

After this audit, the user authorized committing and publishing the UI fixes to admin-ui and main. The earlier Git statements record the state at audit completion. The publication applies only the UI fixes, tests and this report to the latest origin/main, preserving existing site updates and excluding backend history.
