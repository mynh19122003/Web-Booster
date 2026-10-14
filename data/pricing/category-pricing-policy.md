# Category pricing

## Extension reviewed 2026-10-14

`category-rates.json` extends the existing commercial table using BoostRoyal's public calculator. Reproduce the observations with `collect-category-pricing.mjs`, `sample-category-rates.mjs`, then `build-category-rates.mjs`. Evidence is saved in `outputs/category-pricing-20261014/samples.json`. These scripts only request quotes; they never create orders.

- Flex 5v5: seven paired Solo/Flex division, win and placement quotes (Iron–Diamond) returned equal prices. Enable the existing Solo commercial rates and server factors for Flex. All 28 standard Flex division transitions were also checked. Existing commercial apex LP bands remain project policy.
- Champion mastery: collect nine adjacent steps from level 1 to 10. Step source prices are 2.97, 2.97, 5.94, 8.91, 11.88, 13.86, 14.85, 14.85 and 15.84 in the calculator's base currency. Scale these relative to its 1→7 quote of 46.53 and the project's existing USD51.99 package. Sum unrounded steps and round only the final server total. Aatrox and Ahri 1→7 quotes are equal; project policy applies the same level schedule to every recognized champion. Level 0 is excluded because the source returns a zero quote.
- Honor: 3→4 and 4→5 quote 142.2 and 206.1, with 16–21 and 19–25 days respectively. Scale against the source 3→5 quote348.3 and project USD389.99 package. Levels below 3 return zero at source, so the UI starts at level 3.
- LoL Player Diff challenges: store actual quote ratios for quantities 1–10, including source bulk discounts; preserve the project three-token USD6.99 price. Other challenge names still require review.
- LoL wins: store per-tier LP gain ratios for all eight source gain bands, Iron–Diamond. The UI offers supported gain choices and the source ratios scale the current project package. Existing default gain prices remain unchanged, including higher-tier packages.
- Normal Draft, Quickplay and ARAM: five-game source quotes all returned12.6; use the project's Normal Draft package for all three modes.
- All automatic category quotes now expose a price table using the same calculation as the summary. Progression tables show level steps; match tables show common quantities. Tables update with server, mode, champion and gain. Rank progression also exposes a per-division table. Optional priority remains +20%.

Sources: [BoostRoyal mastery](https://boostroyal.com/lol-boosting/champion-mastery), [Honor](https://boostroyal.com/lol-boosting/honor), [ranked wins](https://boostroyal.com/lol-boosting/ranked-wins), [challenges](https://boostroyal.com/lol-boosting/challenges), [normals](https://boostroyal.com/lol-boosting/normals), [rank boost](https://boostroyal.com/lol-boosting). Cross-check: [BoostRoom mastery](https://boostroom.com/product/lol-champion-mastery-boost) lists USD2.53 for1→2 and USD6.33 for2→3. These competitor prices are comparison evidence, not mixed into the project's rates.

Account categories retain inventory prices; custom account specifications and unsupported challenge types retain custom quotes. The checkout currently creates fulfillment requests rather than charging a live payment.

Reviewed on 2026-10-13 against BoostRoyal's public calculators:

- https://boostroyal.com/lol-boosting/ranked-wins
- https://boostroyal.com/lol-boosting/placements
- https://boostroyal.com/lol-boosting/battle-pass
- https://boostroyal.com/lol-boosting/soul-fighter
- https://boostroyal.com/lol-boosting/clash

The public pages vary by currency and selected configuration. Observed EU-West defaults were EUR12.99 for five Silver placement games, EUR8.99 for three Arena wins, and EUR46.99 for four Tier III Clash games with two boosters. These are reference observations, not replacements for the project's USD price table.

`project-prices.json` remains the commercial source of truth. Exact packages retain their price. Other match counts use package USD / package count × requested count. Ranked products use the existing per-tier rows for all divisions of that tier. Clash additionally scales by requested boosters / package boosters, within the quoted tier. Pass progression uses package USD / package level difference × purchased level difference as a project pricing policy; this is not a claim that BoostRoyal prices every level linearly.

Apply the existing server multipliers after calculating the base: NA ×1, KR ×1.2, other configured regions ×0.85. Round the final USD amount to cents. Express priority adds the existing 20%. The UI and checkout use this same resulting amount. Unsupported tiers, modes and products without a project rate continue to require a quote rather than receiving an invented price.

Valorant Daily challenges also prorate the existing five-challenge package. TFT first-place-only wins add 35% to the project's Top 4 base price, verified against https://boostroyal.com/tft-boosting/ranked-wins on 2026-10-13. All win conditions retain their own labels in the order summary and checkout.

Valorant Pro Games rates were verified after the source calculator hydrated on https://boostroyal.com/valorant-boosting/pro-duo: Ranked $5.99/game, Diamond $8.99, Ascendant $10.99, Immortal $12.99, Casual $2.99. See `valorant-duo-prices.json`. Apply project server factors and the existing 5% discount at three games / 10% at five or more; these discounts are project policy, not an assertion of source bulk prices. EUR uses the same USD-to-EUR conversion and rounding as LoL duo. Radiant player pricing remains unavailable because the source has no dedicated rate.

Swiftplay uses the same per-game price as Unrated, explicitly approved by the user on 2026-10-13; the source Unrated calculator has no separate Swiftplay rate. TFT Double Up placements use the project's existing per-rank placement rates: the source Mode selector supports Double Up and the observed Unranked five-game quote stays $14.99 when switching from Ranked to Double Up (https://boostroyal.com/tft-boosting/placements). This preserves the project's rank prices rather than importing LoL rates.
