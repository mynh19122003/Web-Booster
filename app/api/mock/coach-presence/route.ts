import { NextResponse } from "next/server";
import { isSameOrigin } from "@/lib/auth-http";
import { publicMockMode } from "@/lib/public-data-source";
import { saveCoachProfile } from "@/lib/coach-profile-db";
import { mockCoaches } from "@/mocks/public";
import employeeAccounts from "@/mocks/employee-accounts.json";

export const runtime = "nodejs";

export async function PATCH(request: Request) {
  if (!publicMockMode) return NextResponse.json({ error: "not-found" }, { status: 404 });
  if (!isSameOrigin(request)) return NextResponse.json({ error: "invalid-request" }, { status: 403 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "invalid-request" }, { status: 400 }); }
  if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({ error: "invalid-request" }, { status: 400 });
  const { employeeId, password, isOnline } = body as Record<string, unknown>;
  const account = employeeAccounts.find(row => row.id === employeeId && row.password === password);
  const slug = typeof employeeId === "string" && employeeId.startsWith("emp-") ? employeeId.slice(4) : "";
  if (!account || typeof isOnline !== "boolean" || !mockCoaches.some(coach => coach.slug === slug)) {
    return NextResponse.json({ error: "invalid-request" }, { status: 400 });
  }
  saveCoachProfile(slug, { online: isOnline });
  return NextResponse.json({ isOnline }, { headers: { "Cache-Control": "no-store" } });
}
