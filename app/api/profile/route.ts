import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserForSession, getUserProfile, updateUserProfile } from "@/lib/auth-db";
import { SESSION_COOKIE, authError } from "@/lib/auth-http";

export const runtime = "nodejs";
async function currentUser() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return token ? getUserForSession(token) : null;
}
export async function GET() {
  const user = await currentUser();
  return user ? NextResponse.json({ profile: getUserProfile(user) }, { headers: { "Cache-Control": "no-store" } }) : authError("unauthorized", 401);
}
export async function PATCH(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin) return authError("invalid-request", 403);
  const user = await currentUser();
  if (!user) return authError("unauthorized", 401);
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return authError("invalid-request", 400); }
  if (!body || Array.isArray(body) || typeof body !== "object") return authError("invalid-request", 400);
  const fields = ["name", "phone", "country", "discord"] as const;
  if (fields.some(key => typeof body[key] !== "string")) return authError("invalid-request", 400);
  const name = (body.name as string).trim(), phone = (body.phone as string).trim(), country = (body.country as string).trim(), discord = (body.discord as string).trim();
  if (name.length < 2 || name.length > 80) return authError("invalid-name", 400);
  if (phone && (!/^\+?[\d\s().-]{6,30}$/.test(phone) || phone.replace(/\D/g, "").length < 6 || phone.replace(/\D/g, "").length > 15)) return authError("invalid-phone", 400);
  if (country && !/^[A-Z]{2}$/.test(country)) return authError("invalid-country", 400);
  if (discord.length > 80) return authError("invalid-discord", 400);
  try { return NextResponse.json({ profile: updateUserProfile(user, { name, phone, country, discord }) }); }
  catch { return authError("save-failed", 500); }
}
