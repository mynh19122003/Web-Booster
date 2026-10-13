import prices from "@/data/pricing/valorant-duo-prices.json";
import { SERVER_MULTIPLIERS } from "@/lib/rank-pricing";
import type { DuoPriceInput, DuoPriceResult } from "./duo-pricing-matrix";

export function calculateValorantDuoPrice(input: DuoPriceInput): DuoPriceResult {
  const { rank, server, gameCount, queueType, currency, usdPerEur } = input;
  const tier = rank.split(" ")[0];
  if (!Number.isInteger(gameCount) || gameCount < 1 || gameCount > 20 || !Object.hasOwn(SERVER_MULTIPLIERS, server)) throw new RangeError("Invalid Valorant duo quantity or server.");
  if (!["ranked", "high_elo", "normal"].includes(queueType) || (queueType !== "normal" && (!Object.hasOwn(prices.ranked, tier) || !/^(Iron|Bronze|Silver|Gold|Platinum|Diamond|Ascendant|Immortal)( [123])?$/.test(rank))) || (queueType === "high_elo" && !["Ascendant", "Immortal"].includes(tier))) throw new RangeError("Unsupported Valorant duo rank or mode.");
  if (!["USD", "EUR"].includes(currency) || (currency === "EUR" && (typeof usdPerEur !== "number" || !Number.isFinite(usdPerEur) || usdPerEur <= 0))) throw new RangeError("Invalid duo currency rate.");
  const rate = queueType === "normal" ? prices.casual : prices.ranked[tier as keyof typeof prices.ranked];
  const cents = (value: number) => Math.round((value + Number.EPSILON) * 100);
  const unitCents = cents(rate * SERVER_MULTIPLIERS[server]);
  const rawCents = unitCents * gameCount;
  const discountPercent = gameCount >= 5 ? 10 : gameCount >= 3 ? 5 : 0;
  const finalCents = rawCents - Math.round(rawCents * discountPercent / 100);
  const convert = (value: number) => currency === "EUR" ? cents(value / 100 / usdPerEur!) / 100 : value / 100;
  const totalRawPrice = convert(rawCents), finalPrice = convert(finalCents);
  return { basePricePerGame: convert(unitCents), totalRawPrice, finalPrice, discountAmount: cents(totalRawPrice - finalPrice) / 100, discountPercent, serverMultiplier: SERVER_MULTIPLIERS[server], currency };
}
