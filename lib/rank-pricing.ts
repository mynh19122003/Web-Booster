export const PRICING_VERSION = "2026-10-14";

export const SERVER_MULTIPLIERS: Readonly<Record<string, number>> = {
  NA: 1, KR: 1.2,
  EUW: 0.85, EUNE: 0.85, OCE: 0.85, CN: 0.85, SEA: 0.85,
  VN: 0.85, PH: 0.85, TW: 0.85, SG: 0.85, TH: 0.85,
  EU: 0.85, AP: 0.85, BR: 0.85, LATAM: 0.85, LAN: 0.85,
  LAS: 0.85, TR: 0.85, RU: 0.85, JP: 0.85,
};

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
export const DEFAULT_LP_GAIN = "19-22 LP";

// Commercial price bands, not Riot's live leaderboard cutoffs.
export const APEX_PRICE_BANDS = [
  { tier: "Master", from: 0, to: 500, usdPerLp: 1.8 },
  { tier: "Grandmaster", from: 500, to: 1000, usdPerLp: 2.5 },
  { tier: "Challenger", from: 1000, to: 1500, usdPerLp: 3.1 },
] as const;
export function rankPriceFactor(region: string) {
  return Object.hasOwn(SERVER_MULTIPLIERS, region) ? SERVER_MULTIPLIERS[region] : 0.85;
}
export function lpGainLabel(value: string) {
  return LP_GAIN_OPTIONS.find(option => option.value === value)?.label ?? value;
}
