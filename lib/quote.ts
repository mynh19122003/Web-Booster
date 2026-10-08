import { apexConfig, rankProgress } from "@/lib/apex-ranks";
import { rankLevelsFor } from "@/lib/service-options";
import { APEX_PRICE_BANDS, DEFAULT_LP_GAIN, LP_GAIN_OPTIONS, rankPriceFactor } from "@/lib/rank-pricing";
import priceData from "@/data/pricing/rank-prices.json";

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
  if (service === "coaching" || service === "placements") {
    const hours = service === "coaching" ? quantity : quantity * 2;
    return {
      price: Number(
        (quantity * (service === "coaching" ? 24 : 8.5)).toFixed(2),
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
  if (!Number.isInteger(current) || !Number.isInteger(target) || !ranks[current] || !ranks[target] || !Number.isFinite(steps) || steps <= 0 || !rateTables[game]?.[region]) return unavailable();
  // Source snapshots cover standard solo ranked queues and PC Valorant.
  if ((game === "league-of-legends" && queue !== "Solo") ||
      (game === "teamfight-tactics" && queue !== "Ranked") ||
      (game === "valorant" && queue !== "Competitive") || service !== "rank-boost") return unavailable();
  const gain = game === "league-of-legends" ? lpGain : game === "valorant" ? "22 RR" : "default";
  if (game === "league-of-legends" && !LP_GAIN_OPTIONS.some(option => option.value === gain)) return unavailable();
  const rates = rateTables[game]?.[region]?.[gain];
  const lines: QuoteLine[] = [];
  const firstApex = ranks.findIndex(rank => rank.tier === (game === "valorant" ? "Immortal" : "Master"));
  const regularEnd = apex ? Math.min(target, firstApex) : target;
  for (let rank = current; rank < regularEnd; rank++) {
    const baseUsd = rates?.[rank];
    if (baseUsd == null || baseUsd <= 0) return unavailable();
    const tier = ranks[rank].tier;
    lines.push({tier, points:game === "valorant" && rank >= firstApex ? 0 : 100, baseUsd, priceUsd:baseUsd * rankPriceFactor(region, tier)});
  }
  if (apex && target >= firstApex) {
    const from = current >= firstApex ? currentLp : 0;
    if (!Number.isInteger(from) || !Number.isInteger(targetLp) || from < 0 || from >= apex.maxLp || targetLp < 0 || targetLp > apex.maxLp || (current >= firstApex && targetLp <= from)) return unavailable();
    for (const band of APEX_PRICE_BANDS) {
      const points = Math.max(0, Math.min(targetLp, band.to) - Math.max(from, band.from));
      if (!points) continue;
      const baseUsd = points * band.usdPerLp;
      lines.push({tier:band.tier, points, baseUsd, priceUsd:baseUsd * rankPriceFactor(region, band.tier)});
    }
  }
  // Radiant also requires a regional leaderboard position; confirm it manually.
  if (game === "valorant" && ranks[target].tier === "Radiant") return unavailable();
  return {price:round(lines.reduce((total, line) => total + line.priceUsd, 0)), ...time, quoteRequired:false, lines};
}
