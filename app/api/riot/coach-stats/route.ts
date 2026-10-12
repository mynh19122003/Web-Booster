import { NextResponse } from "next/server";
import { getAllCoachesWithOverrides, getCoachWithOverride } from "@/lib/coach-profile-db";
import { coachRiotAccount } from "@/lib/coach-riot-db";
import { coachChampionStats } from "@/lib/coach-champion-stats";
import { riotRegions } from "@/lib/riot-api";

export const runtime = "nodejs";
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const slug = params.get("coach");
  // Only published, linked coaches are queryable; this endpoint is not an arbitrary PUUID proxy.
  const coach = slug ? getCoachWithOverride(slug) : getAllCoachesWithOverrides().find(candidate => {
    const account = coachRiotAccount(candidate.slug);
    const region = params.get("region")?.toLowerCase();
    return account && account.puuid === params.get("puuid") && (region === account.platform || region === riotRegions[account.platform]);
  });
  const headers = { "Cache-Control": "no-store" };
  if (!coach) return NextResponse.json({ error: "not-found" }, { status: 404, headers });
  if (coach.game !== "league-of-legends") return NextResponse.json({ status: "unsupported", topChampions: [], sampleSize: 0 }, { headers });
  const account = coachRiotAccount(coach.slug);
  if (!account) return NextResponse.json({ status: "unlinked", topChampions: [], sampleSize: 0 }, { headers });
  const stats = await coachChampionStats(account, params.get("refresh") === "1");
  return NextResponse.json(stats, { headers: { ...headers, ...(stats.retryAfter ? { "Retry-After": String(stats.retryAfter) } : {}) } });
}
