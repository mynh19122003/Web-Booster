import { mockState } from "@/lib/mock-state";
import type { Coach } from "@/data/coaches";
import type { MatchHistory } from "@/lib/riot-types";
import { riotPlatforms } from "@/lib/riot-types";
import { playerRank } from "@/lib/riot-display";

export type CoachRiotProfile = { employeeId: string; game: "lol" | "tft"; history: MatchHistory };
export function saveCoachRiotProfile(slug: string, profile: CoachRiotProfile) {
  if (profile.history.status !== "ready" || !profile.history.account) throw new Error("invalid-riot-profile");
  mockState.coachRiotProfiles.set(slug, structuredClone(profile));
}
export function coachRiotProfile(slug: string): CoachRiotProfile | null {
  return mockState.coachRiotProfiles.get(slug) as CoachRiotProfile ?? null;
}
export function applyCoachRiotProfile(coach: Coach): Coach {
  const profile = coachRiotProfile(coach.slug);
  if (!profile) return coach;
  const rank = playerRank(profile.history, profile.game === "tft");
  return { ...coach, game: profile.game === "tft" ? "teamfight-tactics" : "league-of-legends", gameName: profile.game === "tft" ? "Teamfight Tactics" : "League of Legends",
    server: riotPlatforms[profile.history.account!.platform],
    peakRank: rank ? rank.tier.charAt(0) + rank.tier.slice(1).toLowerCase() : profile.history.rankError ? "—" : "Unranked",
    riotProfile: profile };
}
