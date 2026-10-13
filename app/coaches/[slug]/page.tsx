import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { coaches } from "@/data/coaches";
import { CoachProfile } from "@/components/coaches/CoachProfile";
import { metadata } from "@/lib/seo";
import { getCoachWithOverride } from "@/lib/coach-profile-db";
import { currentUser } from "@/lib/current-user";
import { canManageCoach } from "@/lib/coach-ownership";
import { publicMockMode } from "@/lib/public-data-source";
import { mockCoaches } from "@/mocks/public";

const findCoach = (slug: string) => getCoachWithOverride(slug);

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return (publicMockMode ? mockCoaches : coaches).map((coach) => ({ slug: coach.slug }));
}

export async function generateMetadata({ params }: PageProps<"/coaches/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const coach = findCoach(slug);
  if (!coach) notFound();
  return metadata(`${coach.name} — ${coach.gameName} Coach`, `Explore ${coach.name}'s ${coach.gameName} coaching profile, session options and availability.`, "/coaches/" + slug);
}

export default async function CoachPage({ params }: PageProps<"/coaches/[slug]">) {
  const { slug } = await params;
  const coach = findCoach(slug);
  if (!coach) notFound();
  const canEdit = publicMockMode ? false : canManageCoach(await currentUser(), slug);
  return <CoachProfile coach={coach} canEdit={canEdit} />;
}
