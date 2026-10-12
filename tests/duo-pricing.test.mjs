import assert from "node:assert/strict";
import { test } from "node:test";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import ts from "typescript";

const root = resolve(import.meta.dirname, "..");
const loaded = new Map();
function load(relative) {
  const path = resolve(root, relative);
  if (loaded.has(path)) return loaded.get(path).exports;
  const loadedModule = { exports: {} };
  loaded.set(path, loadedModule);
  const require = createRequire(path);
  const scopedRequire = id => id.startsWith("@/")
    ? id.endsWith(".json") ? require(resolve(root, id.slice(2))) : load(`${id.slice(2)}.ts`)
    : require(id);
  const javascript = ts.transpileModule(readFileSync(path, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  new Function("require", "module", "exports", javascript)(scopedRequire, loadedModule, loadedModule.exports);
  return loadedModule.exports;
}
const { calculateDuoPrice, DUO_PRICING_TABLE, DUO_RANK_OPTIONS, SERVER_MULTIPLIERS } = load("lib/pricing/duo-pricing-matrix.ts");
const { categoryQuote, serverPrice, projectPackages } = load("lib/project-pricing.ts");
const { estimateQuote } = load("lib/quote.ts");
const { rankLevelsFor } = load("lib/service-options.ts");
const input = { rank: "Silver IV", server: "NA", gameCount: 1, currency: "USD", queueType: "ranked" };
const quote = overrides => calculateDuoPrice({ ...input, ...overrides });
const category = overrides => categoryQuote({ game: "league-of-legends", product: "games", region: "NA", queue: "Duo", rank: "Silver IV", quantity: 5, start: 0, goal: 0, detail: "", winType: "top4", clashTier: "", clashBoosters: 0, ...overrides });

test("matrix covers every division and high rank with the documented group prices", () => {
  assert.equal(DUO_RANK_OPTIONS.ranked.length, 28);
  for (const rank of DUO_RANK_OPTIONS.ranked) {
    const expected = ["Diamond II", "Diamond I"].includes(rank) ? 14.99 : /^(Emerald|Diamond) /.test(rank) ? 8.99 : 5.99;
    assert.equal(quote({ rank }).basePricePerGame, expected);
    assert.ok(DUO_PRICING_TABLE[rank].EUR > 0);
  }
  for (const rank of DUO_RANK_OPTIONS.high_elo)
    assert.equal(quote({ rank, queueType: "high_elo" }).finalPrice, 17.99);
  assert.equal(quote({ rank: "ignored", queueType: "normal" }).finalPrice, 2.99);
});

test("server factors follow the user's example and apply to every supported server", () => {
  assert.equal(serverPrice(10, "NA"), 10);
  assert.equal(serverPrice(10, "KR"), 12);
  assert.equal(serverPrice(10, "toString"), 8.5);
  for (const [server, multiplier] of Object.entries(SERVER_MULTIPLIERS)) {
    const expected = server === "NA" ? 1 : server === "KR" ? 1.2 : 0.85;
    assert.equal(multiplier, expected);
    assert.equal(serverPrice(10, server), 10 * expected);
    assert.equal(quote({ server }).basePricePerGame, server === "NA" ? 5.99 : server === "KR" ? 7.19 : 5.09);
  }
  assert.equal(quote({ server: "EUW", gameCount: 5 }).finalPrice, 22.9);
  assert.equal(quote({ server: "KR", gameCount: 5 }).finalPrice, 32.35);
});

test("all bulk boundaries and cent rounding produce consistent totals", () => {
  const expectations = [[1,0,5.99],[2,0,11.98],[3,5,17.07],[4,5,22.76],[5,10,26.95],[20,10,107.82]];
  for (const [gameCount, percent, final] of expectations) {
    const result = quote({ gameCount });
    assert.equal(result.discountPercent, percent);
    assert.equal(result.finalPrice, final);
    assert.equal(Math.round((result.totalRawPrice - result.discountAmount) * 100), Math.round(final * 100));
  }
});

test("EUR follows the supplied rate and converted line items add up to the final price", () => {
  const usd = quote({ gameCount: 5 });
  for (const usdPerEur of [1.1, 1.12049503, 1.25]) {
    const eur = quote({ gameCount: 5, currency: "EUR", usdPerEur });
    assert.equal(eur.finalPrice, Math.round((usd.finalPrice / usdPerEur + Number.EPSILON) * 100) / 100);
    assert.equal(Math.round((eur.totalRawPrice - eur.discountAmount) * 100), Math.round(eur.finalPrice * 100));
  }
  for (const usdPerEur of [undefined, null, 0, -1, NaN, Infinity])
    assert.throws(() => quote({ currency: "EUR", usdPerEur }), RangeError);
});

test("invalid inputs never become automatic zero-price quotes", () => {
  for (const overrides of [
    ...[0,21,1.5,NaN,Infinity].map(gameCount => ({ gameCount })),
    { rank: "Silver" }, { rank: "Master" }, { rank: "Silver IV", queueType: "high_elo" },
    { server: "unknown" }, { server: "toString" }, { currency: "GBP" }, { queueType: "solo" },
  ]) assert.throws(() => quote(overrides), RangeError);
  assert.equal(category({ quantity: 21 }).quoteRequired, true);
  assert.equal(category({ queue: "Solo" }).quoteRequired, true);
  assert.equal(category({ region: "unknown" }).quoteRequired, true);
});

test("category integration carries the discounted total and keeps other products on their source data", () => {
  const result = category({});
  assert.equal(result.quoteRequired, false);
  assert.equal(result.price, 26.95);
  assert.equal(result.duoPricing.discountPercent, 10);
  assert.equal(category({ rank: "Master", duoQueueType: "high_elo" }).price, 80.95);
  assert.equal(category({ rank: "anything", duoQueueType: "normal" }).price, 13.45);
  assert.equal(category({ game: "valorant" }).quoteRequired, true);
  const placement = projectPackages.find(p => p.game === "league-of-legends" && p.product === "placements" && p.quantity === 5);
  assert.ok(placement);
  const rank = placement.currentTier + (placement.currentDivision && placement.currentTier !== "Unranked" ? ` ${placement.currentDivision}` : "");
  assert.equal(category({ product: "placements", queue: "Solo", rank }).price, placement.naUsd);
});

test("apex LP prices split exactly across 500 and 1000 with the same server factors", () => {
  for (const game of ["league-of-legends", "teamfight-tactics"]) {
    const ranks = rankLevelsFor(game);
    const index = tier => ranks.findIndex(rank => rank.tier === tier);
    const queue = game === "league-of-legends" ? "Solo" : "Ranked";
    for (const [server, factor] of [["NA",1],["EUW",0.85],["KR",1.2]]) {
      const crossing = estimateQuote(index("Master"), index("Grandmaster"), queue, "rank-boost", 1, game, 400, 600, server);
      assert.equal(crossing.price, 430 * factor);
      const high = estimateQuote(index("Grandmaster"), index("Challenger"), queue, "rank-boost", 1, game, 900, 1100, server);
      assert.equal(high.price, 560 * factor);
      const challenger = estimateQuote(index("Challenger"), index("Challenger"), queue, "rank-boost", 1, game, 1000, 1100, server);
      assert.equal(challenger.price, 310 * factor);
    }
  }
});
