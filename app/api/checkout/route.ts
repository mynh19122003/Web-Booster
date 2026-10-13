import { NextResponse } from "next/server";
import { currentUser } from "@/lib/current-user";
import { authError, isSameOrigin } from "@/lib/auth-http";
import { createOrderRequest } from "@/lib/chat-db";
import { parseOrderRequest } from "@/lib/order-request-validation";
import { getCoachWithOverride } from "@/lib/coach-profile-db";

export const runtime = "nodejs";

const gameNames: Record<string, string> = {
  "league-of-legends": "League of Legends",
  valorant: "Valorant",
  "teamfight-tactics": "Teamfight Tactics",
};
const serviceNames: Record<string, string> = {
  "rank-boost": "Rank boost",
  "duo-boost": "Duo boost",
  placements: "Placements",
  coaching: "Coaching",
};

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return authError("invalid-request", 403);
  const user = await currentUser();
  if (!user) return authError("unauthorized", 401);
  if (user.role === "employee") return authError("customer-only", 403);
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return authError("invalid-request", 400);
  }
  if (!body || typeof body !== "object" || Array.isArray(body))
    return authError("invalid-request", 400);
  const { game, order } = body as Record<string, unknown>;
  const details = parseOrderRequest(order);
  if (typeof game !== "string" || !Object.hasOwn(gameNames, game) || !details)
    return authError("invalid-request", 400);
  if (details.service === "coaching") {
    const coach = details.coaching && getCoachWithOverride(details.coaching.coachId);
    if (!coach || !coach.online || coach.game !== game) return authError("coach-offline", 409);
  }
  try {
    // This creates a fulfillment request for the existing mock checkout; it does not charge a payment.
    const result = createOrderRequest(
      user,
      `${gameNames[game]} · ${serviceNames[details.service]}`,
      gameNames[game],
      details,
    );
    return NextResponse.json(result, {
      status: 201,
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return authError("credentials-unavailable", 503);
  }
}
