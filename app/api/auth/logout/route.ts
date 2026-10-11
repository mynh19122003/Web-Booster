import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { deleteSession } from "@/lib/auth-db";
import { clearSessionCookie, SESSION_COOKIE } from "@/lib/auth-http";

export const runtime = "nodejs";

export async function POST() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (token) deleteSession(token);
  const response = clearSessionCookie(NextResponse.json({ ok: true }));
  response.cookies.delete("ascend_riot_connection");
  response.cookies.delete("ascend_riot_state");
  return response;
}
