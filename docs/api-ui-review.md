# UI review before API integration

Reviewed the route UI, shared forms/dialogs, account dashboard, shop, coach pages, home tracking, admin UI, and localization catalogs. This pass cleans customer-facing copy; it does not implement the backend or migrate stored records.

## Changes

- Removed repeated sample badges, sample-price captions, the catalog demo paragraph, and the listing implementation note. Account fixtures, prices, filters, detail views, and the quote-request flow remain intact.
- Removed coach checkout implementation notes and the tracking simulation caption. Existing coach metrics, reviews and tracking fixtures remain.
- Simplified wallet empty-state copy and removed browser-storage implementation details from Orders, saved plans, request confirmation and admin screens.
- Removed the empty business-information table and lengthy project-status explanations from About/Contact. Kept the independence notice and legal policies.
- Removed concept/demo descriptions from page intros and normalized Help center labels across supported languages.
- Removed the recruitment review-time promise while preserving its local reference number. Support confirmation still says that a message has not been sent; it must not claim delivery before the API exists.
- Google configuration errors use customer-facing language. The disconnected Riot sign-in button remains visible but is disabled.
- Validation, consent, quote confirmation, empty results, and error feedback remain visible.

## API handoff

| Area | Current source | Integration needed |
| --- | --- | --- |
| Account shop | `data/shop-accounts.ts` fixtures | Inventory endpoint with stable account IDs, ownership, availability and price |
| Champion catalog | Cached Riot Data Dragon, bundled fallback | Existing `/api/game-data/lol` provides champion definitions only |
| Skin filter | Account `cosmetics: string[]` names | Skin catalog + account-owned skin IDs; localized names are display values |
| Coach profiles | Coach fixtures + derived mock metrics | Profiles, availability, booking and coach assignment endpoints |
| Service requests / recruitment | `lib/local-records.ts`, browser storage | Authenticated server persistence, validation, status updates |
| Support form | Client validation only | Message-delivery endpoint and real success/error states |
| Wallet / messages / loyalty | Empty states | Service endpoints; no invented balance or transaction |
| Tracking / reviews | Tracking fixtures; review API plus fixture fallback | Real order progress and feedback source; disable fixture fallback for live customers |
| Admin | Local records and staff fixtures | Server-side authentication and role authorization before exposing real records |

## Skin ownership contract

The existing `cosmetics` array is retained for UI review. No ownership is inferred from the Riot skin catalog, and no fabricated skin-ID migration was performed.

Suggested inventory response for LoL:

```ts
type LolInventoryAccount = {
  id: string;
  ownedSkinIds: string[];
  ownedChampionIds: string[];
};
type LolSkinDefinition = {
  id: string;
  championId: string;
  names: Record<string, string>;
  imageUrl?: string;
};
```

Selection/filter matching should use `ownedSkinIds` against skin definition `id`. Name translation must not alter ownership or selected filter IDs. Keep catalog refresh separate from account inventory refresh. Existing saved records containing names need an explicit migration or adapter when the actual API is connected.

## Review environment

Mock fixtures are intentionally preserved. Removing their labels is a presentation change, not evidence that purchases, payments, messages or order fulfillment are connected. Before live release, switch data sources explicitly and check legal/operator/contact information in the legal pages.
