import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { articles } from "@/data/articles";
import { PageIntro } from "@/components/ui/PageIntro";
import { metadata as makeMetadata } from "@/lib/seo";
export const metadata = makeMetadata(
  "The playbook",
  "Practical ideas for a more intentional gaming experience.",
  "/blog",
);
export default function Page() {
  return (
    <>
      <PageIntro pageKey="blog" path="/blog" />
      <div className="container article-grid section">
        {articles.map((a, i) => (
          <Link className="article-card" href={`/blog/${a.slug}`} key={a.slug}>
            <div className="article-art">
              <span>0{i + 1}</span>
              <ArrowUpRight size={60} />
            </div>
            <p className="eyebrow">{a.category} · 2 MIN READ</p>
            <h2>{a.title}</h2>
            <span className="text-link">
              Read the story <ArrowUpRight size={17} />
            </span>
          </Link>
        ))}
      </div>
    </>
  );
}
