"use client";

import Link from "next/link";
import { siteUrl, absoluteUrl } from "@/lib/site-url";
import { serializeJsonLd } from "@/lib/json-ld";
import { useLanguage } from "@/components/ui/LanguageProvider";
import { pageCopyFor, type PageCopyKey } from "@/data/page-copy";

type PageIntroProps = { path: string } & (
  | { pageKey: PageCopyKey; eyebrow?: never; title?: never; description?: never }
  | { pageKey?: never; eyebrow: string; title: string; description: string }
);

export function PageIntro({
  eyebrow,
  title,
  description,
  path,
  pageKey,
}: PageIntroProps) {
  const { language, t } = useLanguage();
  const sourceCopy = pageKey ? pageCopyFor(language, pageKey) : { eyebrow: eyebrow!, title: title!, description: description! };
  const copy = pageKey === "about" ? { ...sourceCopy, title: "ASCEND" } : sourceCopy;
  return (
    <section className="page-intro container">
      <nav aria-label={t("breadcrumb")}>
        <Link href="/">{t("home")}</Link>
        <span>/</span>
        <span aria-current="page">{copy.title}</span>
      </nav>
      <p className="eyebrow">{copy.eyebrow}</p>
      <h1>
        {copy.title}
        <span className="gold">.</span>
      </h1>
      {(!pageKey || !["support", "contact", "boosters", "reviews", "about"].includes(pageKey)) && <p>{copy.description}</p>}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: t("home"), item: siteUrl },
              {
                "@type": "ListItem",
                position: 2,
                name: copy.title,
                item: absoluteUrl(path),
              },
            ],
          }),
        }}
      />
    </section>
  );
}
