import { notFound } from "next/navigation";
import { articles } from "@/data/articles";
import { PageIntro } from "@/components/ui/PageIntro";
import { metadata, siteUrl } from "@/lib/seo";
import { serializeJsonLd } from "@/lib/json-ld";
export const dynamicParams = false;
export function generateStaticParams() {
  return articles.map((a) => ({ slug: a.slug }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const a = articles.find((a) => a.slug === slug);
  if (!a) notFound();
  const result = metadata(
    a.title,
    a.body[0],
    `/blog/${slug}`,
  );
  return { ...result, openGraph: { ...result.openGraph, type: "article" as const } };
}
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const a = articles.find((a) => a.slug === slug);
  if (!a) notFound();
  return (
    <>
      <PageIntro
        eyebrow={a.category}
        title={a.title}
        description="THE ASCEND PLAYBOOK · 2 MIN READ"
        path={`/blog/${slug}`}
      />
      <article className="container prose section">
        {a.body.map((p) => (
          <p key={p}>{p}</p>
        ))}
      </article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd({
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: a.title,
        description: a.body[0],
        articleSection: a.category,
        inLanguage: "en",
        url: `${siteUrl}/blog/${slug}`,
        mainEntityOfPage: `${siteUrl}/blog/${slug}`,
        publisher: { "@id": `${siteUrl}/#organization` },
      }) }} />
    </>
  );
}
