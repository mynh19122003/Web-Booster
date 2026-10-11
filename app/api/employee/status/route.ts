import { NextResponse } from "next/server";
import { currentUser } from "@/lib/current-user";
import { authError, isSameOrigin } from "@/lib/auth-http";
import { managedCoachBases } from "@/lib/coach-ownership";
import { applyCoachOverride, coachProfileOverride, saveCoachProfile } from "@/lib/coach-profile-db";
import { saveEmployeePresence, storedEmployeePresence } from "@/lib/employee-presence";

export const runtime = "nodejs";

export async function GET() {
  const user = await currentUser();
  if (!user) return authError("unauthorized", 401);
  if (user.role !== "employee") return authError("employee-only", 403);
  const coaches = managedCoachBases(user);
  const stored = storedEmployeePresence(user.id);
  const isOnline = stored ?? (coaches.length === 1 ? applyCoachOverride(coaches[0], coachProfileOverride(coaches[0].slug)).online : false);
  return NextResponse.json({ success: true, isOnline }, { headers: { "Cache-Control": "no-store" } });
}

export async function PATCH(request: Request) {
  if (!isSameOrigin(request)) return authError("invalid-request", 403);
  const user = await currentUser();
  if (!user) return authError("unauthorized", 401);
  if (user.role !== "employee") return authError("employee-only", 403);
  let body: unknown;
  try { body = await request.json(); } catch { return authError("invalid-request", 400); }
  if (!body || typeof body !== "object" || !("isOnline" in body) || typeof body.isOnline !== "boolean") return authError("invalid-request", 400);
  const coaches = managedCoachBases(user);
  saveEmployeePresence(user.id, body.isOnline);
  if (coaches.length === 1) saveCoachProfile(coaches[0].slug, { online: body.isOnline });
  return NextResponse.json({ success: true, isOnline: body.isOnline }, { headers: { "Cache-Control": "no-store" } });
}
