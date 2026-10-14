import snapshot from "@/data/pricing/project-prices.json";
import categoryRates from "@/data/pricing/category-rates.json";
import { lolChampions } from "@/data/lol-champions";
import { rankPriceFactor } from "@/lib/rank-pricing";
import { calculateDuoPrice, type DuoPriceResult, type DuoQueueType } from "@/lib/pricing/duo-pricing-matrix";
import { calculateValorantDuoPrice } from "@/lib/pricing/valorant-duo-pricing";
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
  const quantityLimit: Record<string, number> = { wins: 20, "ranked-wins": 20, placements: 5, normals: 30, unrated: 30, arena: 20, clash: 5, challenges: 10 };
  if (quantityLimit[product] && quantity > quantityLimit[product]) return missing;
  if (game === "league-of-legends" && ["mastery", "honor"].includes(product)) {
    const mastery = product === "mastery";
    if (!Number.isInteger(start) || !Number.isInteger(goal) || start < (mastery ? 1 : 3) || goal <= start || goal > (mastery ? 10 : 5)) return missing;
    if (mastery && !lolChampions.some(champion => [champion.id, champion.name].some(name => name.toLowerCase() === detail.trim().toLowerCase()))) return missing;
    const steps = mastery ? categoryRates.mastery : categoryRates.honor;
    const selectedSteps = steps.filter(step => step.from >= start && step.to <= goal);
    if (selectedSteps.length !== goal - start) return missing;
    return {
      price: serverPrice(selectedSteps.reduce((sum, step) => sum + step.naUsd, 0), region),
      quoteRequired: false,
      minHours: selectedSteps.reduce((sum, step) => sum + step.minHours, 0),
      maxHours: selectedSteps.reduce((sum, step) => sum + step.maxHours, 0),
    };
  }
  if (game === "league-of-legends" && product === "challenges" && detail.trim().toLowerCase() === "player diff") {
    const row = categoryRates.challenges.find(row => row.quantity === quantity);
    return row ? {price: serverPrice(row.naUsd, region), quoteRequired: false, minHours: row.minHours, maxHours: row.maxHours} : missing;
  }
  if (["league-of-legends", "valorant"].includes(game) && product === "games") {
    if (queue !== "Duo") return missing;
    try {
      const calculate = game === "valorant" ? calculateValorantDuoPrice : calculateDuoPrice;
      const duoPricing = calculate({ rank, server: region, gameCount: quantity,
        currency: "USD", queueType: input.duoQueueType ?? "ranked" });
      return { price: duoPricing.finalPrice, quoteRequired: false, minHours: 0, maxHours: 0, duoPricing };
    } catch (error) {
      if (error instanceof RangeError) return missing;
      throw error;
    }
  }
  const ranked = ["wins", "ranked-wins", "placements"].includes(product);
  if (
    ranked && !(game === "teamfight-tactics" && product === "placements" && queue === "Double Up") && !(game === "league-of-legends" && queue === "Flex 5v5") &&
    queue !==
      (game === "league-of-legends"
        ? "Solo"
        : game === "valorant"
          ? "Competitive"
          : "Ranked")
  )
    return missing;
  if (product === "ranked-wins" && !["top4", "first"].includes(winType)) return missing;
  // Preserve exact workbook quotes before applying the project's per-unit pricing.
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
      if (product === "wins" && game !== "league-of-legends" && detail && Number.parseInt(detail) !== sourceGain)
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
      return p.quantity === quantity && ["Normal Draft", "Quickplay", "ARAM"].includes(queue);
    if (product === "unrated")
      return p.quantity === quantity && ["Unrated", "Swiftplay"].includes(queue);
    if (product === "arena") return p.quantity === quantity;
    return false;
  });
  let selected = p;
  let scale = 1;
  if (!selected) {
    if (ranked) {
      // Rank rows define the unit/package rate for the entire tier, including every division.
      selected = matches.find(row => row.kind === "Theo rank" && row.currentTier === tierFor(rank));
      if (product === "wins" && game !== "league-of-legends" && detail && Number.parseInt(detail) !== 22) return missing;
      if (product === "placements" && quantity > 5) return missing;
      if (selected?.quantity) scale = quantity / selected.quantity;
      else return missing;
    } else if (["normals", "unrated", "arena", "clash"].includes(product)) {
      if ((product === "normals" && !["Normal Draft", "Quickplay", "ARAM"].includes(queue)) || (product === "unrated" && !["Unrated", "Swiftplay"].includes(queue))) return missing;
      selected = matches.find(row => product !== "clash" || row.currentTier === clashTier);
      if (!selected?.quantity) return missing;
      scale = quantity / selected.quantity;
      if (product === "clash") {
        if (!Number.isInteger(clashBoosters) || clashBoosters < 1 || clashBoosters > 5 || !selected.boosterCount) return missing;
        scale *= clashBoosters / selected.boosterCount;
      }
    } else if (game === "valorant" && product === "challenges" && detail.trim().toLowerCase() === "daily") {
      selected = matches.find(row => row.currentTier === "Daily");
      if (!selected?.quantity) return missing;
      scale = quantity / selected.quantity;
    } else if (["battle-pass", "set-pass"].includes(product)) {
      if (!Number.isInteger(start) || !Number.isInteger(goal) || start < 0 || goal <= start || goal > 100) return missing;
      selected = matches.find(row => typeof row.currentLevel === "number" && typeof row.desiredLevel === "number" && row.desiredLevel > row.currentLevel);
      if (!selected || selected.currentLevel === null || selected.desiredLevel === null) return missing;
      // Commercial project policy: prorate the workbook's package by purchased levels.
      scale = (goal - start) / (selected.desiredLevel - selected.currentLevel);
    } else return missing;
  }
  if (!selected || !Number.isFinite(scale) || scale <= 0) return missing;
  let gainFactor = 1;
  if (game === "league-of-legends" && product === "wins" && detail) {
    const gain = Number.parseInt(detail);
    const gainKey = ({14:"14-17 LP",17:"17-19 LP",19:"19-22 LP",22:"22-25 LP",25:"25-28 LP",28:"28-30 LP",30:"30-33 LP",33:"30-33 LP"} as Record<number,string>)[gain];
    const rate = categoryRates.wins.find(row => row.tier === tierFor(rank) && row.gain === gainKey);
    if (!gainKey || (!rate && gain !== 19)) return missing;
    gainFactor = rate?.factor ?? 1;
  }
  // TFT Strict Wins: verified +35% on the source calculator, applied to project base prices.
  const packagePrice = selected.naUsd * scale * gainFactor * (product === "ranked-wins" && winType === "first" ? 1.35 : 1);
  const [min, max] = selected.completionTime.split("-").map(Number),
    days = selected.completionTimeUnit === "days" ? 24 : 1;
  return {
    price: serverPrice(packagePrice, region),
    quoteRequired: false,
    minHours: Math.max(1, Math.ceil(min * days * scale)),
    maxHours: Math.max(1, Math.ceil(max * days * scale)),
  };
}
