import { SERVER_MULTIPLIERS } from "@/lib/rank-pricing";

export { SERVER_MULTIPLIERS };
export type DuoQueueType = "ranked" | "high_elo" | "normal";
export type DuoCurrency = "USD" | "EUR";

export const DUO_PRICE_SOURCE = {
  url: "https://boostroyal.com/lol-boosting/pro-duo",
  checkedOn: "2026-10-10",
  // Reference EUR values only; actual EUR quotes require the current exchange rate.
  referenceUsdPerEur: 1.12049503,
} as const;
const cents = (amount: number) => Math.round((amount + Number.EPSILON) * 100);
const row = (usd: number) => ({
  USD: usd,
  EUR: cents(usd / DUO_PRICE_SOURCE.referenceUsdPerEur) / 100,
});
const divisions = ["IV", "III", "II", "I"] as const;
export const DUO_RANK_OPTIONS = {
  ranked: ["Iron", "Bronze", "Silver", "Gold", "Platinum", "Emerald", "Diamond"]
    .flatMap(tier => divisions.map(division => `${tier} ${division}`)),
  high_elo: ["Master", "Grandmaster", "Challenger"],
};

// Public USD card prices, grouped by the customer's rank, not the pro's rank.
// ASCEND uses these as the NA baseline and applies its own bulk/server rules.
export const DUO_PRICING_TABLE: Readonly<Record<string, { USD: number; EUR: number }>> =
  Object.fromEntries([
    ...DUO_RANK_OPTIONS.ranked.map(rank => [rank, row(
      ["Diamond II", "Diamond I"].includes(rank) ? 14.99 :
      /^(Emerald|Diamond) /.test(rank) ? 8.99 : 5.99,
    )]),
    ...DUO_RANK_OPTIONS.high_elo.map(rank => [rank, row(17.99)]),
    ["Normal", row(2.99)],
  ]);

export type DuoPriceInput = {
  rank: string;
  server: string;
  gameCount: number;
  currency: DuoCurrency;
  queueType: DuoQueueType;
  usdPerEur?: number | null;
};
export type DuoPriceResult = {
  basePricePerGame: number;
  totalRawPrice: number;
  discountAmount: number;
  finalPrice: number;
  discountPercent: number;
  serverMultiplier: number;
  currency: DuoCurrency;
};

export function calculateDuoPrice(input: DuoPriceInput): DuoPriceResult {
  const { rank, server, gameCount, currency, queueType, usdPerEur } = input;
  if (!Number.isInteger(gameCount) || gameCount < 1 || gameCount > 20)
    throw new RangeError("Duo game count must be an integer from 1 to 20.");
  if (currency !== "USD" && currency !== "EUR")
    throw new RangeError("Unsupported Duo currency.");
  if (!["ranked", "high_elo", "normal"].includes(queueType))
    throw new RangeError("Unsupported Duo queue type.");
  if (!Object.hasOwn(SERVER_MULTIPLIERS, server))
    throw new RangeError("Unsupported Duo server.");
  if (queueType !== "normal" && !DUO_RANK_OPTIONS[queueType].includes(rank))
    throw new RangeError("Rank does not belong to this Duo queue type.");
  if (currency === "EUR" && (typeof usdPerEur !== "number" || !Number.isFinite(usdPerEur) || usdPerEur <= 0))
    throw new RangeError("A valid USD per EUR exchange rate is required.");
  const serverMultiplier = SERVER_MULTIPLIERS[server];
  const unitCents = cents(DUO_PRICING_TABLE[queueType === "normal" ? "Normal" : rank].USD * serverMultiplier);
  const rawCents = unitCents * gameCount;
  const discountPercent = gameCount >= 5 ? 10 : gameCount >= 3 ? 5 : 0;
  const discountCents = Math.round(rawCents * discountPercent / 100);
  const finalCents = rawCents - discountCents;
  const convert = (value: number) => currency === "EUR" ? cents(value / 100 / usdPerEur!) / 100 : value / 100;
  // Convert the discounted USD total once; EUR matches the site's currency switch.
  const totalRawPrice = convert(rawCents);
  const finalPrice = convert(finalCents);
  return {
    basePricePerGame: convert(unitCents), totalRawPrice,
    discountAmount: cents(totalRawPrice - finalPrice) / 100, finalPrice,
    discountPercent, serverMultiplier, currency,
  };
}
