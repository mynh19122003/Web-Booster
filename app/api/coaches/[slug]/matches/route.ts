import { after, NextResponse } from "next/server";
import { getCoachWithOverride } from "@/lib/coach-profile-db";
import { coachRiotAccount } from "@/lib/coach-riot-db";
import { cachedRiotMatchHistory, riotMatchHistory } from "@/lib/riot-api";
export const runtime = "nodejs";
export async function GET(request: Request, context: { params: Promise<{ slug: string }> }) {
  const coach = getCoachWithOverride((await context.params).slug);
  if (!coach) return NextResponse.json({ error: "not-found" }, { status: 404 });
  const headers = { "Cache-Control": "no-store" };
  if (coach.game === "valorant") return NextResponse.json({ status: "unsupported", matches: [] }, { headers });
  const account = coachRiotAccount(coach.slug);
  if (!account) return NextResponse.json({ status: "unlinked", matches: [] }, { headers });
  const tft = coach.game === "teamfight-tactics";
  const fresh = new URL(request.url).searchParams.get("refresh") === "1";
  const saved = fresh ? null : cachedRiotMatchHistory(account, tft);
  if (saved) {
    if (!saved.updatedAt || saved.updatedAt + (saved.rankError ? 60_000 : 300_000) <= Date.now()) {
      after(async () => { await riotMatchHistory(account, tft); });
    }
    return NextResponse.json(saved, { headers });
  }
  const history = await riotMatchHistory(account, tft, fresh);
  return NextResponse.json(history, { headers: { ...headers, ...(history.retryAfter ? { "Retry-After": String(history.retryAfter) } : {}) } });
}
