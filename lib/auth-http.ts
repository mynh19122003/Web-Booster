import { NextResponse } from "next/server";

export const SESSION_COOKIE = "ascend_session";
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

export function setSessionCookie(response: NextResponse, token: string, expiresAt: number) {
  response.cookies.set(SESSION_COOKIE, token, {
    ...cookieOptions,
    expires: new Date(expiresAt),
  });
  return response;
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE, "", { ...cookieOptions, expires: new Date(0) });
  return response;
}

export function authError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}
