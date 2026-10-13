import { authDatabase } from "@/lib/auth-db";
import type { Coach } from "@/data/coaches";
import type { MatchHistory } from "@/lib/riot-types";
import { riotPlatforms } from "@/lib/riot-types";
import { playerRank } from "@/lib/riot-display";

export type CoachRiotProfile = { employeeId: string; game: "lol" | "tft"; history: MatchHistory };
function database() {
  const db = authDatabase();
  db.exec("CREATE TABLE IF NOT EXISTS coach_riot_profiles (slug TEXT PRIMARY KEY, profile TEXT NOT NULL)");
  return db;
}
export function saveCoachRiotProfile(slug: string, profile: CoachRiotProfile) {
  if (profile.history.status !== "ready" || !profile.history.account) throw new Error("invalid-riot-profile");
  database().prepare("INSERT INTO coach_riot_profiles VALUES (?, ?) ON CONFLICT(slug) DO UPDATE SET profile=excluded.profile").run(slug, JSON.stringify(profile));
}
export function coachRiotProfile(slug: string): CoachRiotProfile | null {
  const row = database().prepare("SELECT profile FROM coach_riot_profiles WHERE slug=?").get(slug) as { profile: string } | undefined;
  return row ? JSON.parse(row.profile) as CoachRiotProfile : null;
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
