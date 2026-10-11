"use client";
import type { MatchHistory } from "@/lib/riot-types";
import { RiotProfileHistory } from "@/components/coaches/RiotProfileHistory";

export function RiotMatchPreview({ history, tft }: { history: MatchHistory; tft: boolean }) {
  return <RiotProfileHistory key={`${history.account?.gameName}#${history.account?.tagLine}`} history={history} tft={tft} />;
}
