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

## UI experience review — 21 October 2026

Scope: presentation only. This pass changes shared CSS, its layout import, and
the navigation header's styling classes. API, pricing, authentication, state,
form submission and other business behavior are unchanged.

## Findings and changes

- Header buttons and coach filters measured 36px high on mobile. Increase these
  targets to 44px; give FAQ questions and password visibility controls the same
  minimum height.
- Large panels used stacked backdrop blur and 160px blurred decorative glows.
  Replace these with opaque gradient surfaces; remove fixed background attachment
  and the navigation header's blur to reduce scrolling paint/compositing work.
- Mobile sign-in introduced a large branding panel before the form. Compact that
  panel and spacing. At 390px viewport width the email field moves from roughly
  700px to 558px from the top of the page.
- Use 16px text in mobile fields to avoid focus zoom on iOS. This behavior still
  needs verification on an actual iOS device.
- Add focus-within outlines around composite fields, allow breadcrumb wrapping,
  and respect reduced motion in employee/admin workspace styles.

## Verification

- Browser review of public navigation, home, services, coaches, account, cart,
  checkout, login, contact, support, about, blog, reviews, careers, and admin and
  employee login pages.
- Home, services, coaches and login layouts checked at viewport widths 320, 390,
  768 and 1440px. No document-level horizontal overflow in these checks.
- Mobile navigation opens and closes. Header computed backdrop-filter is none.
  FAQ controls measure at least 44px; reduced-motion sets scroll behavior to auto.
- TypeScript and ESLint checks for the modified layout/navigation pass.
- Screenshots are under output/playwright/refined-*.

## Limits

- Authenticated customer/admin/employee views were reviewed through shared styles
  and source only. Populated orders, checkout, messages and staff workflows need
  a signed-in session with representative data for visual verification.
- No before/after FPS benchmark was recorded; these changes remove identified
  rendering costs but do not establish a measured performance improvement.
- Existing missing React list keys and unauthenticated API responses were left
  for a separate functional review.

FAQ follow-up: replaced height animation with opacity/transform entry and stable row padding. In a local dev run of 12 interactions, LayoutCount fell from 269 to 58 and LayoutDuration from 120ms to 22ms. Desktop/mobile opening, closing, rapid switching, topic selection and reduced motion passed. These are local rendering-cost measurements, not a production FPS benchmark.
