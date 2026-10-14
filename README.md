# ASCEND

An original premium gaming service concept, built with Next.js App Router, React, strict TypeScript, Tailwind CSS, React Three Fiber, Three.js, drei, GSAP ScrollTrigger, Motion, Lucide, and Zustand. No BoostRoyal assets, copy, or branding are used.

## Run locally

Requires Node.js 20.9+ (tested with Node 24).

```bash
npm install
npm run dev
```

Open http://localhost:3000. For the production server:

```bash
npm run lint
npm run typecheck
npm run build
npm start
```

### Realtime chat

`npm run dev` and `npm start` use `server.mjs`, which serves Next.js and Socket.IO on the same port. `/messages` uses a Messenger-style UI with conversation search, grouped bubbles, emoji selection and connection status. Start with `npm run dev -- --hostname 127.0.0.1 --port 3100` to use a different local port.

`NEXT_PUBLIC_PUBLIC_DATA_SOURCE=api` is the only supported runtime source. The existing customer session and request routes store records in server memory and reset on restart. Admin API adapters and payment processing are not connected; those features report unavailable.

For the two-port preview, user port 3101 and employee port 3102 both connect to Socket.IO on port 3101. Outside this local setup, set `NEXT_PUBLIC_CHAT_SOCKET_URL` for both frontends and `CHAT_ALLOWED_ORIGINS` on the socket server. In `api` mode, sessions use the existing cookie-backed request endpoints; employee membership is rechecked on joins and sends, and broadcasts target the current participants.

The `/api/mock/*` endpoints return 404. Checkout returns 503 until a payment provider and order API are connected. Employee workspace data is empty until its API adapter is implemented.

Chat requires a persistent Node server that supports WebSocket upgrades. For production, run `npm run build` followed by `npm start`, and set `CHAT_ORIGIN` to the public HTTPS origin when using a reverse proxy. The Vercel deployment instructions below cover the frontend only; Vercel serverless hosting does not run this custom Socket.IO server.

## Architecture

- `app/`: server-rendered pages, metadata, robots, sitemap, and static route generation.
- `components/home/`: hero, game discovery, configurator, tracking dashboard, feature demos, trophy break, reviews, player cards, security diagram, process, FAQ, and final CTA.
- `components/layout/`: responsive sticky header, searchable game navigation, mobile menu, and footer.
- `components/three/`: one dynamically imported persistent canvas; shared rank crystal, procedural environment lighting, rings, particles, and scroll assembly system.
- `components/ui/`: accessible native dialogs, route fades, initial scene status, pointer effects, page intros, and local support form.
- `data/`: typed games, services, reviews, fictional profiles, FAQs, and original articles.
- `store/`: transient UI/configuration state with Zustand. Only explicitly saved demo plans enter localStorage.
- `lib/`: shared estimate calculation and metadata helpers.
- `tests/`: production browser flows, all eight requested viewport sizes, and axe WCAG audits.

## Pages

Home; ten `/games/[slug]` pages; four `/services/[slug]` pages; `/boosters`; `/reviews`; `/blog`; three original `/blog/[slug]` articles; `/support`; `/legal/privacy`; `/legal/terms`; custom 404; robots and sitemap.

## Interactions

Game selection, horizontal discovery track, search, responsive game menu, current/desired rank sliders with enforced increasing targets, Solo/Duo pricing, region/role/preferences, review dialog, save/retrieve demo plans, native dialog focus trapping and Escape dismissal, FAQ accordion, privacy switch, sample chat exchange, simulated match progression, rewards tiers, and locally validated support form.

The rank configurator intentionally uses a shared illustrative rank model across games. Pricing is a demonstration, not a commercial offer. Login is a local-plan viewer: authentication, actual purchases, payment processing, real-time match feeds, support delivery, and account access are not connected. Reviews and player records are explicitly fictional. Connect and validate these integrations before accepting real customers.

## 3D and animation

The original artifact uses extruded beveled wings, faceted metallic geometry, emissive details, orbital rings, floating shards, and a single Points particle buffer. An original pre-baked studio reflection map is applied with drei Environment; there are no remote HDRI dependencies or expensive runtime reflection filtering. The artifact reacts subtly to pointer movement and scroll; the trophy section assembles its wings with ScrollTrigger. The final CTA reuses the same scene.

GSAP handles viewport entrances and the process connector; Motion handles route fades, FAQ expansion, and dashboard progress. CSS handles restrained gradient movement, security orbits, and review drift. A desktop pointer halo, magnetic CTA, and small card tilt complete the interaction layer. The initial nonblocking scene indicator is capped at 1.5 seconds and never delays content or navigation.

## Performance

Static pages; idle-priority WebGL chunk; one canvas reused across three sections; decorative rendering capped at 30 fps and paused when its sections are offscreen or the tab is hidden; demand rendering for reduced motion; DPR capped at 1.25 desktop / 1 mobile; 100 / 35 particles in one buffer; one small local prefiltered environment asset; no model downloads, postprocessing, or external font requests. Below-the-fold trophy geometry is reused rather than starting extra renderers. Primary content is visible in the initial HTML; route fades do not hide it on first load.

## SEO and accessibility

Public pages have titles, descriptions, canonical URLs and social previews, plus Organization, Service, BlogPosting, FAQ and Breadcrumb JSON-LD. Indexing is disabled until launch: set `NEXT_PUBLIC_SITE_URL` to the actual HTTPS origin and `SITE_INDEXABLE=true`, then rebuild. Without configuration, URLs use `http://localhost:3000`, pages are noindex and the sitemap is empty. Vercel previews stay noindex. See [the SEO launch guide](docs/SEO.md) for setup, verification and current language limitations.

Semantic headings and landmarks, keyboard-operable controls, visible focus rings, skip navigation, native modal focus management, named inputs, rank value text, live quote announcements, and reduced-motion handling. Canvas content is decorative and hidden from assistive technology. See `docs/VERIFICATION.md` for measured checks and limitations.

## Assets

All graphical assets are original procedural work:

- `public/icon.svg`: ASCEND favicon/emblem.
- `app/opengraph-image.tsx`: generated PNG social card for crawler compatibility.
- `public/textures/ascend-environment.bin.gz` and `data/environment.json`: original 336×256 half-float prefiltered reflection texture and dimensions, served with gzip encoding (about 60 KB transferred). Rebuild with `node scripts/generate-environment.mjs`.
- `components/three/RankCrystal.tsx`: procedural 3D artifact; no GLB needed.
- `components/three/GamePortal.tsx`: original orbital geometry.
- `components/three/FloatingParticles.tsx`: deterministic particles.
- `app/globals.css`: original game emblems, masked player silhouettes, lighting/grid/noise, and UI artwork.

Remaining placeholders: game emblems and player silhouettes are clearly labeled original concept art, not licensed game characters. Player statistics, reviews, timelines, and estimates need genuine verified data for a live business. Social destinations and legal notices need operator-specific details. No fabricated review ratings are included in structured data.

## Tests and audits

```bash
npm run test:e2e
npm run audit:lighthouse
```

Playwright uses locally installed Microsoft Edge on Windows. On other systems, install Chromium with `npx playwright install chromium` and set `PLAYWRIGHT_BROWSER=chromium`. Lighthouse accepts `CHROME_PATH` for a browser executable override. Screenshots and raw reports are written to ignored `test-results/` and can be regenerated.

## Vercel deployment

1. Push this project to your repository and import it into Vercel as a Next.js project.
2. Use Node.js 24, install command `npm ci`, build command `npm run build`, and the default Next.js output setting.
3. Set `NEXT_PUBLIC_SITE_URL` to your actual HTTPS domain. Keep `SITE_INDEXABLE=false` in Preview and enable it only for the production launch.
4. Deploy a preview, check metadata and interactive flows, then rebuild for Production with `SITE_INDEXABLE=true`; do not promote a noindex preview build unchanged.

No deployment or external service provisioning is performed by this project. No secrets are required for the current demo.
