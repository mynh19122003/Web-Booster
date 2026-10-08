"use client";

import { useLanguage } from "@/components/ui/LanguageProvider";

export function TrophyBreak() {
  const { t } = useLanguage();
  return (
    <section className="trophy-break" id="trophy">
      <div className="site-container">
        <p className="eyebrow">{t("trophyEyebrow")}</p>
        <h2>
          {t("trophyLead")}
          <br />
          <span className="muted">{t("trophyFinish")}</span>
        </h2>
        <p>
          {t("trophyDescription")}
          <br />
          {t("trophyDescriptionEnd")}
        </p>
        <span className="trophy-caption">
          {t("trophyCaption")}
        </span>
      </div>
    </section>
  );
}
