export type PromotionTier = "Master" | "Grandmaster" | "Challenger";

export const rankPromotionVideos: Record<PromotionTier, string> = {
  Master: "/videos/rank-promotions/master-smooth.webm",
  Grandmaster: "/videos/rank-promotions/grandmaster-smooth.webm",
  Challenger: "/videos/rank-promotions/challenger-smooth.webm",
};

export function rankPromotionVideoFor(game: string, tier: string) {
  if (game !== "league-of-legends") return undefined;
  return Object.hasOwn(rankPromotionVideos, tier) ? rankPromotionVideos[tier as PromotionTier] : undefined;
}

export function rankPromotionPosterFor(game: string, tier: string) {
  if (game !== "league-of-legends" || !Object.hasOwn(rankPromotionVideos, tier)) return undefined;
  return `/videos/rank-promotions/${tier.toLowerCase()}-smooth-rest.png`;
}
