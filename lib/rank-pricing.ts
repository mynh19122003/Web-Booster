export const PRICING_VERSION = "2026-10-07";

// IDs match the public source calculator; labels describe minimum expected gain.
export const LP_GAIN_OPTIONS = [
  { value: "30-33 LP", label: "30+ LP" },
  { value: "28-30 LP", label: "28+ LP" },
  { value: "25-28 LP", label: "25+ LP" },
  { value: "22-25 LP", label: "22+ LP" },
  { value: "19-22 LP", label: "19+ LP" },
  { value: "17-19 LP", label: "17+ LP" },
  { value: "14-17 LP", label: "14+ LP" },
  { value: "0-14 LP", label: "≤14 LP" },
] as const;
export const DEFAULT_LP_GAIN = "22-25 LP";

// Commercial price bands, not Riot's live leaderboard cutoffs.
export const APEX_PRICE_BANDS = [
  { tier: "Master", from: 0, to: 500, usdPerLp: 1.8 },
  { tier: "Grandmaster", from: 500, to: 1000, usdPerLp: 2.5 },
  { tier: "Challenger", from: 1000, to: 1500, usdPerLp: 3.7 },
] as const;
export const LOW_RANK_TIERS = new Set(["Iron", "Bronze", "Silver", "Gold", "Platinum"]);
export function rankPriceFactor(region: string, tier: string) {
  if (region === "NA") return 0.85;
  return (LOW_RANK_TIERS.has(tier) ? 0.9 : 1) * (region === "KR" ? 1.2 : 1);
}
export function lpGainLabel(value: string) {
  return LP_GAIN_OPTIONS.find(option => option.value === value)?.label ?? value;
}
