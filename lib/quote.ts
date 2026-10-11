import { apexConfig, rankProgress } from "@/lib/apex-ranks";
import { rankLevelsFor } from "@/lib/service-options";
import { APEX_PRICE_BANDS, DEFAULT_LP_GAIN, LP_GAIN_OPTIONS, rankPriceFactor } from "@/lib/rank-pricing";
import priceData from "@/data/pricing/rank-prices.json";
import { projectPackages, categoryQuote } from "@/lib/project-pricing";

type RateTables = Record<string, Record<string, Record<string, (number | null)[]>>>;
const rateTables: RateTables = priceData.games;
export type QuoteLine = { tier: string; points: number; baseUsd: number; priceUsd: number };
export type Quote = { price: number; minHours: number; maxHours: number; quoteRequired: boolean; lines: QuoteLine[] };
const round = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

/** Local snapshot prices. API checkout must calculate again with the same rules. */
export function estimateQuote(
  current: number,
  target: number,
  queue: string,
  service = "rank-boost",
  units = 1,
  game = "league-of-legends",
  currentLp = 0,
  targetLp = 0,
  region = "EUW",
  lpGain = DEFAULT_LP_GAIN,
): Quote {
  const quantity = Math.max(1, Math.min(10, Math.floor(Number.isFinite(units) ? units : 1)));
  if (service === "placements") {
    return {...categoryQuote({game,product:"placements",region,queue,rank:rankLevelsFor(game)[current]?.label??"",quantity,start:0,goal:0,detail:"",winType:"top4",clashTier:"",clashBoosters:0}),lines:[]};
  }
  if (service === "coaching") {
    const hours = service === "coaching" ? quantity : quantity * 2;
    return {
      price: Number(
        (quantity * 24).toFixed(2),
      ),
      minHours: hours,
      maxHours: hours * 2,
      quoteRequired: false,
      lines: [],
    };
  }
  const ranks = rankLevelsFor(game);
  const apex = apexConfig(game);
  const steps = rankProgress(game, target, targetLp) - rankProgress(game, current, currentLp);
  const deliverySteps = Number.isFinite(steps) ? Math.max(0, steps) : 1;
  const time = {minHours:Math.max(1, Math.ceil(deliverySteps)), maxHours:Math.max(2, Math.ceil(deliverySteps*2))};
  const unavailable = (): Quote => ({price:0, ...time, quoteRequired:true, lines:[]});
  if (!Number.isInteger(current) || !Number.isInteger(target) || !ranks[current] || !ranks[target] || !Number.isFinite(steps) || steps <= 0 || !region) return unavailable();
  // Source snapshots cover standard solo ranked queues and PC Valorant.
  if ((game === "league-of-legends" && queue !== "Solo") ||
      (game === "teamfight-tactics" && !["Ranked","Double Up"].includes(queue)) ||
      (game === "valorant" && queue !== "Competitive") || service !== "rank-boost") return unavailable();
  const gain = game === "league-of-legends" ? lpGain : game === "valorant" ? "22 RR" : "default";
  if (game === "league-of-legends" && !LP_GAIN_OPTIONS.some(option => option.value === gain)) return unavailable();
  // All servers use NA as the base; older NA gain snapshots supplement the workbook.
  const rates = rateTables[game]?.NA?.[gain];
  const product = game === "valorant" ? "ranks" : queue === "Double Up" ? "double-up" : "divisions";
  const lines: QuoteLine[] = [];
  const firstApex = ranks.findIndex(rank => rank.tier === (game === "valorant" ? "Immortal" : "Master"));
  const regularEnd = apex ? Math.min(target, firstApex) : target;
  for (let rank = current; rank < regularEnd; rank++) {
    const source = projectPackages.find(p => p.game === game && p.product === product && p.kind === "Từng bậc rank" && p.currentTier === ranks[rank].tier && String(p.currentDivision) === (game === "valorant" ? ["I","II","III"][Number(ranks[rank].division)-1] : ranks[rank].division));
    const useWorkbook = game !== "league-of-legends" || gain === "19-22 LP";
    const baseUsd = useWorkbook && source ? source.naUsd : queue === "Double Up" ? null : rates?.[rank];
    if (baseUsd == null || baseUsd <= 0) return unavailable();
    const tier = ranks[rank].tier;
    // The Double Up transition already includes 50 LP; an arbitrary apex
    // destination needs its own quote to avoid counting that LP twice.
    if(queue === "Double Up" && rank+1 === firstApex)return unavailable();
    lines.push({tier, points:game === "valorant" && rank >= firstApex ? 0 : 100, baseUsd, priceUsd:baseUsd * rankPriceFactor(region)});
  }
  if (apex && target >= firstApex) {
    const from = current >= firstApex ? currentLp : 0;
    if (!Number.isInteger(from) || !Number.isInteger(targetLp) || from < 0 || from >= apex.maxLp || targetLp < 0 || targetLp > apex.maxLp || (current >= firstApex && targetLp <= from)) return unavailable();
    for (const band of APEX_PRICE_BANDS) {
      const points = Math.max(0, Math.min(targetLp, band.to) - Math.max(from, band.from));
      if (!points) continue;
      const baseUsd = points * band.usdPerLp;
      lines.push({tier:band.tier, points, baseUsd, priceUsd:baseUsd * rankPriceFactor(region)});
    }
  }
  // Radiant also requires a regional leaderboard position; confirm it manually.
  if (game === "valorant" && ranks[target].tier === "Radiant") return unavailable();
  return {price:round(lines.reduce((total, line) => total + line.priceUsd, 0)), ...time, quoteRequired:false, lines};
}
