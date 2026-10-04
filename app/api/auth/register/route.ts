import { NextResponse } from "next/server";
import { createSession, createUser } from "@/lib/auth-db";
import { authError, setSessionCookie } from "@/lib/auth-http";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: { name?: unknown; email?: unknown; password?: unknown };
  try {
    body = await request.json();
  } catch {
    return authError("Invalid request.", 400);
  }
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (name.length < 2 || name.length > 80 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return authError("Enter a valid name and email address.", 400);
  }
  if (password.length < 8 || password.length > 128) {
    return authError("Password must be between 8 and 128 characters.", 400);
  }
  try {
    const user = createUser(name, email, password);
    const session = createSession(user.id);
    return setSessionCookie(NextResponse.json({ user }), session.token, session.expiresAt);
  } catch (error) {
    if (error instanceof Error && error.message.includes("UNIQUE constraint failed")) {
      return authError("An account with this email already exists.", 409);
    }
    return authError("Unable to create your account right now.", 500);
  }
}
