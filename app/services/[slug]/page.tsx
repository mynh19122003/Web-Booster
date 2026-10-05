import { notFound } from "next/navigation";
import { services } from "@/data/services";
import { metadata } from "@/lib/seo";
import { PageIntro } from "@/components/ui/PageIntro";
import { GameSync } from "@/components/ui/GameSync";
import { ServiceConfigurator } from "@/components/home/ServiceConfigurator";
import { games } from "@/data/games";
export function generateStaticParams() {
  return services.map((s) => ({ slug: s.slug }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const s = services.find((s) => s.slug === slug);
  return metadata(
    s?.name ?? "Service not found",
    s?.description ?? "Explore gaming services",
    `/services/${slug}`,
  );
}
export default async function ServicePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ game?: string }>;
}) {
  const { slug } = await params;
  const query = await searchParams;
  const game = games.find((g) => g.slug === query.game);
  const s = services.find((s) => s.slug === slug);
  if (!s) notFound();
  return (
    <>
      <GameSync
        slug={game?.slug}
        service={slug}
        queue={slug === "duo-boost" ? "Duo" : "Solo"}
      />
      <PageIntro
        eyebrow="PERSONALIZED GAMING SERVICES"
        title={s.name}
        description={s.description}
        path={`/services/${slug}`}
      />
      <ServiceConfigurator />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Service",
            name: s.name,
            description: s.description,
            provider: { "@type": "Organization", name: "ASCEND" },
          }),
        }}
      />
    </>
  );
}
