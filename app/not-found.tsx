"use client";
import Link from "next/link";
import { useLanguage } from "@/components/ui/LanguageProvider";
export default function NotFound() {
  const { t } = useLanguage();
  return (
    <section className="container page-intro">
      <p className="eyebrow">{t("notFoundEyebrow")}</p>
      <h1>{t("notFoundTitle")}</h1>
      <p>{t("notFoundDescription")}</p>
      <Link className="button" href="/">
        {t("returnHome")}
      </Link>
    </section>
  );
}
