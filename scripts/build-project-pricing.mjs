import fs from "node:fs/promises";
// Read the preserved research inputs behind the delivered project workbook.
const research = new URL(
  "../outputs/boostroyal-20261009/research/",
  import.meta.url,
);
const read = async (name) =>
  JSON.parse(
    (await fs.readFile(new URL(name, research), "utf8")).replace(/^\uFEFF/, ""),
  );
const { quotes, errors } = await read("quotes.json");
if (errors.length) throw new Error("Research quotes contain errors");
const rates = await read("exchange-rates.json");
const fx =
  rates.find((r) => r.currency === "USD").rate /
  rates.find((r) => r.currency === "EUR").rate;
const usd = (price) => Math.round(Math.round(price * fx * 100) / 100) - 0.01;
const games = {
  lol: "league-of-legends",
  tft: "teamfight-tactics",
  valorant: "valorant",
};
const services = {
  1: "divisions",
  25: "ranks",
  18: "divisions",
  40: "double-up",
  2: "wins",
  28: "wins",
  19: "ranked-wins",
  6: "placements",
  27: "placements",
  20: "placements",
  8: "normals",
  29: "unrated",
  11: "mastery",
  107: "challenges",
  32: "challenges",
  108: "battle-pass",
  30: "battle-pass",
  109: "set-pass",
  106: "honor",
  17: "clash",
  42: "arena",
};
const packages = quotes
  .filter((q) => q.server === 1)
  .map((q) => {
    const d = q.response;
    return {
      game: games[q.game],
      product: services[d.service],
      kind: q.kind,
      item: d.item.trim(),
      naUsd: usd(d.price),
      currentTier: d.currentTier ?? null,
      currentDivision: d.currentDivision ?? null,
      desiredTier: d.desiredTier ?? null,
      desiredDivision: d.desiredDivision ?? null,
      currentLevel: d.currentLevel ?? null,
      desiredLevel: d.desiredLevel ?? null,
      quantity: d.gameCount ?? null,
      boosterCount: d.boosterCount ?? null,
      details: d.orderDetails,
      completionTime: d.completionTime,
      completionTimeUnit: d.completionTimeUnit,
      source: q.url,
    };
  });
const smurfs = (await read("smurf-browser-quotes.json"))
  .filter((group) => group.region === "North America")
  .flatMap((group) =>
    group.cards.map((card, i) => {
      const price = card.text.match(/TOTAL\s*\$\s*(\d+)\s*\.(\d{2})/i);
      if (!price) throw new Error("Missing visible USD Smurf price");
      const lines = card.text.split("\n");
      return {
        id: `${group.game}-smurf-${i}`,
        game: games[group.game],
        name: `${lines[0]} ${lines[1]}`,
        spec:
          card.text
            .match(
              /(?:Champions|Skins|Blue Essence|Riot Points)\n([^\n]+)/,
            )?.[0]
            .replace("\n", ": ") ?? "",
        naUsd: Number(price[1] + "." + price[2]),
        source: `https://boostroyal.com/${group.game}-smurf`,
      };
    }),
  );
await fs.writeFile(
  new URL("../data/pricing/project-prices.json", import.meta.url),
  JSON.stringify(
    {
      version: "2026-10-09",
      baseRegion: "NA",
      currency: "USD",
      packages,
      smurfs,
    },
    null,
    2,
  ) + "\n",
);
console.log(
  `Built ${packages.length} NA packages and ${smurfs.length} Smurf packages`,
);
