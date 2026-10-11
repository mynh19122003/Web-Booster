import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { changeUserPassword, getUserForSession } from "@/lib/auth-db";
import { authError, SESSION_COOKIE } from "@/lib/auth-http";

export const runtime = "nodejs";

export async function PATCH(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin) return authError("invalid-request", 403);
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const user = token ? getUserForSession(token) : null;
  if (!user || !token) return authError("unauthorized", 401);
  let body: unknown;
  try { body = await request.json(); } catch { return authError("invalid-request", 400); }
  if (!body || typeof body !== "object" || Array.isArray(body)) return authError("invalid-request", 400);
  const { currentPassword, newPassword } = body as Record<string, unknown>;
  if (typeof currentPassword !== "string" || !currentPassword || currentPassword.length > 128 || typeof newPassword !== "string" || newPassword.length < 8 || newPassword.length > 128) return authError("invalid-password", 400);
  if (currentPassword === newPassword) return authError("same-password", 400);
  try {
    const result = changeUserPassword(user.id, currentPassword, newPassword, token);
    return result === "saved" ? NextResponse.json({ saved: true }) : authError(result, 400);
  } catch { return authError("save-failed", 500); }
}
