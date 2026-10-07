Rank emblems are Riot Games assets distributed by community asset projects.

- Valorant: https://valorant-api.com/v1/competitivetiers
  Episode 5 rank table includes Ascendant. Individual tier icons are stored locally.
- League of Legends / Teamfight Tactics:
  https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/images/ranked-emblem/

Valorant uses tiers 1, 2 and 3 below Radiant. League/TFT use IV, III, II and I
below Master. Master, Grandmaster, Challenger and Radiant have no divisions.

League source canvases are 1280x720 or 2560x1440 and contain transparent padding.
Originals remain in `league/` and `valorant/`; tightly trimmed WebP copies in
`cards/` are used on coach cards so the visible emblems have a comparable optical
size. Valorant copies use the same treatment to keep the card presentation
consistent. Profile detail pages continue to use the original assets.
Selected rank emblems display at 104-112px; rank options display at 64-68px.
