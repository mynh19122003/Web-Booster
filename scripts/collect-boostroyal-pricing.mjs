import fs from "node:fs/promises";

// Reads public calculator quotes only. It never creates an order or signs in.
const output = new URL("../data/pricing/boostroyal-live.json", import.meta.url);
const endpoint = "https://api.boost-royal.com/checkout/calculatePrice";
const leagueTiers = ["Iron", "Bronze", "Silver", "Gold", "Platinum", "Emerald", "Diamond"];
const valorantTiers = ["Iron", "Bronze", "Silver", "Gold", "Platinum", "Diamond", "Ascendant"];
const leagueRanks = leagueTiers.flatMap(tier => ["IV", "III", "II", "I"].map(division => ({tier, division})));
const valorantRanks = valorantTiers.flatMap(tier => ["I", "II", "III"].map(division => ({tier, division})));
const servers = {NA:1, EUW:2, EUNE:3, OCE:9, KR:10, CN:14, SEA:13};
const gains = ["30-33 LP", "28-30 LP", "25-28 LP", "22-25 LP", "19-22 LP", "17-19 LP", "14-17 LP", "0-14 LP"];

function decodePage(html) {
  const match = html.match(/<script type="qwik\/json">([\s\S]*?)<\/script>/);
  if (!match) throw new Error("Public calculator configuration was not found");
  const {objs} = JSON.parse(match[1]);
  function decode(ref) {
    if (typeof ref !== "string") return ref;
    const value = objs[parseInt(ref, 36)];
    if (!value || typeof value !== "object") return value;
    return Array.isArray(value) ? value.map(decode) : Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, decode(entry)]));
  }
  const index = objs.findIndex(value => value && typeof value === "object" && "currentTier" in value && "price" in value);
  if (index < 0) throw new Error("Calculator quote model was not found");
  return decode(index.toString(36));
}

const emptySnapshot = () => ({collectedAt:new Date().toISOString(), sources:{}, segments:{}, failures:{}});
const snapshot = process.argv.includes("--refresh") ? emptySnapshot() : await fs.readFile(output, "utf8").then(JSON.parse).catch(emptySnapshot);
const jobs = [];
for (const [game, path, ranks, serverMap, gainList] of [
  ["league-of-legends", "lol-boosting", leagueRanks, servers, gains],
  ["teamfight-tactics", "tft-boosting", leagueRanks, servers, ["default"]],
  ["valorant", "valorant-boosting", valorantRanks, {NA:1, EUW:15, EUNE:15, OCE:16, KR:10, SEA:16}, ["22 RR"]],
]) {
  const url = `https://boostroyal.com/${path}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
  const template = decodePage(await response.text());
  snapshot.sources[game] = url;
  for (const [region, server] of Object.entries(serverMap)) {
    for (const gain of gainList) {
      for (let rank = 0; rank < ranks.length; rank++) {
        const from = ranks[rank];
        const to = ranks[rank + 1] ?? {tier:game === "valorant" ? "Immortal" : "Master", division:"I"};
        const details = structuredClone(template);
        Object.assign(details, {currentTier:from.tier, currentDivision:from.division, desiredTier:to.tier, desiredDivision:to.division, server, coupon:"", item:`${from.tier} ${from.division} to ${to.tier} ${to.division}`});
        Object.assign(details.orderDetails, {currentLp:"0-20", duoQ:false, points:[0,0], plusWin:false, priorityOrder:false, streaming:false, appearOffline:false, withHighMMR:false, moderateKDA:false, undercoverWinrate:false, coaching:false, specificChampions:false, specificAgents:false});
        if (game === "league-of-legends") details.orderDetails.lpGain = gain;
        if (game === "valorant") details.orderDetails.rrGain = 22;
        const key = `${game}:${region}:${gain}:${rank}`;
        if (!snapshot.segments[key]) jobs.push({key, details, from, to});
      }
      if (game === "valorant") {
        // Riot's regional Immortal RR thresholds, verified 2026-10-07.
        const points = region === "KR" ? [0,90,150,200] : region === "NA" ? [0,90,200,450] : ["EUW","EUNE"].includes(region) ? [0,100,200,500] : [0,80,200,400];
        for (let step = 0; step < 3; step++) {
          const details = structuredClone(template);
          Object.assign(details, {currentTier:"Immortal", currentDivision:"", desiredTier:"Immortal", desiredDivision:"", server, coupon:"", item:`Immortal ${points[step]} to ${points[step+1]} RR`});
          Object.assign(details.orderDetails, {currentLp:"0-20", duoQ:false, points:[points[step],points[step+1]], rrGain:22, plusWin:false, priorityOrder:false, streaming:false, appearOffline:false, withHighMMR:false, undercoverWinrate:false, coaching:false, specificAgents:false});
          const key = `${game}:${region}:${gain}:${21 + step}`;
          const from = {tier:"Immortal", division:""};
          const to = {tier:"Immortal", division:""};
          if (!snapshot.segments[key]) jobs.push({key, details, from, to});
        }
      }
    }
  }
}

await fs.mkdir(new URL("../data/pricing/", import.meta.url), {recursive:true});
async function save() { await fs.writeFile(output, JSON.stringify(snapshot, null, 2) + "\n"); }
let cursor = 0, completed = 0;
await Promise.all(Array.from({length:3}, async () => {
  while (cursor < jobs.length) {
    const job = jobs[cursor++];
    try {
      const response = await fetch(endpoint, {method:"POST", headers:{"Content-Type":"application/json", "X-Requested-With":"boostroyal.com"}, body:JSON.stringify({details:job.details}), signal:AbortSignal.timeout(15000)});
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const quote = await response.json();
      if (!(Number.isFinite(quote.price) && quote.price > 0) || quote.currentTier !== job.from.tier || quote.desiredTier !== job.to.tier || Number(quote.server) !== job.details.server) throw new Error("Invalid quote response");
      snapshot.segments[job.key] = {price:Number((Math.round(quote.price) - 0.01).toFixed(2)), rawPrice:quote.price, originalPrice:quote.defaultPrice, from:job.from, to:job.to, service:quote.service, server:quote.server, gain:job.details.orderDetails.lpGain ?? job.details.orderDetails.rrGain, queue:job.details.orderDetails.queue, at:new Date().toISOString()};
      delete snapshot.failures[job.key];
    } catch (error) { snapshot.failures[job.key] = String(error); }
    completed++;
    if (completed % 40 === 0) { await save(); console.log(`${completed}/${jobs.length}; stored ${Object.keys(snapshot.segments).length}; failures ${Object.keys(snapshot.failures).length}`); }
    await new Promise(resolve => setTimeout(resolve, 180));
  }
}));
await save();
console.log(`Complete: ${Object.keys(snapshot.segments).length} quotes; ${Object.keys(snapshot.failures).length} failures`);
