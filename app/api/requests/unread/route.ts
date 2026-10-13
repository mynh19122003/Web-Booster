import { NextResponse } from "next/server";
import { currentUser } from "@/lib/current-user";
import { requestUnreadCounts } from "@/lib/chat-db";
import { authError } from "@/lib/auth-http";
export const runtime = "nodejs";
export async function GET() {
  const user = await currentUser();
  if (!user) return authError("unauthorized", 401);
  return NextResponse.json({ unread: requestUnreadCounts(user) }, { headers: { "Cache-Control": "no-store" } });
}
