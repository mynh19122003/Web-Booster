import { NextResponse } from "next/server";
import { currentUser } from "@/lib/current-user";
import { createRequest, listRequests } from "@/lib/chat-db";
import { authError } from "@/lib/auth-http";

export const runtime = "nodejs";

export async function GET() {
  const user = await currentUser();
  if (!user) return authError("unauthorized", 401);
  return NextResponse.json({ user, requests: listRequests(user) }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin) return authError("invalid-request", 403);
  const user = await currentUser();
  if (!user) return authError("unauthorized", 401);
  if (user.role !== "customer") return authError("customer-only", 403);
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return authError("invalid-request", 400); }
  if (!body || typeof body !== "object" || Array.isArray(body)) return authError("invalid-request", 400);
  const subject = typeof body.subject === "string" ? body.subject.trim() : "";
  const game = typeof body.game === "string" ? body.game.trim() : "";
  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (subject.length < 3 || subject.length > 120 || !["League of Legends", "Valorant", "Teamfight Tactics", "Other"].includes(game) || !text || text.length > 2000) {
    return authError("invalid-request", 400);
  }
  return NextResponse.json({ request: createRequest(user, subject, game, text) }, { status: 201 });
}
