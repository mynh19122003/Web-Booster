export type Coach = {
  slug: string;
  name: string;
  game: string;
  gameName: string;
  peakRank: string;
  rating: number;
  reviewCount: number;
  isMvp: boolean;
  hourlyRate: number;
  online: boolean;
  server: string;
  sessionFormats: ("live" | "vod")[];
  languages: string[];
  roles: string[];
  students: number;
  yearsCoaching: number;
  bioKey: "coachBioLuna" | "coachBioRift" | "coachBioNova" | "coachBioVex" | "coachBioKairo" | "coachBioMira";
  accent: string;
  bioOverride?: string;
  avatar?: string;
  riotProfile?: import("@/lib/coach-riot-profile").CoachRiotProfile;
};

export const coaches: Coach[] = [
  { slug: "luna", name: "Luna", game: "league-of-legends", gameName: "League of Legends", peakRank: "Challenger", rating: 4.98, reviewCount: 186, isMvp: true, hourlyRate: 24, online: true, server: "EUW", sessionFormats: ["live", "vod"], languages: ["English", "Tiếng Việt"], roles: ["Mid", "Support"], students: 420, yearsCoaching: 5, bioKey: "coachBioLuna", accent: "#8b72cf" },
];

export function coachFor(slug: string) {
  return coaches.find((coach) => coach.slug === slug);
}

export const coachRanksByGame: Record<string, string[]> = {
  "league-of-legends": ["Iron", "Bronze", "Silver", "Gold", "Platinum", "Emerald", "Diamond", "Master", "Grandmaster", "Challenger"],
  "teamfight-tactics": ["Iron", "Bronze", "Silver", "Gold", "Platinum", "Emerald", "Diamond", "Master", "Grandmaster", "Challenger"],
  valorant: ["Iron", "Bronze", "Silver", "Gold", "Platinum", "Diamond", "Ascendant", "Immortal", "Radiant"],
};

export function coachRankIconPath(game: string, rank: string) {
  const gameDirectory = game === "valorant" ? "valorant" : "league";
  const tier = rank.toLowerCase();
  return `/images/ranks/${gameDirectory}/${tier}${game === "valorant" && tier !== "radiant" ? "-1" : ""}.png`;
}

export function coachRankCardIconPath(game: string, rank: string) {
  const gameDirectory = game === "valorant" ? "valorant" : "league";
  const tier = rank.toLowerCase();
  return `/images/ranks/cards/${gameDirectory}/${tier}${game === "valorant" && tier !== "radiant" ? "-1" : ""}.webp`;
}

export function coachGameLogoPath(game: string) {
  if (game === "valorant") return "/images/logos/valorant.png";
  if (game === "teamfight-tactics") return "/images/logos/teamfight-tactics-source.png";
  return "/images/logos/league-of-legends-mark.png";
}
