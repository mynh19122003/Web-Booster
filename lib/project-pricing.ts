import snapshot from "@/data/pricing/project-prices.json";
import { rankPriceFactor } from "@/lib/rank-pricing";
import { calculateDuoPrice, type DuoPriceResult, type DuoQueueType } from "@/lib/pricing/duo-pricing-matrix";
export const projectPackages = snapshot.packages;
export const smurfPackages = snapshot.smurfs;
export const roundUsd = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100;
export const serverPrice = (naUsd: number, region: string) =>
  roundUsd(naUsd * rankPriceFactor(region));
const tierFor = (rank: string) => rank.split(" ")[0];
export type CategoryPriceInput = {
  game: string;
  product: string;
  region: string;
  queue: string;
  rank: string;
  quantity: number;
  start: number;
  goal: number;
  detail: string;
  winType: string;
  clashTier: string;
  clashBoosters: number;
  duoQueueType?: DuoQueueType;
};
export type CategoryQuote = { price: number; quoteRequired: boolean; minHours: number; maxHours: number; duoPricing?: DuoPriceResult };
export function categoryQuote(input: CategoryPriceInput): CategoryQuote {
  const {
    game,
    product,
    region,
    queue,
    rank,
    quantity,
    start,
    goal,
    detail,
    winType,
    clashTier,
    clashBoosters,
  } = input;
  const matches = projectPackages.filter(
    (p) => p.game === game && p.product === product,
  );
  const missing = { price: 0, quoteRequired: true, minHours: 0, maxHours: 0 };
  if (!Number.isInteger(quantity) || quantity < 1) return missing;
  if (game === "league-of-legends" && product === "games") {
    if (queue !== "Duo") return missing;
    try {
      const duoPricing = calculateDuoPrice({ rank, server: region, gameCount: quantity,
        currency: "USD", queueType: input.duoQueueType ?? "ranked" });
      return { price: duoPricing.finalPrice, quoteRequired: false, minHours: 0, maxHours: 0, duoPricing };
    } catch (error) {
      if (error instanceof RangeError) return missing;
      throw error;
    }
  }
  const ranked = ["wins", "ranked-wins", "placements"].includes(product);
  if (
    ranked &&
    queue !==
      (game === "league-of-legends"
        ? "Solo"
        : game === "valorant"
          ? "Competitive"
          : "Ranked")
  )
    return missing;
  if (product === "ranked-wins" && winType !== "top4") return missing;
  // Only configurations actually quoted in the workbook receive an automatic price.
  // Different quantities/champions/modes stay in the request-a-quote flow.
  const p = matches.find((p) => {
    if (ranked) {
      const division =
        game === "valorant"
          ? (({ I: "1", II: "2", III: "3" } as Record<string, string>)[
              String(p.currentDivision)
            ] ?? p.currentDivision)
          : p.currentDivision;
      const pRank =
        String(p.currentTier) +
        (division && p.currentTier !== "Unranked" ? " " + division : "");
      const sourceGain = game === "valorant" ? 22 : 19;
      if (
        product === "wins" &&
        detail &&
        Number.parseInt(detail) !== sourceGain
      )
        return false;
      return (
        p.quantity === quantity &&
        (pRank === rank ||
          (p.kind === "Theo rank" &&
            tierFor(rank) === p.currentTier &&
            (rank === "Unranked" ||
              rank.endsWith(game === "valorant" ? " 1" : " IV") ||
              !rank.includes(" "))))
      );
    }
    if (product === "mastery")
      return (
        p.currentTier === start &&
        p.desiredTier === goal &&
        detail.trim().toLowerCase() === "aatrox"
      );
    if (["battle-pass", "set-pass", "honor"].includes(product))
      return p.currentLevel === start && p.desiredLevel === goal;
    if (product === "clash")
      return (
        p.quantity === quantity &&
        p.currentTier === clashTier &&
        p.boosterCount === clashBoosters
      );
    if (product === "challenges")
      return (
        p.quantity === quantity &&
        detail.trim().toLowerCase() ===
          (game === "league-of-legends" ? "player diff" : "daily")
      );
    if (product === "normals")
      return p.quantity === quantity && queue === "Normal Draft";
    if (product === "unrated")
      return p.quantity === quantity && queue === "Unrated";
    if (product === "arena") return p.quantity === quantity;
    return false;
  });
  if (!p) return missing;
  const [min, max] = p.completionTime.split("-").map(Number),
    days = p.completionTimeUnit === "days" ? 24 : 1;
  return {
    price: serverPrice(p.naUsd, region),
    quoteRequired: false,
    minHours: min * days,
    maxHours: max * days,
  };
}
