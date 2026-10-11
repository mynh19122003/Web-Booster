# Coach match history

The server reads `RIOT_API_KEY` from `.env` or `.env.local` locally or your hosting provider's secret environment variables in production. Never prefix it with `NEXT_PUBLIC_` or commit the key. Restart the server after changing it. `.env.local` is ignored by Git.

An API key does not identify a coach. Sign in as an employee, open `/employee/coaches`, and enter each coach's own Riot ID (`Name#Tag`) and platform. The server verifies Account V1 and the game's Summoner endpoint before saving the PUUID to SQLite. These are staff-managed links, not proof of Riot account ownership. Only publish a coach's account with their consent.

Use **Sync Riot API** to look up a LoL/TFT account and display its latest twenty matches directly in the employee form. This accepts one `Name#Tag` field, trims surrounding spaces and uses Account V1 active region to select the platform. The lookup does not persist a coach link. **Save coach link** verifies and saves the account separately. Employee-only `POST /api/employee/riot/history` returns normalized match history without exposing PUUID or credentials.

Coaching profiles fetch `/api/coaches/[slug]/matches`. League of Legends uses Match V5 and TFT uses Match V1. The latest twenty matches supply real outcomes, timestamps, duration, League KDA/champions or TFT placements. The rank card reads League V4/TFT League V1 entries by PUUID and displays LP, wins, losses and win rate. League rows include champion level, items, CS, gold and damage; mode filters use queue IDs. League custom games (queue 0) are excluded. No sample matches are used as a fallback. Other existing coaching statistics and reviews remain marked as demo data.

Match and rank results are cached for five minutes per account (one minute when only the rank fetch failed). A failed rank request preserves match history and is not presented as an unranked account. Concurrent lookups share one request. Errors are cached for their retry interval. A process-wide conservative development-key budget and Riot's `Retry-After` avoid repeated bursts. Multiple production server processes require a shared rate limiter/cache sized for your approved key.

Development keys expire; replace an expired key server-side. A key accepted for League does not guarantee access to TFT. Missing/rejected keys, rate limits, network failure and unlinked accounts have explicit UI states. Public Valorant coach match history remains disconnected; the employee data console at `/employee/riot` now supports Valorant APIs and Riot Sign On for the employee's own opted-in account. See [employee Riot setup](./employee-riot-data.md) for game keys, RSO configuration and the complete GET endpoint catalog.

Employee APIs enforce server-side employee roles and same-origin mutations. The public endpoint accepts a known coach slug, never an arbitrary account lookup, and returns neither the API key nor PUUID.

References: [League API](https://developer.riotgames.com/docs/lol), [TFT API](https://developer.riotgames.com/docs/tft), [Valorant API](https://developer.riotgames.com/docs/valorant), [Developer Portal](https://developer.riotgames.com/docs/portal).
