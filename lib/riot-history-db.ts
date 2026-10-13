import { mockState } from "@/lib/mock-state";
import type { LinkedRiotAccount } from "@/lib/coach-riot-db";
import type { MatchHistory } from "@/lib/riot-types";

export function riotHistoryKey(account: LinkedRiotAccount, tft: boolean) {
  return JSON.stringify([tft, account.platform, account.puuid, account.gameName, account.tagLine]);
}
export function savedRiotHistory(account: LinkedRiotAccount, tft: boolean): MatchHistory | null {
  return mockState.riotHistory.get(riotHistoryKey(account, tft)) as MatchHistory ?? null;
}
export function saveRiotHistory(account: LinkedRiotAccount, tft: boolean, history: MatchHistory) {
  if (history.status === "ready") mockState.riotHistory.set(riotHistoryKey(account, tft), structuredClone(history));
}
