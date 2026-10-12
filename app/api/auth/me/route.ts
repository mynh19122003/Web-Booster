import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserForSession, getUserProfile } from "@/lib/auth-db";
import { SESSION_COOKIE } from "@/lib/auth-http";

export const runtime = "nodejs";

export async function GET() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const user = token ? getUserForSession(token) : null;
  return NextResponse.json({ user: user ? { ...user, avatar: getUserProfile(user).avatar } : null }, { headers: { "Cache-Control": "no-store" } });
}
