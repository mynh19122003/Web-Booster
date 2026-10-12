import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";

const RIOT_COOKIE = "ascend_riot_connection";
export const riotCookieOptions = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/" };
export type RiotConnection = { userId: string; puuid: string; gameName: string; tagLine: string; accessToken: string; expiresAt: number };
export const riotRsoConfigured = () => Boolean(process.env.RIOT_RSO_CLIENT_ID && process.env.RIOT_RSO_CLIENT_SECRET && process.env.RIOT_RSO_REDIRECT_URI);
function encryptionKey() {
  const secret = process.env.RIOT_RSO_CLIENT_SECRET;
  if (!secret) throw new Error("rso-unconfigured");
  return createHash("sha256").update(secret).digest();
}
export function setRiotConnection(response: NextResponse, connection: RiotConnection) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(connection)), cipher.final()]);
  response.cookies.set(RIOT_COOKIE, Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString("base64url"), { ...riotCookieOptions, expires: new Date(connection.expiresAt) });
}
export async function riotConnection(userId: string): Promise<RiotConnection | null> {
  const cookie = (await cookies()).get(RIOT_COOKIE)?.value;
  if (!cookie || !riotRsoConfigured()) return null;
  try {
    const data = Buffer.from(cookie, "base64url");
    const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), data.subarray(0, 12));
    decipher.setAuthTag(data.subarray(12, 28));
    const connection = JSON.parse(Buffer.concat([decipher.update(data.subarray(28)), decipher.final()]).toString()) as RiotConnection;
    return connection.userId === userId && connection.expiresAt > Date.now() ? connection : null;
  } catch { return null; }
}
