# Vietnamese layout and interaction audit

Implemented from `gemini-code-1791764019079.md` on 2026-10-12.
Existing working-tree changes were preserved.

## 1. Fonts and typography

- Kept Plus Jakarta Sans with its existing Vietnamese subset and `display: swap`.
- Added the Vietnamese subset to Inter.
- Rajdhani only supports `devanagari`, `latin`, and `latin-ext` in this installed Next.js version. Vietnamese headings use Plus Jakarta Sans through the locale-aware heading token instead of requesting an unsupported subset.
- Applied safe Vietnamese heading line height and corrected checkout heading/legend references to use the locale-aware token.

## 2. Layout corrections

- Service tabs, segmented controls, region labels, and CTAs can wrap and grow vertically.
- Duo packages use content-sized rows, responsive columns, and an in-flow featured badge. Prices and package names have separate space.
- Existing 24px top padding and visible overflow on coach attributes were retained.
- Summary labels and values use two flexible columns with wrapping.
- Riot ID/server controls stack on narrower screens. The employee edit title aligns its icon with one wrapping text block.
- No stray standalone “Public profile” heading existed in the editor. The useful public-profile action link remains.
- Employee navbar controls fit at 320px: availability has a compact, accessible switch and currency remains available in preferences.
- The avatar stays square while translated upload instructions wrap.
- The mobile support widget sits above the fixed service checkout bar.

## 3. Interactions

- Shared Motion card feedback: 4px lift, 1.015 hover/focus scale, 0.98 press scale, 200ms ease-out.
- Applied to service/game cards, coach directory cards, duo packages, and champion rows; added focus/hover highlights and CTA feedback.
- Scoped layout indicators for coach booking modes, service categories/plans, catalog games, and match filters. Currency indicators respect reduced motion.
- Staggered entry for Riot matches, support/order requests, and admin request rows; champion lists retain staggered entry.
- Champion win-rate bars animate to their bounded percentage, including updates.
- Locale dropdowns, the shared dialog, and the avatar cropper have entry/exit transitions. The region picker retains its existing native-dialog transitions and focus behavior.
- Profile saving displays a spinner with disabled and busy states. Existing Riot synchronization loading/disabled behavior is retained.
- The shared language provider applies `MotionConfig reducedMotion="user"`; new transforms, delays, and CSS press effects also honor reduced motion.

## 4. Verification

- `npm run build`: passed (65 generated pages).
- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `git diff --check`: passed.
- Browser EN/VI checks at 320, 390, 768, and 1440px: service catalog, Luna profile, LoL duo configuration, checkout, and employee profile editor. No document horizontal overflow or clipping in the measured target controls/cards/summary rows.
- Explicit navbar bounding-box check: all visible controls fit at all four widths.
- Visually reviewed desktop/mobile Vietnamese screenshots under `output/playwright/`.
- Switched locale through the menu and switched between duo/coaching tabs.
- Avatar cropper opened at mobile width; Escape dismissed it and returned focus to Upload photo. No photo was saved.
- Shared native dialog opened and dismissed with Escape with both normal and reduced motion.
- Browser-only champion fixtures verified 60%/50% bars; reduced motion produced no card transform. This validates presentation, not live Riot API availability.
- The fixed mobile checkout bar and support widget no longer overlap.
- Employee checks used a separate temporary SQLite database and test session, not existing account records.

The Windows sandbox initially prevented Next.js/SWC from resolving the workspace path. The build succeeded outside that sandbox. Browser warnings included existing Three.js deprecation and CSS preload warnings; the final inspected pages had no console errors. These checks cover the affected flows and shared components, not every possible route/data combination.
