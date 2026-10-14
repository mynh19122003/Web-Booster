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
      : [["Iron", "Bronze"], ["Emerald", "Diamond"], ["Diamond", "Master"], ["Master", "Challenger"], ["Unranked", "Unranked"]];
  const prices = [3.99, 7.99, 12.99, 16.99, 2.99];

  return ranges.map(([startRank, targetRank], index) => ({
    id: `duo-${index}`,
    startRank,
    targetRank,
    price: Math.round(prices[index] * scale * 100) / 100,
    featured: index === 2,
  }));
}

export function coachPricing(unitPrice: number, quantity: number) {
  const discountRate = quantity >= 5 ? 0.1 : quantity >= 3 ? 0.05 : 0;
  const subtotal = Math.round(unitPrice * quantity * 100) / 100;
  const discount = Math.round(subtotal * discountRate * 100) / 100;
  return { subtotal, discount, discountRate, total: Math.round((subtotal - discount) * 100) / 100 };
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
  ].map(row => ({ ...row, width: coach.reviewCount > 0 ? row.count / coach.reviewCount * 100 : 0 }));
}
