"use client";

import { useLanguage } from "@/components/ui/LanguageProvider";

export function SkipLink() {
  const { t } = useLanguage();
  return (
    <a className="skip-link" href="#main">
      {t("skipToContent")}
    </a>
  );
}
