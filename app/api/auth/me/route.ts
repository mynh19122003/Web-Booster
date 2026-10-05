import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserForSession } from "@/lib/auth-db";
import { SESSION_COOKIE } from "@/lib/auth-http";

export const runtime = "nodejs";

export async function GET() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return NextResponse.json({ user: token ? getUserForSession(token) : null });
}
