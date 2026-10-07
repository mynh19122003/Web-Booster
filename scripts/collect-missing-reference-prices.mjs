import fs from "node:fs/promises";
const directory = new URL("../data/pricing/", import.meta.url);
const reference = JSON.parse(await fs.readFile(new URL("boostroyal-workbook.json", directory), "utf8"));
const html = await (await fetch("https://boostroyal.com/lol-boosting")).text();
const {objs} = JSON.parse(html.match(/<script type="qwik\/json">([\s\S]*?)<\/script>/)[1]);
function decode(ref) {
  if (typeof ref !== "string") return ref;
  const value = objs[parseInt(ref, 36)];
  if (!value || typeof value !== "object") return value;
  return Array.isArray(value) ? value.map(decode) : Object.fromEntries(Object.entries(value).map(([key, item]) => [key, decode(item)]));
}
const index = objs.findIndex(value => value && typeof value === "object" && "currentTier" in value && "price" in value);
const template = decode(index.toString(36));
const gainMap = {"17+ LP / win":"17-19 LP", "14+ LP / win":"14-17 LP", "14 LP or less per win":"0-14 LP"};
const result = {collectedAt:new Date().toISOString(), source:"https://boostroyal.com/lol-boosting", quotes:[], failures:[]};
let cursor = 0;
await Promise.all(Array.from({length:3}, async () => {
  while (cursor < reference.missing.length) {
    const row = reference.missing[cursor++];
    const details = structuredClone(template);
    const [tier, division] = row.from.split(" ");
    Object.assign(details, {currentTier:tier, currentDivision:division, desiredTier:"Master", desiredDivision:"I", server:1, coupon:"", item:`${row.from} to Master`});
    Object.assign(details.orderDetails, {queue:"Solo/Duo", currentLp:"0-20", lpGain:gainMap[row.gain], duoQ:false, points:[0,0], priorityOrder:false, plusWin:false, streaming:false, appearOffline:false, withHighMMR:false, moderateKDA:false, specificChampions:false});
    try {
      const response = await fetch("https://api.boost-royal.com/checkout/calculatePrice", {method:"POST", headers:{"Content-Type":"application/json","X-Requested-With":"boostroyal.com"}, body:JSON.stringify({details}), signal:AbortSignal.timeout(15000)});
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const quote = await response.json();
      if (!Number.isFinite(quote.price) || quote.price <= 0 || quote.currentTier !== tier || quote.desiredTier !== "Master" || quote.server !== 1) throw new Error("Invalid quote");
      result.quotes.push({...row, price:Number((Math.round(quote.price)-0.01).toFixed(2)), rawPrice:quote.price, originalPrice:quote.defaultPrice, at:new Date().toISOString()});
    } catch (error) { result.failures.push({...row, error:String(error)}); }
    await new Promise(resolve => setTimeout(resolve, 180));
  }
}));
await fs.writeFile(new URL("boostroyal-reference-supplement.json", directory), JSON.stringify(result, null, 2) + "\n");
console.log(`Recovered ${result.quotes.length}/${reference.missing.length} missing reference quotes; failures ${result.failures.length}`);
