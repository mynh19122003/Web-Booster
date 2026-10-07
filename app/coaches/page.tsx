import type { Metadata } from "next";
import { CoachDirectory } from "@/components/coaches/CoachDirectory";
import { metadata as makeMetadata } from "@/lib/seo";

export const metadata: Metadata = makeMetadata("Meet our coaches", "Browse sample coaches for League of Legends, Valorant, and Teamfight Tactics.", "/coaches");

export default function CoachesPage() {
  return <section className="section"><div className="container"><CoachDirectory /></div></section>;
}
