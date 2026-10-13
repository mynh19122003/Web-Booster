import { NextResponse } from "next/server";
import { currentUser } from "@/lib/current-user";
import { markRequestRead } from "@/lib/chat-db";
import { authError, isSameOrigin } from "@/lib/auth-http";
export const runtime = "nodejs";
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!isSameOrigin(request)) return authError("invalid-request", 403);
  const user = await currentUser();
  if (!user) return authError("unauthorized", 401);
  let body: { messageId?: unknown };
  try { body = await request.json(); } catch { return authError("invalid-request", 400); }
  if (typeof body?.messageId !== "string" || !body.messageId || body.messageId.length > 120) return authError("invalid-request", 400);
  const { id } = await context.params;
  const result = markRequestRead(user, id, body.messageId);
  if (typeof result === "string") return authError(result, result === "forbidden" ? 403 : 400);
  return NextResponse.json({ unread: result });
}
