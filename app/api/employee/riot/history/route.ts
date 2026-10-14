import { NextResponse } from "next/server";
import { currentUser } from "@/lib/current-user";
import { authError, isSameOrigin } from "@/lib/auth-http";
import { parseRiotId } from "@/lib/riot-id";
import { resolveRiotAccount, riotMatchHistory, RiotError } from "@/lib/riot-api";
import { riotPlatforms, type RiotPlatform } from "@/lib/riot-types";
import { canManageCoach, managedCoachBases } from "@/lib/coach-ownership";
import { saveCoachRiotProfile } from "@/lib/coach-riot-profile";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await currentUser();
  if (!isSameOrigin(request)) return authError("invalid-request", 403);
  let body;
  try { body = await request.json(); } catch { return authError("invalid-request", 400); }
  if (!user) return authError("unauthorized", 401);
  if (user && user.role !== "employee") return authError("employee-only", 403);
  const riotId = parseRiotId(body?.riotId);
  if (!riotId || !["lol", "tft"].includes(body.game) || typeof body.platform !== "string" ||
    !Object.hasOwn(riotPlatforms, body.platform)) return authError("invalid-request", 400);
  try {
    const tft = body.game === "tft";
    const account = await resolveRiotAccount(riotId.gameName, riotId.tagLine, body.platform as RiotPlatform, tft);
    const history = await riotMatchHistory(account, tft, true);
    if (body.publishProfile === true && history.status === "ready") {
      // Derive ownership on the server. Never let a client select another coach's slug.
      const coach = managedCoachBases(user).find(row => canManageCoach(user, row.slug));
      if (coach) saveCoachRiotProfile(coach.slug, { employeeId: user.id, game: tft ? "tft" : "lol", history });
    }
    const status = history.status === "ready" ? 200 : history.error === "rate-limited" ? 429 : 503;
    return NextResponse.json(history, { status, headers: {
      "Cache-Control": "no-store", ...(status !== 200 ? { "Retry-After": String(history.retryAfter ?? 60) } : {}),
    } });
  } catch (error) {
    const problem = error instanceof RiotError ? error : new RiotError("riot-unavailable");
    return NextResponse.json({ error: problem.code, retryAfter: problem.retryAfter }, {
      status: problem.status, headers: { "Cache-Control": "no-store", "Retry-After": String(problem.retryAfter) },
    });
  }
}
