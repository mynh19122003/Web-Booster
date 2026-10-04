import Link from "next/link";
import { siteUrl } from "@/lib/seo";
export function PageIntro({
  eyebrow,
  title,
  description,
  path,
}: {
  eyebrow: string;
  title: string;
  description: string;
  path: string;
}) {
  return (
    <section className="page-intro container">
      <nav aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span>/</span>
        <span>{title}</span>
      </nav>
      <p className="eyebrow">{eyebrow}</p>
      <h1>
        {title}
        <span className="gold">.</span>
      </h1>
      <p>{description}</p>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
              {
                "@type": "ListItem",
                position: 2,
                name: title,
                item: `${siteUrl}${path}`,
              },
            ],
          }),
        }}
      />
    </section>
  );
}
