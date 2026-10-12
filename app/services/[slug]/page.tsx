import { notFound } from "next/navigation";
import { services } from "@/data/services";
import { metadata, siteUrl } from "@/lib/seo";
import { serializeJsonLd } from "@/lib/json-ld";
import { PageIntro } from "@/components/ui/PageIntro";
import { GameSync } from "@/components/ui/GameSync";
import { ServiceConfigurator } from "@/components/home/ServiceConfigurator";
import { games } from "@/data/games";
export const dynamicParams = false;
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
  if (!s) notFound();
  return metadata(
    s.name,
    s.description,
    `/services/${slug}`,
  );
}
import { Suspense } from "react";

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
      <Suspense fallback={null}>
        <GameSync
          slug={game?.slug}
          service={slug}
          queue={slug === "duo-boost" ? "Duo" : "Solo"}
        />
      </Suspense>
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
          __html: serializeJsonLd({
            "@context": "https://schema.org",
            "@type": "Service",
            name: s.name,
            description: s.description,
            url: `${siteUrl}/services/${slug}`,
            provider: { "@id": `${siteUrl}/#organization` },
          }),
        }}
      />
    </>
  );
}
