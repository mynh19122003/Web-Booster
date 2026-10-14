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

test("Flex quotes work across divisions, quantities, servers and LP gains", () => {
  const ranks = rankLevelsFor("league-of-legends");
  for (let index = 0; index < 27; index++) {
    for (const region of ["NA", "KR", "EUW"]) for (const gain of ["14-17 LP", "19-22 LP", "30-33 LP"]) {
      const args = ["rank-boost", 1, "league-of-legends", 0, 0, region, gain];
      const solo = estimateQuote(index,index+1,"Solo",...args);
      const flex = estimateQuote(index,index+1,"Flex 5v5",...args);
      assert.equal(flex.quoteRequired,false,`${ranks[index].label}/${region}/${gain}`);
      assert.equal(flex.price,solo.price);
    }
  }
  for (const product of ["wins","placements"]) for (const tier of ["Iron","Silver","Emerald","Diamond"]) {
    const input = {product,rank:`${tier} II`,quantity:3};
    assert.equal(category({...input,queue:"Flex 5v5"}).price,category({...input,queue:"Solo"}).price);
    assert.equal(category({...input,queue:"Flex 5v5"}).quoteRequired,false);
  }
});

test("mastery covers every valid level interval and champion without losing package prices", () => {
  for (const detail of ["Aatrox","Ahri","Zed","Kai'Sa"]) for (let start=1;start<10;start++) for (let goal=start+1;goal<=10;goal++) {
    const result = category({product:"mastery",detail,start,goal,queue:"Solo"});
    assert.equal(result.quoteRequired,false,`${detail}/${start}-${goal}`);
    assert.ok(result.price>0 && result.minHours>0 && result.maxHours>=result.minHours);
  }
  assert.equal(category({product:"mastery",detail:"Ahri",start:1,goal:7}).price,51.99);
  assert.equal(category({product:"mastery",detail:"Ahri",start:1,goal:7,region:"KR"}).price,62.39);
  for (const input of [{start:0,goal:7},{start:7,goal:7},{start:9,goal:11},{start:1.5,goal:7},{detail:"unknown champion",start:1,goal:7}]) {
    assert.equal(category({product:"mastery",detail:"Ahri",...input}).quoteRequired,true);
  }
});

test("Honor steps and challenge counts are complete and preserve existing packages", () => {
  assert.equal(category({product:"honor",start:3,goal:5}).price,389.99);
  for (const [start,goal] of [[3,4],[4,5]]) assert.equal(category({product:"honor",start,goal}).quoteRequired,false);
  assert.equal(category({product:"honor",start:0,goal:5}).quoteRequired,true);
  for(let quantity=1;quantity<=10;quantity++) assert.equal(category({product:"challenges",detail:"Player Diff",quantity}).quoteRequired,false);
  assert.equal(category({product:"challenges",detail:"Player Diff",quantity:3}).price,6.99);
  assert.equal(category({product:"challenges",detail:"unknown",quantity:3}).quoteRequired,true);
  for (const queue of ["Normal Draft","Quickplay","ARAM"]) assert.equal(category({product:"normals",queue,quantity:10}).quoteRequired,false);
});

test("ranked wins no longer lose prices when expected LP gain changes", () => {
  for (const tier of ["Iron","Bronze","Silver","Gold","Platinum","Emerald","Diamond"]) {
    const base = {product:"wins",queue:"Flex 5v5",rank:`${tier} IV`,quantity:5};
    let previous = 0;
    for (const points of [14,17,19,22,25,28,30]) {
      const result = category({...base,detail:`${points} LP / win`});
      assert.equal(result.quoteRequired,false);
      assert.ok(result.price>=previous);
      assert.equal(result.minHours,category(base).minHours);
      assert.equal(result.maxHours,category(base).maxHours);
      previous = result.price;
    }
    assert.equal(category({...base,detail:"19 LP / win"}).price,category(base).price);
  }
});

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

test("category prices update with quantity and server using the project's existing package rates", () => {
  const base = { queue: "Solo", rank: "Silver IV" };
  assert.equal(category({ ...base, product: "wins", quantity: 5 }).price, 14.95);
  assert.equal(category({ ...base, product: "wins", quantity: 5, region: "KR" }).price, 17.94);
  assert.equal(category({ ...base, product: "wins", quantity: 5, region: "EUW" }).price, 12.71);
  assert.equal(category({ ...base, product: "placements", rank: "Unranked", quantity: 2 }).price, 7.2);
  assert.equal(category({ ...base, product: "placements", rank: "Unranked", quantity: 2, region: "KR" }).price, 8.64);
  assert.equal(category({ product: "arena", queue: "Arena", quantity: 1 }).price, 3.33);
  assert.equal(category({ product: "arena", queue: "Arena", quantity: 5 }).price, 16.65);
  assert.equal(category({ product: "clash", queue: "Clash", quantity: 2, clashTier: "Tier III", clashBoosters: 2 }).price, 26.5);
  assert.equal(category({ product: "clash", queue: "Clash", quantity: 4, clashTier: "Tier III", clashBoosters: 3 }).price, 79.49);
  assert.equal(category({ product: "battle-pass", queue: "Solo", start: 0, goal: 100, region: "KR" }).price, 179.88);
  assert.equal(category({ product: "battle-pass", queue: "Solo", start: 20, goal: 25 }).price, 7.5);
});

test("all supported match quantities have finite quotes and invalid progression never becomes free", () => {
  for (const product of ["wins", "placements", "arena", "clash"]) {
    for (const region of ["NA", "KR", "EUW", "VN"]) {
      const max = product === "placements" || product === "clash" ? 5 : 20;
      for (let quantity = 1; quantity <= max; quantity++) {
        const result = category({ product, region, queue: product === "arena" ? "Arena" : product === "clash" ? "Clash" : "Solo", rank: product === "placements" ? "Unranked" : "Silver IV", quantity, clashTier: "Tier III", clashBoosters: 2 });
        assert.equal(result.quoteRequired, false, `${product}/${region}/${quantity}`);
        assert.ok(Number.isFinite(result.price) && result.price > 0);
      }
    }
  }
  for (const [start, goal] of [[10,10],[20,10],[-1,10],[0,101],[NaN,10]]) assert.equal(category({product:"battle-pass",start,goal}).quoteRequired,true);
  assert.equal(category({product:"placements",queue:"Solo",quantity:6}).quoteRequired,true);
});

test("Valorant and TFT quantities, divisions, regions and pass levels use their own project rates", () => {
  assert.equal(category({game:"valorant",product:"wins",queue:"Competitive",rank:"Silver 2",quantity:3,region:"NA"}).price,8.97);
  assert.equal(category({game:"valorant",product:"placements",queue:"Competitive",rank:"Unranked",quantity:2,region:"KR"}).price,7.68);
  assert.equal(category({game:"valorant",product:"unrated",queue:"Unrated",quantity:10,region:"EU"}).price,37.38);
  assert.equal(category({game:"valorant",product:"challenges",queue:"Competitive",detail:"Daily",quantity:2,region:"NA"}).price,10);
  assert.equal(category({game:"valorant",product:"battle-pass",start:10,goal:20,region:"NA"}).price,78.99);
  assert.equal(category({game:"teamfight-tactics",product:"set-pass",start:10,goal:30,region:"VN"}).price,54.38);
  for (const [game, product, queue, max] of [["valorant","wins","Competitive",20],["valorant","placements","Competitive",5],["valorant","unrated","Unrated",30],["teamfight-tactics","ranked-wins","Ranked",20],["teamfight-tactics","placements","Ranked",5]]) {
    for (const region of ["NA","KR","EU","VN"]) for (let quantity=1; quantity<=max; quantity++) {
      const result=category({game,product,queue,quantity,region,rank:game==="valorant"?"Silver 3":"Silver II"});
      assert.equal(result.quoteRequired,false,`${game}/${product}/${quantity}/${region}`);
      assert.ok(result.price>0 && Number.isFinite(result.price));
    }
  }
});

test("TFT first-place surcharge updates totals and unsupported Valorant duo ranks do not use LoL rates", () => {
  const base={game:"teamfight-tactics",product:"ranked-wins",queue:"Ranked",rank:"Silver II",quantity:5,region:"NA"};
  assert.equal(category(base).price,19.95);
  assert.equal(category({...base,winType:"first"}).price,26.93);
  assert.equal(category({...base,winType:"first",region:"KR"}).price,32.32);
  assert.equal(category({game:"valorant",product:"games",queue:"Duo",rank:"Radiant"}).quoteRequired,true);
  assert.equal(category({game:"valorant",product:"challenges",detail:"unknown",quantity:2}).quoteRequired,true);
});

test("new Valorant duo source rates follow project quantity discounts, server and currency policies", () => {
  const val=load("lib/pricing/valorant-duo-pricing.ts").calculateValorantDuoPrice;
  const input={rank:"Silver 2",server:"NA",gameCount:5,currency:"USD",queueType:"ranked"};
  assert.equal(val(input).basePricePerGame,5.99);
  assert.equal(val(input).finalPrice,26.95);
  assert.equal(val({...input,rank:"Diamond 3",gameCount:1}).finalPrice,8.99);
  assert.equal(val({...input,rank:"Ascendant 1",queueType:"high_elo",gameCount:1}).finalPrice,10.99);
  assert.equal(val({...input,rank:"Immortal 2",queueType:"high_elo",gameCount:1}).finalPrice,12.99);
  assert.equal(val({...input,queueType:"normal",rank:"Normal",gameCount:1}).finalPrice,2.99);
  const euro=val({...input,currency:"EUR",usdPerEur:1.1});
  assert.equal(euro.finalPrice,24.5);
  assert.equal(Number((euro.totalRawPrice-euro.discountAmount).toFixed(2)),euro.finalPrice);
  for(const rank of ["Iron 1","Silver 3","Diamond 2","Ascendant 3","Immortal 1"]) for(const region of ["NA","KR","EU","AP"]) for(const quantity of [1,3,5,10,20]) {
    const result=category({game:"valorant",rank,product:"games",queue:"Duo",region,quantity});
    assert.equal(result.quoteRequired,false);
    assert.ok(result.price>0);
  }
  assert.throws(()=>val({...input,rank:"Silver IV"}),RangeError);
});

test("Swiftplay uses the user-approved Unrated rate and TFT Double Up placements retain project rank rates", () => {
  for(const region of ["NA","KR","EU","AP"]) for(let quantity=1;quantity<=30;quantity++) {
    const input={game:"valorant",product:"unrated",region,quantity};
    assert.deepEqual(category({...input,queue:"Swiftplay"}),category({...input,queue:"Unrated"}));
  }
  for(const rank of ["Unranked","Silver II","Gold I","Diamond IV","Master"]) for(let quantity=1;quantity<=5;quantity++) {
    const input={game:"teamfight-tactics",product:"placements",rank,quantity,region:"NA"};
    assert.deepEqual(category({...input,queue:"Double Up"}),category({...input,queue:"Ranked"}));
  }
});
