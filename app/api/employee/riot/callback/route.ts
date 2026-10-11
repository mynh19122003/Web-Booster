import { timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { currentUser } from "@/lib/current-user";
import { riotRsoConfigured, setRiotConnection } from "@/lib/riot-rso";
import { riotRequest } from "@/lib/riot-api";

export const runtime = "nodejs";
export async function GET(request: Request) {
  const user = await currentUser();
  const url = new URL(request.url);
  const expected = (await cookies()).get("ascend_riot_state")?.value ?? "";
  const received = `${user?.id}.${url.searchParams.get("state") ?? ""}`;
  const finish = (status: string) => {
    const response = NextResponse.redirect(new URL(`/employee/riot?connection=${status}`, request.url));
    response.cookies.delete("ascend_riot_state");
    return response;
  };
  const code = url.searchParams.get("code");
  const expectedBytes = Buffer.from(expected);
  const receivedBytes = Buffer.from(received);
  if (user?.role !== "employee" || !code || !expected || expectedBytes.length !== receivedBytes.length || !timingSafeEqual(expectedBytes, receivedBytes) || !riotRsoConfigured()) return finish("failed");
  try {
    const tokenResponse = await fetch("https://auth.riotgames.com/token", {
      method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded", Authorization: `Basic ${Buffer.from(`${process.env.RIOT_RSO_CLIENT_ID}:${process.env.RIOT_RSO_CLIENT_SECRET}`).toString("base64")}` },
      body: new URLSearchParams({ grant_type: "authorization_code", code, redirect_uri: process.env.RIOT_RSO_REDIRECT_URI! }), cache: "no-store", signal: AbortSignal.timeout(10_000), redirect: "error",
    });
    if (!tokenResponse.ok) return finish("failed");
    const token = await tokenResponse.json() as { access_token?: string; expires_in?: number };
    if (!token.access_token || !Number.isFinite(token.expires_in) || token.expires_in! <= 0) return finish("failed");
    const account = await riotRequest<{ puuid: string; gameName?: string; tagLine?: string }>("americas", "/riot/account/v1/accounts/me", { accessToken: token.access_token });
    if (!account.puuid) return finish("failed");
    const response = finish("connected");
    setRiotConnection(response, { userId: user.id, puuid: account.puuid, gameName: account.gameName ?? "", tagLine: account.tagLine ?? "", accessToken: token.access_token, expiresAt: Date.now() + Math.min(token.expires_in!, 3600) * 1000 });
    return response;
  } catch { return finish("failed"); }
}
