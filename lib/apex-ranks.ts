import { rankLevelsFor } from "@/lib/service-options";
import { APEX_PRICE_BANDS } from "@/lib/rank-pricing";

// Shop LP pricing bands. Live ranks depend on the regional leaderboard.
export function apexConfig(game: string) {
  if (game === "league-of-legends" || game === "teamfight-tactics") return {
    grandmaster: APEX_PRICE_BANDS[1].from,
    challenger: APEX_PRICE_BANDS[2].from,
    maxLp: APEX_PRICE_BANDS[2].to,
  };
  return null;
}

export function isApexRank(game: string, rank: number) {
  return !!apexConfig(game) && ["Master", "Grandmaster", "Challenger"].includes(rankLevelsFor(game)[rank]?.tier);
}

export function apexStartLp(game: string, rank: number) {
  const config = apexConfig(game);
  const tier = rankLevelsFor(game)[rank]?.tier;
  return tier === "Challenger" ? config?.challenger ?? 0 : tier === "Grandmaster" ? config?.grandmaster ?? 0 : 0;
}

export function apexRankAtLp(game: string, lp: number) {
  const config = apexConfig(game)!;
  const tier = lp >= config.challenger ? "Challenger" : lp >= config.grandmaster ? "Grandmaster" : "Master";
  return rankLevelsFor(game).findIndex((rank) => rank.tier === tier);
}

export function rankDescription(game: string, rank: number, lp = 0) {
  const label = rankLevelsFor(game)[rank]?.label ?? "";
  return isApexRank(game, rank) ? `${label} · ${lp} LP` : label;
}

export function rankProgress(game: string, rank: number, lp = 0) {
  if (!isApexRank(game, rank)) return rank;
  return rankLevelsFor(game).findIndex((level) => level.tier === "Master") + lp / 100;
}
