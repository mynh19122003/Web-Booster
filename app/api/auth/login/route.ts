import { NextResponse } from "next/server";
import { createSession, findUserByEmail, safeUser, verifyPassword } from "@/lib/auth-db";
import { authError, setSessionCookie } from "@/lib/auth-http";
import { loginDestination } from "@/lib/auth-redirect";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: { email?: unknown; password?: unknown; next?: unknown };
  try {
    body = await request.json();
  } catch {
    return authError("Invalid request.", 400);
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) return authError("Invalid request.", 400);
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (email.length > 254 || password.length > 128 || !email || !password) {
    return authError("Email or password is incorrect.", 401);
  }
  const row = findUserByEmail(email);
  if (!row || !verifyPassword(password, row.password_hash)) {
    return authError("Email or password is incorrect.", 401);
  }
  const session = createSession(row.id);
  return setSessionCookie(
    NextResponse.json({ user: safeUser(row), redirectTo: loginDestination(row.role, body.next) }),
    session.token,
    session.expiresAt,
  );
}
