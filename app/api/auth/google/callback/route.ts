import { timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createGoogleUser, createSession, findGoogleUser, findUserByEmail } from "@/lib/auth-db";
import { setSessionCookie } from "@/lib/auth-http";

export const runtime = "nodejs";

function loginError(request: Request, code: string) {
  return NextResponse.redirect(new URL(`/login?error=${code}`, request.url));
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const returnedState = url.searchParams.get("state") || "";
  const cookieStore = await cookies();
  const expectedState = cookieStore.get("ascend_oauth_state")?.value || "";
  const verifier = cookieStore.get("ascend_oauth_verifier")?.value;
  const clearOauthCookies = (response: NextResponse) => {
    response.cookies.delete("ascend_oauth_state");
    response.cookies.delete("ascend_oauth_verifier");
    return response;
  };
  const returnedBytes = Buffer.from(returnedState);
  const expectedBytes = Buffer.from(expectedState);
  if (!code || !verifier || !expectedState || returnedBytes.length !== expectedBytes.length || !timingSafeEqual(returnedBytes, expectedBytes)) {
    return clearOauthCookies(loginError(request, "google-failed"));
  }
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return clearOauthCookies(loginError(request, "google-unconfigured"));
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || new URL("/api/auth/google/callback", request.url).toString();
  try {
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
        code_verifier: verifier,
      }),
      cache: "no-store",
    });
    if (!tokenResponse.ok) throw new Error("OAuth token exchange failed");
    const tokens = await tokenResponse.json() as { access_token?: string };
    if (!tokens.access_token) throw new Error("Missing access token");
    const profileResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
      cache: "no-store",
    });
    if (!profileResponse.ok) throw new Error("Google profile lookup failed");
    const profile = await profileResponse.json() as { sub?: string; name?: string; email?: string; email_verified?: boolean };
    if (!profile.sub || !profile.email || profile.email_verified !== true) throw new Error("Google account email is not verified");
    let user = findGoogleUser(profile.sub);
    if (!user) {
      if (findUserByEmail(profile.email)) return clearOauthCookies(loginError(request, "google-email-exists"));
      user = createGoogleUser(profile.name?.slice(0, 80) || profile.email.split("@")[0], profile.email, profile.sub);
    }
    const session = createSession(user.id);
    const response = NextResponse.redirect(new URL("/account", request.url));
    setSessionCookie(response, session.token, session.expiresAt);
    return clearOauthCookies(response);
  } catch {
    return clearOauthCookies(loginError(request, "google-failed"));
  }
}
