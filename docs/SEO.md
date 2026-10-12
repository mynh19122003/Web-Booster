# SEO setup and launch

The project is prepared for technical SEO but has not been deployed or submitted
to search engines. Replace the example below with your real domain; `.example`
origins deliberately cannot enable indexing.

## 1. Configure the domain before building

```dotenv
NEXT_PUBLIC_SITE_URL=https://your-domain.example
SITE_INDEXABLE=false
# Optional HTML verification value from your Google Search Console property:
GOOGLE_SITE_VERIFICATION=
```

Use one canonical HTTPS origin, including `www` only if that is your chosen host.
Paths, credentials, query strings and fragments are rejected. Configure hosting
redirects from HTTP and alternate domains to that origin after connecting DNS
and TLS. These domain redirects depend on the hosting provider.

## 2. Review the preview

Keep `SITE_INDEXABLE=false` for local/staging deployments. Every public page then
emits noindex; `/sitemap.xml` is empty and `/robots.txt` does not advertise it.
Vercel Preview and Development deployments stay noindex even if the flag is true.
On other hosts, explicitly keep the flag false on staging. Noindex is crawler
guidance, not access control.

Review real business details, contact channels, sample coach profiles, fictional
reviews and short sample articles before launch. The implementation does not
invent review ratings, article authors or publication dates in structured data.

## 3. Launch production

Set `SITE_INDEXABLE=true` with the real public HTTPS origin and rebuild for
production. Keep both settings consistent at build time and server runtime:
static metadata is built once while the coach sitemap is generated dynamically.
Rebuild whenever the domain or indexing setting changes. Do not promote a
preview build unchanged because its generated pages retain noindex.

Cart, checkout, profile, login, messages, employee/admin pages, demo account
listings and the unfinished `/boosters` page remain noindex. These pages are
absent from the sitemap. Published coaches are included; unpublishing a coach
removes it from the next sitemap response. No fake modification dates are used.
The `/games/tft` alias permanently redirects (308) to `/games/teamfight-tactics`.

## 4. Verify the deployed HTML

Run `npm run test:seo`, `npm run lint`, `npm run typecheck` and `npm run build`.
With the built app running (`npm start`), run the local HTTP checks:

```bash
node scripts/audit-seo.mjs http://127.0.0.1:3000 http://localhost:3000
```

After launch, pass the deployed URL, canonical origin and `--indexable` instead.
The script checks rendered HTML, missing routes, redirects, robots, the social
image and each sitemap URL; its report is saved to `test-results/seo-http-audit.json`.

Then verify these responses on the actual deployment:

- Public pages: HTTP 200, unique title/description, correct HTTPS canonical,
  Open Graph/Twitter image and an index directive.
- `/cart`, `/checkout`, `/profile`, `/admin`: noindex and no inherited home canonical.
- `/games/tft?source=check`: HTTP 308 preserving the query string.
- A nonexistent game/service/article/coach: not-found response and noindex.
- `/sitemap.xml`: only canonical public URLs, including published coaches.
- `/robots.txt`: sitemap URL uses the real domain; no rule blocks crawling
  a page whose noindex directive must be read.
- Check social preview image loading and validate JSON-LD using Google's
  [Rich Results Test](https://search.google.com/test/rich-results).

Verify domain ownership in Search Console, submit `/sitemap.xml`, then inspect
representative URLs. If using DNS verification, no HTML verification token is
needed. Measure mobile Core Web Vitals on production with PageSpeed Insights
and Search Console; local tests cannot establish real-user performance.

## Language scope

The initial server-rendered content is English (`lang=en`). The existing VI/EN
switch changes client-side content on the same URL; it does not create separately
indexable Vietnamese pages. Therefore no misleading hreflang is emitted. To
target both languages, implement distinct locale routes such as `/vi/...` and
`/en/...`, server-render each translation, and add reciprocal hreflang entries
and localized sitemap alternates in a separate migration.

Technical checks do not guarantee ranking or rich-result eligibility. Guidance:
[Google noindex](https://developers.google.com/search/docs/crawling-indexing/block-indexing),
[localized URLs](https://developers.google.com/search/docs/specialty/international/localized-versions),
[structured data policies](https://developers.google.com/search/docs/appearance/structured-data/sd-policies).
