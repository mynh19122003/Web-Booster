import type { Metadata } from "next";
import { CoachDirectory } from "@/components/coaches/CoachDirectory";
import { metadata as makeMetadata } from "@/lib/seo";
import { getAllCoachesWithOverrides } from "@/lib/coach-profile-db";

export const dynamic = "force-dynamic";

export const metadata: Metadata = makeMetadata("Meet our coaches", "Browse coaches for League of Legends, Valorant, and Teamfight Tactics.", "/coaches");

export default function CoachesPage() {
  const coaches = getAllCoachesWithOverrides();
  return <section className="section"><div className="container"><CoachDirectory initialCoaches={coaches} /></div></section>;
}
