import type { Coach } from "@/data/coaches";

export type CoachOffer = {
  id: string;
  startRank: string;
  targetRank: string;
  price: number;
  featured?: boolean;
};

export function coachOffers(coach: Coach): CoachOffer[] {
  const tft = coach.game === "teamfight-tactics";
  const valorant = coach.game === "valorant";
  const scale = coach.hourlyRate / 24;
  const ranges = valorant
    ? [["Gold", "Platinum"], ["Platinum", "Diamond"], ["Diamond", "Ascendant"], ["Ascendant", "Radiant"], ["Unranked", "Unranked"]]
    : tft
      ? [["Iron", "Gold"], ["Gold", "Emerald"], ["Emerald", "Diamond"], ["Diamond", "Challenger"], ["Unranked", "Unranked"]]
      : [["Iron", "Emerald"], ["Emerald", "Diamond"], ["Diamond", "Master"], ["Master", "Challenger"], ["Unranked", "Unranked"]];
  const prices = [3.99, 7.99, 12.99, 16.99, 2.99];

  return ranges.map(([startRank, targetRank], index) => ({
    id: `duo-${index}`,
    startRank,
    targetRank,
    price: Math.round(prices[index] * scale * 100) / 100,
    featured: index === 2,
  }));
}

export function coachRankHistory(game: string) {
  const ranks = game === "valorant"
    ? ["Gold", "Platinum", "Diamond", "Ascendant", "Immortal", "Radiant"]
    : ["Silver", "Gold", "Platinum", "Emerald", "Diamond", "Master", "Grandmaster", "Challenger"];
  return ranks.map((rank, index) => ({ rank, winRate: [51, 54, 56, 59, 63, 68, 72, 76][index] }));
}

export function coachReputation(coach: Coach) {
  const four = Math.round(coach.reviewCount * 0.035);
  const three = Math.round(coach.reviewCount * 0.01);
  const two = Math.round(coach.reviewCount * 0.003);
  const five = Math.min(coach.reviewCount - four - three - two, Math.round(coach.reviewCount * Math.min(0.985, 0.92 + (coach.rating - 4.5) * 0.13)));
  return [
    { stars: 5, count: Math.max(0, five), width: 98 },
    { stars: 4, count: four, width: 38 },
    { stars: 3, count: three, width: 14 },
    { stars: 2, count: two, width: 7 },
    { stars: 1, count: Math.max(0, coach.reviewCount - five - four - three - two), width: 4 },
  ];
}

export function coachMockMetrics(coach: Coach) {
  return {
    completedOrders: coach.students * 8 + coach.reviewCount,
    gamesWon: coach.students * 41 + coach.reviewCount * 3,
    since: 2026 - coach.yearsCoaching,
  };
}
