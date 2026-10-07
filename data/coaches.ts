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
};

export const coaches: Coach[] = [
  { slug: "luna", name: "Luna", game: "league-of-legends", gameName: "League of Legends", peakRank: "Challenger", rating: 4.98, reviewCount: 186, isMvp: true, hourlyRate: 24, online: true, server: "EUW", sessionFormats: ["live", "vod"], languages: ["English", "Tiếng Việt"], roles: ["Mid", "Support"], students: 420, yearsCoaching: 5, bioKey: "coachBioLuna", accent: "#8b72cf" },
  { slug: "rift", name: "Rift", game: "league-of-legends", gameName: "League of Legends", peakRank: "Grandmaster", rating: 4.94, reviewCount: 132, isMvp: false, hourlyRate: 18, online: false, server: "EUW", sessionFormats: ["live"], languages: ["English", "Deutsch"], roles: ["Jungle", "Top"], students: 286, yearsCoaching: 4, bioKey: "coachBioRift", accent: "#c1824f" },
  { slug: "nova", name: "Nova", game: "valorant", gameName: "Valorant", peakRank: "Radiant", rating: 4.99, reviewCount: 214, isMvp: true, hourlyRate: 32, online: true, server: "NA", sessionFormats: ["live", "vod"], languages: ["English", "한국어"], roles: ["Duelist", "Initiator"], students: 510, yearsCoaching: 6, bioKey: "coachBioNova", accent: "#ca5965" },
  { slug: "vex", name: "Vex", game: "teamfight-tactics", gameName: "Teamfight Tactics", peakRank: "Challenger", rating: 4.96, reviewCount: 98, isMvp: false, hourlyRate: 22, online: true, server: "EUW", sessionFormats: ["vod"], languages: ["English", "Français"], roles: ["Flex", "Economy"], students: 194, yearsCoaching: 3, bioKey: "coachBioVex", accent: "#68a1a8" },
  { slug: "kairo", name: "Kairo", game: "valorant", gameName: "Valorant", peakRank: "Radiant", rating: 4.91, reviewCount: 176, isMvp: false, hourlyRate: 20, online: false, server: "APAC", sessionFormats: ["live"], languages: ["English", "Español"], roles: ["Controller", "Sentinel"], students: 162, yearsCoaching: 3, bioKey: "coachBioKairo", accent: "#4b90ad" },
  { slug: "mira", name: "Mira", game: "league-of-legends", gameName: "League of Legends", peakRank: "Master", rating: 4.89, reviewCount: 64, isMvp: false, hourlyRate: 16, online: true, server: "NA", sessionFormats: ["vod"], languages: ["English", "日本語"], roles: ["ADC", "Support"], students: 118, yearsCoaching: 2, bioKey: "coachBioMira", accent: "#bd7794" },
];

export function coachFor(slug: string) {
  return coaches.find((coach) => coach.slug === slug);
}

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
