"use client";

import { useLanguage } from "@/components/ui/LanguageProvider";

export function HowItWorks() {
  const { t } = useLanguage();
  return (
    <section id="how-it-works" className="section steps">
      <div className="site-container">
        <p className="eyebrow">{t("stepsEyebrow")}</p>
        <h2>
          {t("stepsLead")} <span className="muted">{t("stepsFinish")}</span>
        </h2>
        <div className="steps-grid">
          <div className="step-line" />
          {[
            [
              "01",
              t("stepOne"),
              t("stepOneDescription"),
            ],
            [
              "02",
              t("stepTwo"),
              t("stepTwoDescription"),
            ],
            [
              "03",
              t("stepThree"),
              t("stepThreeDescription"),
            ],
          ].map(([n, title, text]) => (
            <article key={n}>
              <span>{n}</span>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
