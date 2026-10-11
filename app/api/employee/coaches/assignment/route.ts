import { NextResponse } from "next/server";
import { currentUser } from "@/lib/current-user";
import { authError } from "@/lib/auth-http";
import { assignCoach, assignableCoaches, coachAccess, unassignedEmployees } from "@/lib/coach-ownership";

export const runtime = "nodejs";
export async function GET() {
  const user = await currentUser();
  if (!user || user.role !== "employee" || coachAccess(user) !== "admin") return authError("admin-only", 403);
  return NextResponse.json({ employees: unassignedEmployees(), coaches: assignableCoaches() }, { headers: { "Cache-Control": "no-store" } });
}
export async function PATCH(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin) return authError("invalid-request", 403);
  const user = await currentUser();
  if (!user || user.role !== "employee" || coachAccess(user) !== "admin") return authError("admin-only", 403);
  let body;
  try { body = await request.json(); } catch { return authError("invalid-request", 400); }
  if (!body || typeof body.userId !== "string" || typeof body.slug !== "string") return authError("invalid-request", 400);
  if (!unassignedEmployees().some(employee => employee.id === body.userId) || !assignCoach(body.userId, body.slug)) return authError("coach-already-linked", 409);
  return NextResponse.json({ ok: true });
}
