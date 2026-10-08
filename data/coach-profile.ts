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

export function coachRankHistory(game: string, seed = 0) {
  const ranks = game === "valorant"
    ? ["Gold", "Platinum", "Diamond", "Ascendant", "Immortal", "Radiant"]
    : ["Silver", "Gold", "Platinum", "Emerald", "Diamond", "Master", "Grandmaster", "Challenger"];
  return ranks.map((rank, index) => {
    const games = 80 + index * 23 + seed * 7;
    const wins = Math.round(games * ([51, 54, 56, 59, 63, 68, 72, 76][index] + seed % 3) / 100);
    return { rank, wins, losses: games - wins, winRate: Math.round(wins / games * 100) };
  });
}

export function coachPricing(unitPrice: number, quantity: number) {
  const discountRate = quantity >= 5 ? 0.1 : quantity >= 3 ? 0.05 : 0;
  const subtotal = Math.round(unitPrice * quantity * 100) / 100;
  const discount = Math.round(subtotal * discountRate * 100) / 100;
  return { subtotal, discount, discountRate, total: Math.round((subtotal - discount) * 100) / 100 };
}

export function coachMockFeedback(coach: Coach) {
  return [
    { initials: "AK", name: "Alex K.", en: `${coach.name} helped me understand my ${coach.roles[0]} decisions. The practice plan was clear and useful.`, vi: `${coach.name} giúp tôi hiểu các quyết định khi chơi ${coach.roles[0]}. Kế hoạch luyện tập rất rõ ràng.` },
    { initials: "JL", name: "Jamie L.", en: `A focused ${coach.gameName} session with actionable feedback on my mistakes.`, vi: `Buổi học ${coach.gameName} tập trung, có hướng dẫn cụ thể để sửa lỗi của tôi.` },
    { initials: "MT", name: "Minh T.", en: `Patient explanations from ${coach.name}. I know what to work on before my next session.`, vi: `${coach.name} giải thích kiên nhẫn. Tôi biết cần luyện gì trước buổi học tiếp theo.` },
  ];
}

export function coachReputation(coach: Coach) {
  const four = Math.round(coach.reviewCount * 0.035);
  const three = Math.round(coach.reviewCount * 0.01);
  const two = Math.round(coach.reviewCount * 0.003);
  const five = Math.min(coach.reviewCount - four - three - two, Math.round(coach.reviewCount * Math.min(0.985, 0.92 + (coach.rating - 4.5) * 0.13)));
  return [
    { stars: 5, count: Math.max(0, five) },
    { stars: 4, count: four },
    { stars: 3, count: three },
    { stars: 2, count: two },
    { stars: 1, count: Math.max(0, coach.reviewCount - five - four - three - two) },
  ].map(row => ({ ...row, width: row.count / coach.reviewCount * 100 }));
}

export function coachMockMetrics(coach: Coach) {
  return {
    completedOrders: coach.students * 8 + coach.reviewCount,
    gamesWon: coach.students * 41 + coach.reviewCount * 3,
    since: 2026 - coach.yearsCoaching,
  };
}
