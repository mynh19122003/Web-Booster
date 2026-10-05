import { services } from "@/data/services";

export type ServiceSlug =
  "rank-boost" | "duo-boost" | "placements" | "coaching";
export const gameRanks: Record<string, string[]> = {
  "league-of-legends": [
    "Iron",
    "Bronze",
    "Silver",
    "Gold",
    "Platinum",
    "Emerald",
    "Diamond",
    "Master",
    "Grandmaster",
    "Challenger",
  ],
  valorant: [
    "Iron",
    "Bronze",
    "Silver",
    "Gold",
    "Platinum",
    "Diamond",
    "Ascendant",
    "Immortal",
    "Radiant",
  ],
  "teamfight-tactics": [
    "Iron",
    "Bronze",
    "Silver",
    "Gold",
    "Platinum",
    "Emerald",
    "Diamond",
    "Master",
    "Grandmaster",
    "Challenger",
  ],
};
export type RankLevel = {
  tier: string;
  division: string;
  label: string;
  icon: string;
};
export function rankLevelsFor(game: string): RankLevel[] {
  const tiers = gameRanks[game] ?? gameRanks["league-of-legends"];
  return tiers.flatMap((tier, index) => {
    const divisions =
      game === "valorant"
        ? tier === "Radiant"
          ? [""]
          : ["1", "2", "3"]
        : index >= 7
          ? [""]
          : ["IV", "III", "II", "I"];
    return divisions.map((division) => ({
      tier,
      division,
      label: `${tier}${division ? ` ${division}` : ""}`,
      icon:
        game === "valorant"
          ? `/images/ranks/valorant/${tier.toLowerCase()}${division ? `-${division}` : ""}.png`
          : `/images/ranks/league/${tier.toLowerCase()}.png`,
    }));
  });
}
export function ranksFor(game: string) {
  return rankLevelsFor(game).map((r) => r.label);
}
export function initialRanks(game: string) {
  return game === "valorant"
    ? { current: 9, target: 15 }
    : { current: 12, target: 24 };
}
export function servicesFor(game: string) {
  return services.filter(
    (service) =>
      game !== "teamfight-tactics" ||
      service.slug === "rank-boost" ||
      service.slug === "coaching",
  );
}
export function serviceSlug(label: string): ServiceSlug {
  if (label === "Duo boost") return "duo-boost";
  if (label === "Placements") return "placements";
  if (label === "Coaching") return "coaching";
  return "rank-boost";
}
