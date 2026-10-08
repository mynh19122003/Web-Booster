import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { coaches, coachFor } from "@/data/coaches";
import { CoachProfile } from "@/components/coaches/CoachProfile";
import { metadata } from "@/lib/seo";

export function generateStaticParams() {
  return coaches.map((coach) => ({ slug: coach.slug }));
}

export async function generateMetadata({ params }: PageProps<"/coaches/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const coach = coachFor(slug);
  return metadata(coach?.name ?? "Coach not found", coach ? coach.gameName + " coach profile." : "The requested coach could not be found.", "/coaches/" + slug);
}

export default async function CoachPage({ params }: PageProps<"/coaches/[slug]">) {
  const { slug } = await params;
  const coach = coachFor(slug);
  if (!coach) notFound();
  return <CoachProfile coach={coach} />;
}
