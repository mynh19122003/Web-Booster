import type { RiotMatch, RiotRank } from "@/lib/riot-types";

export const lolMatchFilters = [
  { id: "solo", label: "Ranked Solo", queues: [420] }, { id: "flex", label: "Ranked Flex", queues: [440] },
  { id: "normal", label: "Normal", queues: [400, 430, 480, 490] }, { id: "aram", label: "ARAM", queues: [450] },
  { id: "all", label: "All", queues: [] },
];
export const tftMatchFilters = [
  { id: "ranked", label: "Ranked", queues: [1100] }, { id: "normal", label: "Normal", queues: [1090] },
  { id: "double", label: "Double Up", queues: [1160] }, { id: "hyper", label: "Hyper Roll", queues: [1130] },
  { id: "all", label: "All", queues: [] },
];
export function filterRiotMatches(matches: RiotMatch[], filter: string, tft: boolean) {
  const selected = (tft ? tftMatchFilters : lolMatchFilters).find(item => item.id === filter);
  return !selected || selected.id === "all" ? matches : matches.filter(match => selected.queues.includes(match.queueId ?? -1));
}
export function rankQueueFor(filter: string, tft: boolean) {
  return tft ? filter === "double" ? "RANKED_TFT_DOUBLE_UP" : filter === "hyper" ? "RANKED_TFT_TURBO" : "RANKED_TFT"
    : filter === "flex" ? "RANKED_FLEX_SR" : "RANKED_SOLO_5x5";
}
export function rankWinRate(rank: RiotRank) {
  const games = rank.wins + rank.losses;
  return games ? Math.round(rank.wins / games * 100) : 0;
}
export const riotTierNames: Record<string, string> = {
  IRON: "Sắt", BRONZE: "Đồng", SILVER: "Bạc", GOLD: "Vàng", PLATINUM: "Bạch Kim", EMERALD: "Lục Bảo",
  DIAMOND: "Kim Cương", MASTER: "Cao Thủ", GRANDMASTER: "Đại Cao Thủ", CHALLENGER: "Thách Đấu",
};
