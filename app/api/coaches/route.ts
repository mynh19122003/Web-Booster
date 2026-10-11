import { NextResponse } from "next/server";
import { getAllCoachesWithOverrides } from "@/lib/coach-profile-db";

export const runtime = "nodejs";

export async function GET() {
  const coaches = getAllCoachesWithOverrides();
  return NextResponse.json({ coaches }, { headers: { "Cache-Control": "no-store" } });
}
