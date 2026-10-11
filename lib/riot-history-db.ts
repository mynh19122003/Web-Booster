import { authDatabase } from "@/lib/auth-db";
import type { LinkedRiotAccount } from "@/lib/coach-riot-db";
import type { MatchHistory } from "@/lib/riot-types";

function database() {
  const db = authDatabase();
  db.exec("CREATE TABLE IF NOT EXISTS riot_history_snapshots (account_key TEXT PRIMARY KEY, history TEXT NOT NULL)");
  return db;
}
export function riotHistoryKey(account: LinkedRiotAccount, tft: boolean) {
  return JSON.stringify([tft, account.platform, account.puuid, account.gameName, account.tagLine]);
}
export function savedRiotHistory(account: LinkedRiotAccount, tft: boolean): MatchHistory | null {
  const row = database().prepare("SELECT history FROM riot_history_snapshots WHERE account_key = ?").get(riotHistoryKey(account, tft)) as { history: string } | undefined;
  if (!row) return null;
  try { return JSON.parse(row.history) as MatchHistory; } catch { return null; }
}
export function saveRiotHistory(account: LinkedRiotAccount, tft: boolean, history: MatchHistory) {
  if (history.status !== "ready") return;
  database().prepare("INSERT INTO riot_history_snapshots VALUES (?, ?) ON CONFLICT(account_key) DO UPDATE SET history=excluded.history")
    .run(riotHistoryKey(account, tft), JSON.stringify(history));
}
