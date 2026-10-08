"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useLanguage } from "@/components/ui/LanguageProvider";

export function ContactSections() {
  const { t } = useLanguage();
  return (
    <article className="container prose section contact-content">
      <section>
        <h2>{t("currentSupportTitle")}</h2>
        <Link className="text-link" href="/support">
          {t("helpCenterLink")} <ArrowUpRight size={16} />
        </Link>
      </section>
    </article>
  );
}
