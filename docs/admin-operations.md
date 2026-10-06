# ASCEND orders, assignments and chat

## Branch and preview

This frontend snapshot is on `admin-ui-publish`, based on `origin/main@69a85ed`.
The original `admin-ui` worktree and its uncommitted portal are preserved.
Only frontend files are included; backend and local environment files stay separate.

```powershell
cd D:\Code\Web-Booster\.worktrees\admin-ui-publish
npm run dev -- --webpack --hostname 127.0.0.1 --port 3001
```

Open `http://127.0.0.1:3001/admin/login`. Choose Super admin and use the suggested
email with a made-up password of at least eight characters. Staff has editable mock
permissions; View-only staff can read orders/chat but cannot modify orders or send messages.
Existing saved staff accounts retain their assigned permissions. Grant the new order/chat
permissions from Staff → Edit permissions when using a pre-extension saved demo.

## Routes and walkthrough

| Route                                        | Purpose                                                                                                                       |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `/admin/orders`                              | All orders, five stats, search, status/game/service/employee/date filters, sort, removable chips, six-row pagination          |
| `/admin/incoming-orders`                     | New, needs-review and waiting-assignment queues                                                                               |
| `/admin/assignments`                         | Unassigned, pending offers, accepted and active work; recent decisions                                                        |
| `/admin/orders/ASC-1042`                     | Customer/game/service brief, employee, live demo progress, rank milestones, timeline, assignment history, notes, chat preview |
| `/admin/chat`                                | Searchable support inbox with customer/employee/order/unread/archive filters                                                  |
| `/admin/chat?order=ASC-1042`                 | Direct order conversation, creates an empty local thread when needed                                                          |
| `/employee/orders`                           | Mock employee’s assigned orders                                                                                               |
| `/employee/orders/available`                 | Pending offers for the selected preview employee                                                                              |
| `/employee/orders/ASC-1043?employee=emp-zen` | Employee brief and accept/decline preview                                                                                     |

Suggested full demo:

1. Open `/admin/orders/ASC-1049`, choose Assign employee, select Nova, and Send offer.
2. Open the employee preview link. Decline with a reason. Return to the admin detail to
   see the recorded decline and order back in the assignment queue.
3. Send a new offer to Zen. In the preview, Accept order and Start work. The order now
   appears as IN_PROGRESS in admin. The previous decision remains in assignment history.
4. Use Update progress, Pause/Resume, or Complete in admin. Cancellation asks for a reason;
   reassignment requires explicit confirmation and sends a fresh offer.
5. Open full chat. Send a message with Enter; use Shift+Enter for a newline. Add an
   Internal Note and switch back to Customer Chat to verify the note is absent there.
6. Archive and reopen the conversation. Inspect order/customer/employee context with the
   right-panel toggle; mobile has an explicit back button to the conversation list.

## UI and architecture

The Sora instance is shared in `lib/admin/font.ts`. New styling is in
`app/admin/operations.css`, extending `portal.css` tokens. Existing cards, modal,
status badge, avatar, fields, confirmation/pending/error UI and shell are reused.

Main new component modules in `components/admin/operations/`:

- `OrdersPage.tsx`: OrdersPage, reusable OrderTable with isolated row actions.
- `OrderUi.tsx`: OrderCard, OrderActions, OrderProgressBar, OfferCountdown,
  EmployeeCandidateCard, AssignEmployeeModal, OrderTimeline, loading/retry panels.
- `QueuePages.tsx`: IncomingOrdersPage and AssignmentsPage.
- `OrderDetail.tsx`: complete detail, milestones, internal admin notes and update modals.
- `OperationsOverview.tsx`: dashboard order stats, recent orders, status overview, chat activity and quick links.
- `ChatParts.tsx`: ConversationList, ChatMessage, ChatComposer, ChatContextPanel.
- `ChatPage.tsx`: inbox/channel selection, read state, archive, typing preview, responsive panes.
- `EmployeePreview.tsx`: EmployeeShell, EmployeeOrdersPage and EmployeeOrderDetail.

The existing `AdminShell.tsx`, `Dashboard.tsx`, shared `Ui.tsx`, permission config,
admin types/mock login, and admin layout were extended. `SiteShell.tsx` additionally
bypasses public chrome for `/employee/*`; public pages retain their existing behavior.

New models: `types/operations.ts` defines Order, OrderStatus, Customer,
EmployeeCandidate, OrderAssignment, AssignmentStatus, OrderProgressEvent, Conversation,
ChatMessage, ChatParticipant and OrderNotification.

New mock datasets: `mock-data/orders.ts`, `orderAssignments.ts`, `conversations.ts`,
`messages.ts`. The seed covers all 11 order states, 16 fictional orders, four employees,
pending/declined/accepted assignment histories and customer/admin/employee messages.

`lib/admin/operations-store.ts` holds shared reactive state. `use-operations.ts` handles
hydration, offer expiry, service loading/error and retry. `services/operations.ts` exports
`orderService`, `assignmentService`, `chatService`, and `employeePreviewService`.
No packages were added.

## Dashboard, navigation and responsive behavior

Dashboard keeps the original team/application widgets and adds Revenue Today (confirmed
demo order value), Orders Today, Active Orders, Unassigned Orders, status overview, recent
orders and chat unread count. Quick links open incoming orders, assignments, chat and
applications; the existing Invite Staff remains.

Sidebar groups are Dashboard, Orders, Team, Communication, Security. Incoming-order,
chat and application badges update from local state. Collapse and mobile navigation are
retained. The notification bell links to new orders/messages, acceptance/decline and completion.

Wide desktop chat uses three panes. Tablet uses a context drawer; mobile switches from
the conversation list to the selected chat with a back action. Wide tables scroll within
their panels. Assignment lanes, detail cards, filters and candidate cards stack on narrower
screens. Motion includes card/row hover, queue entry, modal entry, sidebar transitions,
smooth progress changes and a manually triggered three-second typing preview. Reduced-motion
preferences are respected.

## What is mocked

- State is persisted per tab in sessionStorage key `ascend-operations-demo-v1`, separate
  from the existing admin auth demo key `ascend-admin-demo-v1`. Reload preserves it;
  it does not synchronize across tabs/users. Remove a key in DevTools and reload to reset.
- Dates are relative to initial seed creation. Pending offers expire after 15 minutes;
  the sample pending offer starts with 13 minutes left. Expired/declined offers return
  to WAITING_ASSIGNMENT. Active and pending offers reserve employee capacity.
- Service methods validate local transitions, game/type compatibility, capacity and
  permissions. They do not constitute backend authorization.
- Employee identity is an explicit preview selector, not a real employee session. Only
  the selected employee’s assigned orders/offers are shown. No game passwords or customer
  credentials exist in these models. Commission is intentionally not configured.
- Progress updates, order payments/revenue, read receipts, notifications and chat are
  simulated. There are no real charges, refunds, messages, deliveries, websocket connections
  or uploads. Attachment buttons add labeled image/file placeholders, never file contents.
- Internal Notes are separated from customer messages and their list/detail previews.
  Server-side visibility controls are still required before using real data.

## Backend contracts to add later

No new endpoints are guessed or called. TODO markers are placed in the service layer.
The next backend work should define contracts for:

1. Order list/detail and stats with server pagination, filters/sort, date timezone and money currency.
2. Reviewed/paused/resumed/completed/cancelled transitions, reasons, idempotency and refund workflow.
3. Employee availability/capability/workload; transactional assignment/reassignment, offer expiry,
   authenticated employee acceptance/decline and immutable assignment history.
4. Progress events, rank/LP updates, notes, timeline and real-time delivery or polling.
5. Conversation/participant membership, public messages versus internal notes, unread counts,
   read receipts, archive/reopen, validated attachment storage and authorized downloads.
6. Permission enforcement for order.view/assign/update/cancel and chat.view/send, plus
   authenticated employee ownership checks. Replace the demo identity selector before production.
7. Notification persistence/read status and links to authorized order/conversation context.

Replace the mock service implementations with adapters that populate the reactive store
from verified DTOs. Components already use service mutation signatures and loading/retry
readers, but real integration must handle server errors, stale revisions, pagination and
refetch/cache updates. The browser demo store must never be a production source of truth.

## QA commands

```powershell
npx next typegen
npx tsc --noEmit
npm run lint
npx playwright test --config playwright.admin.config.ts
npm run build -- --webpack
```

The Webpack flag supports this local worktree’s shared node_modules junction. Browser
tests run on Edge, isolate their sessions, and exercise old admin flows plus order filters,
pagination, non-navigating action menus, employee decline/accept, progress/cancellation,
internal note separation, chat archive, read-only permissions and mobile overflow.
Screenshots in `test-results/` are ignored artifacts; no debug routes or temporary components
are shipped.

To test the production build independently of the dev server:

```powershell
$env:ADMIN_TEST_PRODUCTION = '1'
npx playwright test --config playwright.admin.config.ts
Remove-Item Env:ADMIN_TEST_PRODUCTION
```

This starts the built app on port 3002 for the test run. The dev preview stays on port 3001.
Verification: production build generated 51 pages; all 14 admin browser tests passed on
the production build, and full-project lint completed with no errors or warnings.
