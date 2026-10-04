import { notFound } from "next/navigation";
import { services } from "@/data/services";
import { metadata } from "@/lib/seo";
import { PageIntro } from "@/components/ui/PageIntro";
import { GameSync } from "@/components/ui/GameSync";
import { ServiceConfigurator } from "@/components/home/ServiceConfigurator";
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
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const s = services.find((s) => s.slug === slug);
  if (!s) notFound();
  return (
    <>
      <GameSync queue={slug === "duo-boost" ? "Duo" : "Solo"} />
      <PageIntro
        eyebrow="PERSONALIZED GAMING SERVICES"
        title={s.name}
        description={
          s.description +
          " Explore a sample rank plan below. Specialized service pricing is not connected."
        }
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
