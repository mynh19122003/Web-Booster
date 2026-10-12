# Master development tasks — implementation and verification

Implemented the requirements from `gemini-code-1791636874954.md` using the existing application structure. The document's example paths were adapted to the files actually present in this repository.

| Task | Result |
| --- | --- |
| 001 | Verified the scheduling/goals container is absent; booking prices remain in the sidebar. |
| 002 | Shared `LanguageBadge` maps Korea/Korean/kr/ko and the other supported languages to existing SVG country flags, with a globe fallback. |
| 003 | Verified LoL's Iron package targets Bronze, with the corresponding rank artwork and Iron lobby/price. |
| 004 | Verified employee sessions hide the header cart; customers and guests retain it. |
| 005 | Header and employee dashboard provide optimistic availability switches. The authenticated, same-origin API persists employee presence in SQLite, supports employees without a coach, and synchronizes a single managed coach's availability. Chat reads the assigned employee's stored presence. |
| 006 | Required Riot ID/login/password fields appear below billing, support password visibility, and keep checkout disabled until native field validation succeeds. Credentials are encrypted on the server before persistence. |
| 007 | Customers see a direct chat header with booster name/presence. Assigned employees see private specifications and chat at a 5:7 desktop ratio; other employees cannot retrieve credentials. Mobile layouts stack the workspace. |
| 008 | Profile creation/editing use accessible checkbox pills with game-specific roles and language arrays. Existing additional selections remain editable. Saves deduplicate arrays and bound their size. |
| 009 | Offers/coaching appear above champion statistics and match history. Live/VOD are horizontal radio cards with icons, descriptions and active checks. |
| 010 | Published, linked LoL coaches receive top-five champion summaries from up to 30 queue-420 matches. Numeric champion IDs, games, wins and rounded win rates are computed from the linked player's participant only. |

## Champion statistics

`GET /api/riot/coach-stats?coach=<slug>` resolves the linked account entirely on the server. The specification's `puuid` plus `region` query also works, but only when it matches a published linked coach; arbitrary account lookups are rejected. Platform and regional routing values are accepted for that linked account.

Upstream Match-v5 requests use `cache: "force-cache"` and `next: { revalidate: 3600 }`, following the bundled Next.js fetch guide. Complete aggregates also persist for one hour in the authentication SQLite database; concurrent requests share one calculation. Cache identity includes platform, PUUID and Riot ID so account changes cannot reuse another account's summary. Public responses use `no-store` so publication/account changes are checked each time. They contain neither the API key nor PUUID.

Duplicate match IDs are counted once. Unexpected queues are excluded. Failed/incomplete fetches never save partial statistics. A previously complete result remains available with a stale-data message on refresh failure. Loading, unlinked, empty and unavailable states are explicit. Win-rate colors are green at 60%+, orange at 50%+, and red below 50%.

Live statistics require a verified linked Riot account and a valid server-only `RIOT_LOL_API_KEY` or `RIOT_API_KEY`. See the [Riot developer API reference](https://developer.riotgames.com/apis/) and [existing Riot setup notes](./employee-riot-data.md). Production credential storage requires `ORDER_CREDENTIALS_KEY`; see [checkout/order security](./checkout-order-workspace.md). Payments remain the existing checkout preview.

## Verification

- `npm run typecheck`: passed.
- `npm run lint`: passed with zero errors and zero warnings. Generated browser/data artifacts are excluded; source rules remain enabled.
- `npm run build`: passed.
- `npm run test:auth-riot`: 33 tests passed against isolated SQLite and mocked Riot HTTP, including aggregation, queue filtering, hourly cache, concurrency, publication gating, failure preservation, role access, encryption and CSRF checks.
- Playwright CLI on an isolated production server: validated checkout disabled/invalid/valid states, password visibility, encrypted order creation, profile checklist persistence, loaded Korean flag, synchronized/persisted header/dashboard availability, employee cart hiding, 5:7 order/chat layout, two-way customer/employee messages, customer private-data isolation, session radio selection/order, champion colors, and 390px mobile overflow checks.
- Statistics UI browser fixtures were mocked; no live Riot credentials were used for verification. Backend calculations were exercised with real route handlers and mock Match-v5 responses.

Screenshots are in ignored `output/playwright/master-*.png`. Test accounts and orders were created only in a temporary review database.
