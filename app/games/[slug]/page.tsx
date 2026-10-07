import { notFound } from "next/navigation";
import { games } from "@/data/games";
import { metadata } from "@/lib/seo";
import { PageIntro } from "@/components/ui/PageIntro";
import { GameSync } from "@/components/ui/GameSync";
import { gameConfigFor } from "@/lib/game-config";
import { ServiceConfigurator } from "@/components/home/ServiceConfigurator";
import { FAQ } from "@/components/home/FAQ";
export function generateStaticParams() {
  return [...games.map((g) => ({ slug: g.slug })), { slug: "tft" }];
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const gameSlug = slug === "tft" ? "teamfight-tactics" : slug;
  const g = games.find((g) => g.slug === gameSlug);
  return metadata(
    g?.name ?? "Game not found",
    `Explore personalized services and coaching for ${g?.name ?? "your game"}.`,
    `/games/${slug}`,
  );
}
import { Suspense } from "react";

export default async function GamePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const gameSlug = slug === "tft" ? "teamfight-tactics" : slug;
  const game = games.find((g) => g.slug === gameSlug);
  if (!game) notFound();
  return (
    <>
      <Suspense fallback={null}>
        <GameSync slug={gameSlug} service="rank-boost" />
      </Suspense>
      <PageIntro
        eyebrow={`${game.genre} / YOUR NEXT CHAPTER`}
        title={gameSlug === "league-of-legends" ? "League of Legends" : gameConfigFor(gameSlug).heroTitle.replace(/\.$/, "")}
        description={gameConfigFor(gameSlug).heroDescription}
        path={`/games/${slug}`}
      />
      <ServiceConfigurator />
      <FAQ />
    </>
  );
}
