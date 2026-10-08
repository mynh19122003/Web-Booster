"use client";

import { useLanguage } from "@/components/ui/LanguageProvider";
import { pageCopyFor } from "@/data/page-copy";

export function AboutSections() {
  const { language, t } = useLanguage();

  return (
    <article className="container prose section">
      <section>
        <h2>ASCEND</h2>
        <p>{pageCopyFor(language, "services").description}</p>
        <p>{t("independenceNotice")}</p>
      </section>
    </article>
  );
}
