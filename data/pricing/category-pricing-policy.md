# Category pricing

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
