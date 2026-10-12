import type { Coach } from "@/data/coaches";
import { coachRiotAccount } from "@/lib/coach-riot-db";
import { cachedRiotMatchHistory } from "@/lib/riot-api";
import type { MatchHistory } from "@/lib/riot-types";

export function cachedCoachHistory(coach: Coach): MatchHistory | null {
  if (coach.game === "valorant") return { status: "unsupported", matches: [] };
  const account = coachRiotAccount(coach.slug);
  return account ? cachedRiotMatchHistory(account, coach.game === "teamfight-tactics") : { status: "unlinked", matches: [] };
}
