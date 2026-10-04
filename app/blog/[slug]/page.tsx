import { notFound } from "next/navigation";
import { articles } from "@/data/articles";
import { PageIntro } from "@/components/ui/PageIntro";
import { metadata } from "@/lib/seo";
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
  return metadata(
    a?.title ?? "Article not found",
    a?.body[0] ?? "",
    `/blog/${slug}`,
  );
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
    </>
  );
}
