# UI review — 10 October 2026

## Changes

- Authentication pages render directly, without the shared opacity entrance animation or nested `main` elements. Their backgrounds are opaque and do not use nested backdrop blur, reducing compositing changes around the login form.
- Mobile login reserves space above the card so the Back to home button does not overlap the logo. Customer login, registration and employee login share these fixes.
- Rank selection displays static artwork only. The promotion playback state, timers and video component import were removed from `RankPicker`. Master, Grandmaster and Challenger retain the existing PNG artwork; other tiers retain their static rank emblems. Selection, LP controls and pricing remain functional.
- The shared storefront owns one focusable `main#main`. Checkout, profile and account content use ordinary containers, removing duplicate main landmarks and IDs.
- Header guest controls wait until session lookup completes, so employees do not briefly see the customer cart or sign-in trigger on page load.

## Review scope and results

Chrome via Playwright CLI, at 1440×1000 and 390×844:

- Reviewed home, customer login, registration, employee login, services, rank boost, the three game pages, booster roster, coach directory, Luna profile, cart, checkout, messages, support, profile, wallet and reviews: 38 route/viewport combinations.
- Reviewed signed-in customer profile and messages at mobile width.
- Reviewed employee dashboard, coach setup and Riot workspace at both widths: 6 additional combinations.
- No horizontal document overflow, nested main landmarks or uncaught JavaScript rendering exceptions were found in the checked routes after the fixes.
- Selected Master, Grandmaster and Challenger interactively. Each PNG decoded successfully, no `video` element rendered, and no WebM/MP4 request was made.
- Login remained fully opaque over sampled animation frames; it had no route-animation wrapper, scene loader or WebGL canvas. Password visibility and login/register switching worked. The mobile back button did not overlap the logo. Axe reported no violations in the authentication page checked.
- Employee cart hiding was checked after session loading. With an artificially delayed session lookup, the final header showed neither guest cart nor sign-in controls before the employee session arrived; the guest cart still appeared correctly after an anonymous lookup.
- `npm run typecheck`, `npm run lint` and the production build passed. Lint reported zero warnings.

Screenshots are saved under ignored `output/playwright/ui-review-*.png`. Review accounts/database were isolated from the normal development database. This review covers the listed routes and interactions; it does not claim exhaustive testing of every browser, GPU or all authenticated account states.
