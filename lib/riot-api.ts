import type { LinkedRiotAccount } from "@/lib/coach-riot-db";
import type { MatchHistory, RiotMatch, RiotPlatform, RiotRank } from "@/lib/riot-types";
import { lolChampions } from "@/data/lol-champions";
import { savedRiotHistory, saveRiotHistory } from "@/lib/riot-history-db";

export class RiotError extends Error {
  constructor(public code: string, public status = 503, public retryAfter = 60) { super(code); }
}
export const riotRegions: Record<RiotPlatform, string> = {
  euw1: "europe", eun1: "europe", tr1: "europe", ru: "europe", me1: "europe",
  na1: "americas", br1: "americas", la1: "americas", la2: "americas",
  kr: "asia", jp1: "asia", oc1: "sea", sg2: "sea", th2: "sea", tw2: "sea", vn2: "sea", ph2: "sea",
};
const regions = riotRegions;
// Shared across requests: cache per account and reserve budget before every upstream request.
const state = globalThis as typeof globalThis & { riotState?: {
  requests: number[]; blockedUntil: number;
  cache: Map<string, { expires: number; value: MatchHistory }>;
  pending: Map<string, Promise<MatchHistory>>;
} };
const shared = state.riotState ??= { requests: [], blockedUntil: 0, cache: new Map(), pending: new Map() };

export function riotApiKey(game: string = "lol", tournament = false) {
  if (tournament) return process.env.RIOT_TOURNAMENT_API_KEY;
  return (game === "valorant" ? process.env.RIOT_VALORANT_API_KEY : game === "tft" ? process.env.RIOT_TFT_API_KEY : process.env.RIOT_LOL_API_KEY) || process.env.RIOT_API_KEY;
}

export async function riotRequest<T>(host: string, path: string, options: { game?: string; tournament?: boolean; accessToken?: string; revalidate?: number } = {}): Promise<T> {
  if (!/^[a-z0-9]+$/.test(host) || !path.startsWith("/") || path.startsWith("//") || path.includes("\\")) throw new RiotError("invalid-request", 400, 0);
  const key = riotApiKey(options.game, options.tournament);
  if (!options.accessToken && !key) throw new RiotError("key-missing", 503, 0);
  const now = Date.now();
  shared.requests = shared.requests.filter(time => now - time < 120_000);
  const short = shared.requests.filter(time => now - time < 1000);
  const waitUntil = Math.max(shared.blockedUntil,
    short.length >= 18 ? short[0] + 1000 : 0,
    shared.requests.length >= 90 ? shared.requests[0] + 120_000 : 0);
  if (waitUntil > now) throw new RiotError("rate-limited", 429, Math.ceil((waitUntil - now) / 1000));
  shared.requests.push(now);
  let response: Response;
  try {
    response = await fetch(`https://${host}.api.riotgames.com${path}`, {
      headers: options.accessToken ? { Authorization: `Bearer ${options.accessToken}` } : { "X-Riot-Token": key! },
      ...(options.revalidate ? { cache: "force-cache" as const, next: { revalidate: options.revalidate } } : { cache: "no-store" as const }),
      signal: AbortSignal.timeout(10_000), redirect: "error",
    });
  } catch { throw new RiotError("connection-failed"); }
  if (!response.ok) {
    if (response.status === 429) {
      const seconds = Number(response.headers.get("retry-after"));
      const retry = Number.isFinite(seconds) && seconds > 0 ? Math.ceil(seconds) : 120;
      shared.blockedUntil = Date.now() + retry * 1000;
      throw new RiotError("rate-limited", 429, retry);
    }
    if ([401, 403].includes(response.status)) throw new RiotError(options.accessToken ? "rso-expired" : "key-rejected", 503, 0);
    if (response.status === 404) throw new RiotError("account-not-found", 404);
    if (response.status === 400) throw new RiotError("invalid-parameters", 400, 0);
    throw new RiotError("riot-unavailable");
  }
  try { return await response.json() as T; } catch { throw new RiotError("invalid-response"); }
}
const riot = riotRequest;

export async function resolveRiotAccount(gameName: string, tagLine: string, platform: RiotPlatform, tft: boolean): Promise<LinkedRiotAccount> {
  const region = regions[platform];
  const game = tft ? "tft" : "lol";
  const accountHost = region === "sea" ? "asia" : region;
  const account = await riot<{ puuid: string; gameName: string; tagLine: string }>(accountHost,
    `/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`, { game });
  if (!account.puuid || !account.gameName || !account.tagLine) throw new RiotError("invalid-response");
  const active = await riot<{ region: string }>(accountHost, `/riot/account/v1/region/by-game/${game}/by-puuid/${encodeURIComponent(account.puuid)}`, { game });
  if (typeof active.region !== "string") throw new RiotError("invalid-response");
  const activePlatform = active.region.toLowerCase();
  if (Object.hasOwn(regions, activePlatform)) platform = activePlatform as RiotPlatform;
  await riot(platform, `/${tft ? "tft/summoner/v1" : "lol/summoner/v4"}/summoners/by-puuid/${encodeURIComponent(account.puuid)}`, { game: tft ? "tft" : "lol" });
  return { gameName: account.gameName, tagLine: account.tagLine, puuid: account.puuid, platform };
}

type Participant = { puuid: string; championName: string; win: boolean; kills: number; deaths: number; assists: number;
  teamPosition?: string; placement: number; level: number; champLevel?: number;
  totalMinionsKilled?: number; neutralMinionsKilled?: number; goldEarned?: number; totalDamageDealtToChampions?: number;
  item0?: number; item1?: number; item2?: number; item3?: number; item4?: number; item5?: number; item6?: number };
type MatchDto = { metadata: { match_id?: string; matchId?: string }; info: { participants: Participant[]; queueId: number;
  gameMode: string; gameDuration: number; gameEndTimestamp?: number; gameCreation: number;
  game_datetime: number; game_length: number; queue_id: number } };
const queues: Record<number, string> = { 420: "Ranked Solo/Duo", 440: "Ranked Flex", 450: "ARAM", 400: "Normal Draft", 490: "Quickplay", 1700: "Arena", 1100: "TFT Ranked", 1090: "TFT Normal", 1160: "Double Up", 1130: "Hyper Roll" };
const positions: Record<string, string> = { TOP: "Top", JUNGLE: "Jungle", MIDDLE: "Mid", BOTTOM: "ADC", UTILITY: "Support" };
export function normalizeMatch(dto: MatchDto, puuid: string, tft: boolean): RiotMatch | null {
  const info = dto.info;
  const player = info?.participants?.find(p => p.puuid === puuid);
  const id = tft ? dto.metadata?.match_id : dto.metadata?.matchId;
  if (!player || !id || (!tft && info.queueId === 0)) return null;
  // Older League payloads sometimes express duration in milliseconds.
  const duration = tft ? info.game_length : info.gameDuration > 100_000 ? info.gameDuration / 1000 : info.gameDuration;
  const playedAt = tft ? info.game_datetime : info.gameEndTimestamp ?? info.gameCreation + duration * 1000;
  if (!Number.isFinite(duration) || !Number.isFinite(playedAt)) return null;
  return {
    id, pick: tft ? "Teamfight Tactics" : lolChampions.find(champion => champion.id === player.championName)?.name ?? player.championName,
    ...(tft ? { placement: player.placement, level: player.level } : {
      championId: player.championName, kills: player.kills ?? 0, deaths: player.deaths ?? 0, assists: player.assists ?? 0,
      level: player.champLevel, cs: (player.totalMinionsKilled ?? 0) + (player.neutralMinionsKilled ?? 0),
      gold: player.goldEarned ?? 0, damage: player.totalDamageDealtToChampions ?? 0,
      items: [player.item0, player.item1, player.item2, player.item3, player.item4, player.item5, player.item6].map(item => Number.isInteger(item) && item! > 0 ? item! : 0),
    }),
    won: tft ? player.placement <= 4 : player.win,
    role: tft ? `Level ${player.level}` : positions[player.teamPosition ?? ""] ?? player.teamPosition ?? "—",
    mode: queues[tft ? info.queue_id : info.queueId] ?? info.gameMode ?? "TFT",
    queueId: tft ? info.queue_id : info.queueId, duration: Math.round(duration), playedAt,
  };
}

export function normalizeRanks(value: unknown): RiotRank[] {
  if (!Array.isArray(value)) throw new RiotError("invalid-response");
  return value.filter(entry => entry && typeof entry.queueType === "string" && typeof entry.tier === "string" &&
    typeof entry.rank === "string" && [entry.leaguePoints, entry.wins, entry.losses].every(number => Number.isFinite(number) && number >= 0))
    .map(entry => ({ queue: entry.queueType, tier: entry.tier, division: entry.rank,
      leaguePoints: entry.leaguePoints, wins: entry.wins, losses: entry.losses }));
}

export async function paceHistoryRequests(slots: number) {
  const recent = shared.requests.filter(time => Date.now() - time < 1000);
  if (recent.length + slots > 18) await new Promise(resolve => setTimeout(resolve, Math.max(1, recent[0] + 1001 - Date.now())));
}

export function cachedRiotMatchHistory(account: LinkedRiotAccount, tft: boolean): MatchHistory | null {
  const value = shared.cache.get(`${tft}:${account.platform}:${account.puuid}:${account.gameName}#${account.tagLine}`)?.value;
  const saved = savedRiotHistory(account, tft);
  if (value?.status === "ready") {
    if (saved?.updatedAt && saved.updatedAt >= (value.updatedAt ?? 0)) return saved;
    if (value.updatedAt !== saved?.updatedAt) saveRiotHistory(account, tft, value);
    return value;
  }
  return saved;
}

export async function riotMatchHistory(account: LinkedRiotAccount, tft: boolean): Promise<MatchHistory> {
  const cacheKey = `${tft}:${account.platform}:${account.puuid}:${account.gameName}#${account.tagLine}`;
  const cached = shared.cache.get(cacheKey);
  if (cached && cached.expires > Date.now()) return cached.value;
  const saved = savedRiotHistory(account, tft);
  if (saved?.updatedAt && saved.updatedAt + (saved.rankError ? 60_000 : 300_000) > Date.now()) return saved;
  const running = shared.pending.get(cacheKey);
  if (running) return running;
  const task = (async (): Promise<MatchHistory> => {
    const publicAccount = { gameName: account.gameName, tagLine: account.tagLine, platform: account.platform };
    try {
      const host = regions[account.platform];
      const base = tft ? "/tft/match/v1/matches" : "/lol/match/v5/matches";
      const ids = await riot<string[]>(host, `${base}/by-puuid/${encodeURIComponent(account.puuid)}/ids?start=0&count=20`, { game: tft ? "tft" : "lol" });
      if (!Array.isArray(ids) || ids.some(id => typeof id !== "string")) throw new RiotError("invalid-response");
      const matches: RiotMatch[] = [];
      // Small batches avoid bursting the development key's one-second limit.
      for (let i = 0; i < Math.min(ids.length, 20); i += 2) {
        // Pace long histories locally; upstream Retry-After is still enforced by riotRequest.
        await paceHistoryRequests(2);
        const details = await Promise.all(ids.slice(i, i + 2).map(id => riot<MatchDto>(host, `${base}/${encodeURIComponent(id)}`, { game: tft ? "tft" : "lol" })));
        for (const detail of details) { const match = normalizeMatch(detail, account.puuid, tft); if (match) matches.push(match); }
      }
      let ranks: RiotRank[] | undefined;
      let rankError: string | undefined;
      try {
        await paceHistoryRequests(1);
        ranks = normalizeRanks(await riot<unknown>(account.platform,
          `${tft ? "/tft/league/v1/by-puuid" : "/lol/league/v4/entries/by-puuid"}/${encodeURIComponent(account.puuid)}`, { game: tft ? "tft" : "lol" }));
      } catch (error) { rankError = error instanceof RiotError ? error.code : "riot-unavailable"; }
      const value: MatchHistory = { status: "ready", account: publicAccount, matches, ranks, rankError, updatedAt: Date.now() };
      shared.cache.set(cacheKey, { expires: Date.now() + (rankError ? 60_000 : 300_000), value });
      saveRiotHistory(account, tft, value);
      return value;
    } catch (error) {
      const problem = error instanceof RiotError ? error : new RiotError("riot-unavailable");
      const value: MatchHistory = { status: "unavailable", account: publicAccount, matches: [], error: problem.code, retryAfter: problem.retryAfter };
      shared.cache.set(cacheKey, { expires: Date.now() + problem.retryAfter * 1000, value });
      return value;
    }
  })();
  shared.pending.set(cacheKey, task);
  try { return await task; } finally { shared.pending.delete(cacheKey); }
}
