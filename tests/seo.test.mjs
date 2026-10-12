import assert from "node:assert/strict";
import { test } from "node:test";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import ts from "typescript";

const root = resolve(import.meta.dirname, "..");
function loader(env = {}, mocks = {}) {
  const loaded = new Map();
  return function load(relative) {
    const path = resolve(root, relative);
    if (loaded.has(path)) return loaded.get(path).exports;
    const loadedModule = { exports: {} };
    loaded.set(path, loadedModule);
    const require = createRequire(path);
    const scopedRequire = id => id in mocks ? mocks[id] : id.startsWith("@/")
      ? load(`${id.slice(2)}.ts`) : require(id);
    const javascript = ts.transpileModule(readFileSync(path, "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText;
    new Function("require", "module", "exports", "process", javascript)(scopedRequire, loadedModule, loadedModule.exports, { env });
    return loadedModule.exports;
  };
}

test("canonical origin is normalized and invalid configurations fail explicitly", () => {
  const { resolveSiteUrl } = loader()("lib/site-url.ts");
  assert.equal(resolveSiteUrl(undefined), "http://localhost:3000");
  assert.equal(resolveSiteUrl(" https://WWW.ASCEND.COM/ "), "https://www.ascend.com");
  for (const value of ["example.com", "ftp://example.com", "https://user:pass@example.com", "https://example.com/blog", "https://example.com/?x=1", "https://example.com/#x"])
    assert.throws(() => resolveSiteUrl(value));
});

test("only an explicitly enabled public HTTPS deployment can be indexed", () => {
  const { canIndexSite } = loader()("lib/indexing.ts");
  assert.equal(canIndexSite("https://ascend.com", "true", "production"), true);
  for (const origin of ["http://ascend.com", "https://localhost", "https://127.0.0.1", "https://192.168.1.2", "https://app.local", "https://app.test", "https://app.example"])
    assert.equal(canIndexSite(origin, "true"), false, origin);
  for (const value of [undefined, "false", "TRUE"])
    assert.equal(canIndexSite("https://ascend.com", value), false);
  assert.equal(canIndexSite("https://ascend.com", "true", "preview"), false);
  assert.equal(canIndexSite("https://ascend.com", "true", "development"), false);
});

test("page metadata preserves its canonical and private pages stay noindex at launch", () => {
  const load = loader({ NEXT_PUBLIC_SITE_URL: "https://ascend.com", SITE_INDEXABLE: "true" });
  const { metadata, privateRobots } = load("lib/seo.ts");
  const page = metadata("Coaching", "Personal coaching", "/services/coaching");
  assert.equal(page.alternates.canonical, "/services/coaching");
  assert.equal(page.openGraph.url, "/services/coaching");
  assert.equal(page.robots.index, true);
  assert.equal(privateRobots.index, false);
  assert.equal(loader()("lib/seo.ts").metadata("Home", "Description").robots.index, false);
});

test("sitemap and robots expose only launch-ready public routes", () => {
  const mocks = { "@/lib/coach-ownership": { publicCoachBases: () => [{ slug: "published-coach" }] } };
  const load = loader({ NEXT_PUBLIC_SITE_URL: "https://ascend.com", SITE_INDEXABLE: "true" }, mocks);
  const urls = load("app/sitemap.ts").default().map(entry => entry.url);
  assert.ok(urls.includes("https://ascend.com/coaches"));
  assert.ok(urls.includes("https://ascend.com/coaches/published-coach"));
  assert.ok(urls.includes("https://ascend.com/games/teamfight-tactics"));
  assert.equal(new Set(urls).size, urls.length);
  for (const path of ["/games/tft", "/cart", "/checkout", "/profile", "/admin", "/employee", "/account", "/boosters"])
    assert.ok(!urls.includes(`https://ascend.com${path}`), path);
  assert.equal(load("app/robots.ts").default().sitemap, "https://ascend.com/sitemap.xml");
  assert.ok(!load("app/robots.ts").default().rules.disallow.includes("/admin"));
  const local = loader({}, mocks);
  assert.deepEqual(local("app/sitemap.ts").default(), []);
  assert.equal(local("app/robots.ts").default().sitemap, undefined);
});

test("JSON-LD keeps text intact without allowing script termination", () => {
  const { serializeJsonLd } = loader()("lib/json-ld.ts");
  const data = { name: '</script><script>alert("x")</script>', description: "Tiếng Việt & coaching" };
  const encoded = serializeJsonLd(data);
  assert.ok(!encoded.includes("<"));
  assert.deepEqual(JSON.parse(encoded), data);
});
