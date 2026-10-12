import { NextResponse } from "next/server";
import { canManageCoach, coachAccess, coachBase, coachPublished, createEmployeeCoach, managedCoachBases, type NewCoachInput } from "@/lib/coach-ownership";
import { coachRanksByGame } from "@/data/coaches";
import { currentUser } from "@/lib/current-user";
import { authError } from "@/lib/auth-http";
import { coachRiotAccount, linkCoachRiotAccount, unlinkCoachRiotAccount } from "@/lib/coach-riot-db";
import { resolveRiotAccount, RiotError } from "@/lib/riot-api";
import { riotPlatforms, type RiotPlatform } from "@/lib/riot-types";
import { coachProfileOverride, applyCoachOverride } from "@/lib/coach-profile-db";
import { parseRiotId } from "@/lib/riot-id";
export const runtime = "nodejs";
export async function GET() {
  const user = await currentUser();
  if (user?.role !== "employee") return authError("employee-only", 403);
  return NextResponse.json({ scope: coachAccess(user), name: user.name, coaches: managedCoachBases(user).map(coach => {
    const linked = coachRiotAccount(coach.slug);
    const profile = coachProfileOverride(coach.slug);
    return { slug: coach.slug, name: coach.name, game: coach.game, server: coach.server,
      account: linked ? { gameName: linked.gameName, tagLine: linked.tagLine, platform: linked.platform } : null,
      profile, online: applyCoachOverride(coach, profile).online, published: coachPublished(coach.slug), avatar: coach.avatar };
  }) }, { headers: { "Cache-Control": "no-store" } });
}
export async function PATCH(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin) return authError("invalid-request", 403);
  const user = await currentUser();
  if (user?.role !== "employee") return authError("employee-only", 403);
  let body;
  try { body = await request.json(); } catch { return authError("invalid-request", 400); }
  if (!body || typeof body.slug !== "string") return authError("invalid-request", 400);
  if (!canManageCoach(user, body.slug)) return authError("coach-forbidden", 403);
  const coach = coachBase(body.slug);
  if (!coach || coach.game === "valorant") return authError("unsupported-coach", 400);
  if (body.unlink === true) { unlinkCoachRiotAccount(coach.slug); return NextResponse.json({ ok: true }); }
  const riotId = parseRiotId(body.riotId ?? (typeof body.gameName === "string" && typeof body.tagLine === "string" ? `${body.gameName}#${body.tagLine}` : null));
  if (!riotId ||
    typeof body.platform !== "string" || !Object.hasOwn(riotPlatforms, body.platform)) return authError("invalid-request", 400);
  try {
    const account = await resolveRiotAccount(riotId.gameName, riotId.tagLine, body.platform as RiotPlatform, coach.game === "teamfight-tactics");
    linkCoachRiotAccount(coach.slug, account);
    return NextResponse.json({ ok: true, account: { gameName: account.gameName, tagLine: account.tagLine, platform: account.platform } });
  } catch (error) {
    const problem = error instanceof RiotError ? error : new RiotError("riot-unavailable");
    return NextResponse.json({ error: problem.code, retryAfter: problem.retryAfter }, { status: problem.status, headers: { "Retry-After": String(problem.retryAfter) } });
  }
}

export async function POST(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin) return authError("invalid-request", 403);
  const user = await currentUser();
  if (user?.role !== "employee" || coachAccess(user) !== "own") return authError("employee-only", 403);
  let body;
  try { body = await request.json(); } catch { return authError("invalid-request", 400); }
  if (!body || typeof body !== "object") return authError("invalid-request", 400);
  for (const [key, max] of [["name",60],["server",20],["peakRank",30],["bio",1000]] as const) {
    if (typeof body[key] !== "string" || !body[key].trim() || body[key].length > max) return authError("invalid-request", 400);
    body[key] = body[key].trim();
  }
  if (!["league-of-legends","teamfight-tactics","valorant"].includes(body.game) || !Number.isFinite(body.hourlyRate) || body.hourlyRate < 1 || body.hourlyRate > 500) return authError("invalid-request", 400);
  if (!coachRanksByGame[body.game].includes(body.peakRank)) return authError("invalid-request", 400);
  for (const key of ["languages","roles"]) {
    if (!Array.isArray(body[key]) || !body[key].length || body[key].length > 10 || body[key].some((s: unknown) => typeof s !== "string" || !s.trim() || s.length > 60)) return authError("invalid-request", 400);
    body[key] = body[key].map((s: string) => s.trim());
  }
  const coach = createEmployeeCoach(user, body as NewCoachInput);
  if (!coach) return authError("coach-already-linked", 409);
  return NextResponse.json({ ok: true, slug: coach.slug }, { status: 201 });
}
