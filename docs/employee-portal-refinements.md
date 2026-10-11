# Employee portal refinements — 2026-10-10

Implemented tasks from `gemini-code-1791633806120.md` against the actual repository structure.

1. Removed the complete session planner from `CoachProfile`: date/time/timezone/goals/replay inputs, guidelines, their state and date validation. Booking still selects package, quantity and coaching format, then proceeds to checkout. Checkout omits empty schedule separators; optional legacy schedule details remain readable.
2. Extended the existing coach language flag lookup with normalized Korea/Korean/kr/ko and English/Vietnamese aliases. Reuses the existing `/images/flags/kr.svg` asset and accessible Next Image; unknown languages retain the globe fallback.
3. Corrected the first LoL duo bracket to Iron → Bronze. Existing per-game pricing/scaling and rank asset helpers are unchanged; the current configured Luna profile renders US$4.32/game.
4. Header cart is hidden for employee and retained for customers/guests. On small employee screens the search icon is hidden to leave room for the availability switch and navigation menu.
5. Added an optimistic, accessible header Online/Offline switch with pending protection and rollback on failure. GET/PATCH `/api/employee/status` checks session, employee role, same-origin for mutations, boolean input and exactly one manageable coach. It reuses prepared SQL persistence in `coach_profiles.online`, rather than creating a second availability source in a nonexistent `employees` table. Profile events, focus and visible-tab polling synchronize the switch with existing coach editing/public display. Accounts without one manageable coach continue using the per-coach controls.

## Verification

- Typecheck and production build passed.
- Auth/Riot suite: 29 passing tests, including real isolated SQLite and status handlers covering unauthorized/customer sessions, invalid origin/input, persistence, public profile consistency and access loss.
- Changed application files have no ESLint errors. Full `npm run lint` remains blocked by existing errors in generated QA files under `.data/`/`outputs/` and `ProfileSettings.tsx`; these unrelated files were not modified.
- Playwright inspected the actual public coach page: Korean flag, Iron → Bronze at US$4.32/game, and absent planner. Header interaction used mocked employee/session and status responses to exercise optimistic toggle, reload and failure rollback without modifying live project data. Backend persistence was verified independently with real SQLite tests.
- Mobile 390×844: cart absent; navigation right edge 374px within viewport 390px. Existing Next image/Three warnings were observed; simulated API failures are intentional QA responses.
