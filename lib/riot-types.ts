export const riotPlatforms = {
  euw1: "EUW", eun1: "EUNE", na1: "NA", kr: "KR", jp1: "JP", br1: "BR",
  la1: "LAN", la2: "LAS", tr1: "TR", ru: "RU", oc1: "OCE", sg2: "SG",
  th2: "TH", tw2: "TW", vn2: "VN", ph2: "PH", me1: "ME",
} as const;
export type RiotPlatform = keyof typeof riotPlatforms;
export type RiotAccount = { gameName: string; tagLine: string; platform: RiotPlatform };
export type TopChampionSummary = {
  championId: number; championKey: string; championName: string;
  gamesPlayed: number; wins: number; winRate: number;
};
export type CoachChampionStats = {
  status: "ready" | "unlinked" | "unsupported" | "unavailable";
  topChampions: TopChampionSummary[]; sampleSize: number; updatedAt?: number;
  error?: string; retryAfter?: number;
};
export type RiotMatch = {
  id: string; pick: string; championId?: string; won: boolean; role: string; mode: string;
  kills?: number; deaths?: number; assists?: number; placement?: number;
  queueId?: number; level?: number; cs?: number; gold?: number; damage?: number; items?: number[];
  duration: number; playedAt: number;
};
export type RiotRank = { queue: string; tier: string; division: string; leaguePoints: number; wins: number; losses: number };
export type MatchHistory = {
  status: "ready" | "unlinked" | "unsupported" | "unavailable";
  account?: RiotAccount; matches: RiotMatch[]; updatedAt?: number;
  ranks?: RiotRank[]; rankError?: string;
  error?: string; retryAfter?: number;
};
