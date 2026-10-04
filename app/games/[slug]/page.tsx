import { notFound } from "next/navigation";
import { games } from "@/data/games";
import { metadata } from "@/lib/seo";
import { PageIntro } from "@/components/ui/PageIntro";
import { GameSync } from "@/components/ui/GameSync";
import { ServiceConfigurator } from "@/components/home/ServiceConfigurator";
import { FAQ } from "@/components/home/FAQ";
export function generateStaticParams() {
  return games.map((g) => ({ slug: g.slug }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const g = games.find((g) => g.slug === slug);
  return metadata(
    g?.name ?? "Game not found",
    `Explore personalized services and coaching for ${g?.name ?? "your game"}.`,
    `/games/${slug}`,
  );
}
export default async function GamePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const game = games.find((g) => g.slug === slug);
  if (!game) notFound();
  return (
    <>
      <GameSync slug={slug} />
      <PageIntro
        eyebrow={`${game.genre} / YOUR NEXT CHAPTER`}
        title={game.name}
        description={`${game.services.join(", ")}. Find your next milestone with a plan built around you. Ranks and estimates use a shared illustrative model in this demo.`}
        path={`/games/${slug}`}
      />
      <ServiceConfigurator />
      <FAQ />
    </>
  );
}
