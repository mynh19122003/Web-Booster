import { authDatabase } from "@/lib/auth-db";
import type { LinkedRiotAccount } from "@/lib/coach-riot-db";
import type { CoachChampionStats, TopChampionSummary } from "@/lib/riot-types";
import { riotHistoryKey } from "@/lib/riot-history-db";
import { paceHistoryRequests, RiotError, riotRegions, riotRequest } from "@/lib/riot-api";
import { lolChampions } from "@/data/lol-champions";
import { lolChampionImageKeys } from "@/data/lol-champion-image-keys";

const state = globalThis as typeof globalThis & { championStatsPending?: Map<string, Promise<CoachChampionStats>> };
const pending = state.championStatsPending ??= new Map();
function database() {
  const db = authDatabase();
  db.exec("CREATE TABLE IF NOT EXISTS riot_champion_stats (account_key TEXT PRIMARY KEY, summary TEXT NOT NULL)");
  return db;
}
export async function coachChampionStats(account: LinkedRiotAccount, fresh = false): Promise<CoachChampionStats> {
  const key = riotHistoryKey(account, false);
  const db = database();
  const row = db.prepare("SELECT summary FROM riot_champion_stats WHERE account_key = ?").get(key) as { summary: string } | undefined;
  let saved: CoachChampionStats | undefined;
  if (row) { try { saved = JSON.parse(row.summary); } catch {} }
  if (!fresh && saved?.status === "ready" && saved.updatedAt && saved.updatedAt + 3_600_000 > Date.now()) return saved;
  const running = pending.get(key);
  if (running) return running;
  const task = (async (): Promise<CoachChampionStats> => {
    try {
      const host = riotRegions[account.platform];
      const base = "/lol/match/v5/matches";
      const options = { game: "lol", ...(fresh ? {} : { revalidate: 3600 }) };
      await paceHistoryRequests(1);
      const ids = await riotRequest<unknown>(host, `${base}/by-puuid/${encodeURIComponent(account.puuid)}/ids?queue=420&start=0&count=30`, options);
      if (!Array.isArray(ids) || ids.length > 30 || ids.some(id => typeof id !== "string" || !id)) throw new RiotError("invalid-response");
      const champions = new Map<number, TopChampionSummary>();
      let sampleSize = 0;
      const uniqueIds = [...new Set(ids)] as string[];
      for (let i = 0; i < uniqueIds.length; i += 2) {
        await paceHistoryRequests(Math.min(2, uniqueIds.length - i));
        const details = await Promise.all(uniqueIds.slice(i, i + 2).map(id => riotRequest<{
          info?: { queueId?: number; participants?: { puuid: string; championId: number; championName: string; win: boolean }[] };
        }>(host, `${base}/${encodeURIComponent(id)}`, options)));
        for (const detail of details) {
          if (!detail.info || !Array.isArray(detail.info.participants)) throw new RiotError("invalid-response");
          if (detail.info.queueId !== 420) continue;
          const player = detail.info.participants.find(participant => participant.puuid === account.puuid);
          if (!player || !Number.isInteger(player.championId) || player.championId <= 0 || typeof player.championName !== "string" || typeof player.win !== "boolean") throw new RiotError("invalid-response");
          const championKey = Object.keys(lolChampionImageKeys).find(name => lolChampionImageKeys[name] === player.championId) ?? player.championName;
          const summary = champions.get(player.championId) ?? { championId: player.championId, championKey,
            championName: lolChampions.find(champion => champion.id === championKey)?.name ?? player.championName,
            gamesPlayed: 0, wins: 0, winRate: 0 };
          summary.gamesPlayed++; summary.wins += Number(player.win);
          champions.set(player.championId, summary); sampleSize++;
        }
      }
      const value: CoachChampionStats = { status: "ready", sampleSize, updatedAt: Date.now(),
        topChampions: [...champions.values()].sort((a, b) => b.gamesPlayed - a.gamesPlayed || b.wins - a.wins || a.championId - b.championId)
          .slice(0, 5).map(champion => ({ ...champion, winRate: Math.round(champion.wins / champion.gamesPlayed * 100) })) };
      db.prepare("INSERT INTO riot_champion_stats VALUES (?, ?) ON CONFLICT(account_key) DO UPDATE SET summary=excluded.summary").run(key, JSON.stringify(value));
      return value;
    } catch (error) {
      const problem = error instanceof RiotError ? error : new RiotError("riot-unavailable");
      // A failed refresh must never replace a previously complete sample with partial numbers.
      return { ...(!fresh && saved ? saved : { topChampions: [], sampleSize: 0 }), status: !fresh && saved ? "ready" : "unavailable", error: problem.code, retryAfter: problem.retryAfter };
    }
  })();
  pending.set(key, task);
  try { return await task; } finally { pending.delete(key); }
}
