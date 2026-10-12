import type { Metadata } from "next";
import { CoachDirectory } from "@/components/coaches/CoachDirectory";
import { metadata as makeMetadata } from "@/lib/seo";
import { getAllCoachesWithOverrides } from "@/lib/coach-profile-db";
import { publicMockMode } from "@/lib/public-data-source";
import { mockCoaches } from "@/mocks/public";

export const dynamic = "force-dynamic";

export const metadata: Metadata = makeMetadata("Meet our coaches", "Browse sample coaches for League of Legends, Valorant, and Teamfight Tactics.", "/coaches");

export default function CoachesPage() {
  const coaches = publicMockMode ? mockCoaches : getAllCoachesWithOverrides();
  return <section className="section"><div className="container"><CoachDirectory initialCoaches={coaches} /></div></section>;
}
