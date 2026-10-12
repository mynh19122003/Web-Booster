import fs from "node:fs/promises";
const directory = new URL("../data/pricing/", import.meta.url);
const source = JSON.parse(await fs.readFile(new URL("boostroyal-live.json", directory), "utf8"));
const games = {};
for (const [key, quote] of Object.entries(source.segments)) {
  const [game, region, gain, rank] = key.split(":");
  games[game] ??= {};
  games[game][region] ??= {};
  games[game][region][gain] ??= Array(game === "valorant" ? 24 : 28).fill(null);
  games[game][region][gain][Number(rank)] = quote.price;
}
const gains = ["30-33 LP","28-30 LP","25-28 LP","22-25 LP","19-22 LP","17-19 LP","14-17 LP","0-14 LP"];
const adjustments = [];
// Lower LP gain must never equal or undercut a faster gain band.
for (const [region, rates] of Object.entries(games["league-of-legends"] ?? {})) {
  for (let rank = 0; rank < 28; rank++) {
    let previous = null;
    for (const gain of gains) {
      const value = rates[gain]?.[rank];
      if (value == null) { previous = null; continue; }
      if (previous != null && value <= previous) {
        const adjusted = Number((previous + 0.02).toFixed(2));
        rates[gain][rank] = adjusted;
        adjustments.push({region, rank, gain, source:value, price:adjusted});
      }
      previous = rates[gain][rank];
    }
  }
}
await fs.writeFile(new URL("rank-prices.json", directory), JSON.stringify({version:"2026-10-07", collectedAt:source.collectedAt, games}, null, 2) + "\n");
await fs.writeFile(new URL("lp-order-adjustments.json", directory), JSON.stringify(adjustments, null, 2) + "\n");
console.log(`Built ${Object.keys(source.segments).length} rates; ${adjustments.length} LP ordering adjustments`);
