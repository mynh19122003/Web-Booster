import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { currentUser } from "@/lib/current-user";
import { authError } from "@/lib/auth-http";
import { riotCookieOptions, riotRsoConfigured } from "@/lib/riot-rso";

export const runtime = "nodejs";
export async function GET(request: Request) {
  const user = await currentUser();
  if (!user) return authError("sign-in-required", 401);
  if (user.role !== "employee") return authError("employee-only", 403);
  if (!riotRsoConfigured()) return NextResponse.redirect(new URL("/employee/riot?connection=unconfigured", request.url));
  const state = randomBytes(32).toString("base64url");
  const url = new URL("https://auth.riotgames.com/authorize");
  url.search = new URLSearchParams({ client_id: process.env.RIOT_RSO_CLIENT_ID!, redirect_uri: process.env.RIOT_RSO_REDIRECT_URI!, response_type: "code", scope: "openid", state }).toString();
  const response = NextResponse.redirect(url);
  response.cookies.set("ascend_riot_state", `${user.id}.${state}`, { ...riotCookieOptions, maxAge: 600 });
  return response;
}
