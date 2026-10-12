import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";

// Usage: node scripts/audit-seo.mjs <base-url> <canonical-origin> [--indexable]
const base = process.argv[2] || "http://127.0.0.1:3000";
const origin = new URL(process.argv[3] || "http://localhost:3000").origin;
const indexable = process.argv.includes("--indexable");
const paths = ["/", "/services", "/services/coaching?game=valorant", "/games/valorant", "/games/teamfight-tactics", "/blog/build-a-better-warmup", "/coaches", "/cart", "/checkout", "/profile", "/admin", "/account/109084", "/boosters"];
const privatePaths = new Set(["/cart", "/checkout", "/profile", "/admin", "/account/109084", "/boosters"]);
const results = [];
const request = path => fetch(new URL(path, base), { headers: { "user-agent": "Twitterbot/1.0" } });
for (const path of paths) {
  const response = await request(path);
  const html = await response.text();
  const title = html.match(/<title>(.*?)<\/title>/)?.[1];
  const canonicals = [...html.matchAll(/<link rel="canonical" href="([^"]+)"/g)].map(m => m[1]);
  const robots = [...html.matchAll(/<meta name="robots" content="([^"]+)"/g)].map(m => m[1]);
  const schema = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g)].map(m => JSON.parse(m[1]));
  assert.equal(response.status, 200, path);
  assert.ok(title, `${path}: title`);
  assert.ok(robots.length, `${path}: robots`);
  assert.equal(robots.some(value => value.includes("noindex")), !indexable || privatePaths.has(path), `${path}: indexing`);
  if (!privatePaths.has(path)) {
    assert.deepEqual(canonicals, [origin + (path === "/" ? "" : path.split("?")[0])], `${path}: canonical`);
    assert.ok(/<meta name="description" content="[^"]+"/.test(html), `${path}: description`);
    assert.ok(html.includes('property="og:image"'), `${path}: social image`);
  } else if (!["/admin", "/boosters"].includes(path)) assert.equal(canonicals.length, 0, `${path}: inherited canonical`);
  if (path.startsWith("/blog/")) assert.ok(schema.some(s => s["@type"] === "BlogPosting"));
  results.push({ path, status: response.status, title, canonicals, robots, schemas: schema.map(s => s["@type"]) });
}
const redirect = await fetch(new URL("/games/tft?source=check", base), { redirect: "manual" });
assert.equal(redirect.status, 308);
assert.ok(redirect.headers.get("location").endsWith("/games/teamfight-tactics?source=check"));
for (const path of ["/games/no-such-game", "/services/no-such-service", "/blog/no-such-article", "/coaches/no-such-coach"]) {
  const response = await request(path);
  const html = await response.text();
  assert.equal(response.status, 404, path);
  assert.ok(html.includes("noindex"), path);
  results.push({ path, status: response.status, noindex: true });
}
const robots = await (await request("/robots.txt")).text();
assert.ok(robots.includes("Disallow: /api/"));
assert.ok(!robots.includes("Disallow: /admin"));
assert.equal(robots.includes(`Sitemap: ${origin}/sitemap.xml`), indexable);
const sitemap = await (await request("/sitemap.xml")).text();
const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1]);
assert.equal(urls.length > 0, indexable);
assert.equal(new Set(urls).size, urls.length);
for (const url of urls) {
  assert.equal(new URL(url).origin, origin);
  const path = new URL(url).pathname;
  assert.ok(!privatePaths.has(path) && path !== "/games/tft", `Excluded sitemap route: ${path}`);
  const response = await request(path);
  assert.equal(response.status, 200, `Sitemap URL: ${path}`);
  const html = await response.text();
  assert.ok(!/<meta name="robots" content="[^"]*noindex/.test(html), `Indexable sitemap URL: ${path}`);
}
const image = await request("/opengraph-image");
assert.equal(image.status, 200);
assert.ok(image.headers.get("content-type").includes("image/png"));
mkdirSync("test-results", { recursive: true });
writeFileSync("test-results/seo-http-audit.json", JSON.stringify({ base, origin, indexable, results, robots, sitemap, redirect: redirect.headers.get("location") }, null, 2));
console.log(`SEO HTTP audit passed: ${results.length} pages, ${urls.length} sitemap URLs, 308 redirect, robots and social image.`);
