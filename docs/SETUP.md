# Local preview

Run `npm install` then `npm run dev` with Node.js 22 or newer.

## Routes

- `/services`: game-specific service catalog.
- `/services/[slug]?game=valorant`: preselect a game and service.
- `/careers`: recruitment application form.
- `/about` and `/contact`: business disclosures and support-channel status.
- `/legal/terms`, `/legal/privacy`, `/legal/refund`, and
  `/legal/delivery-service`: demo policies and disclosures.
- `/admin`: local records workspace with filtering, status updates, details,
  deletion confirmation and JSON export.

Applications and service requests use browser localStorage and remain local to
the submitting browser. Account registration and password login use server-side
mock data that resets when the server restarts. Passwords are scrypt-hashed and
sessions are stored as token hashes in memory with HTTP-only cookies. This preview
setup is not suitable for production accounts or durable orders. Admin is
not protected by account authentication, and email delivery/payment integration
is not connected.

### Google sign-in

Email/password accounts work immediately. To enable Google OAuth, create a web
OAuth client and set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and optionally
`GOOGLE_REDIRECT_URI` in `.env.local`. The callback URL must be registered with
Google; for local development it is `http://localhost:3000/api/auth/google/callback`.
Riot sign-in is intentionally a UI-only preview and is not connected to Riot OAuth.

## Currency

`/api/exchange-rate` fetches the daily EUR/USD reference rate from Frankfurter v2.
The server caches successful responses for one hour. The browser keeps the last
successful rate and explicitly marks it as cached if the provider is unavailable.
No estimated exchange rate is substituted. Without a rate, EUR checkout is
disabled; USD remains available. Prices are illustrative service estimates.

## Production SEO

Set `NEXT_PUBLIC_SITE_URL` to the site's actual HTTPS origin and enable
`SITE_INDEXABLE=true` only when launching production, then rebuild. Local and
unconfigured sites are noindex with an empty sitemap; Vercel previews cannot
enable indexing. Private pages, demo account listings and the unfinished booster
roster stay noindex. Robots allows crawling their noindex directives and blocks
API routes. See [SEO.md](SEO.md) for the full launch checklist and language scope.
