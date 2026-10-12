import { NextResponse } from "next/server";
import { getCoachWithOverride } from "@/lib/coach-profile-db";
export const runtime = "nodejs";
export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const coach = getCoachWithOverride((await params).slug);
  return NextResponse.json(coach ? { coach } : { error: "not-found" }, { status: coach ? 200 : 404, headers: { "Cache-Control": "no-store" } });
}
