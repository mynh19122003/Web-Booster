"use client";

import { ArrowUpRight, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/components/ui/LanguageProvider";
export function CTA() {
  const { t } = useLanguage();
  return (
    <section className="final-cta" id="final-cta">
      <div className="site-container" data-reveal>
        <p className="eyebrow">{t("ctaEyebrow")}</p>
        <h2>
          {t("ctaLead")}
          <br />
          <span className="gradient-text">ASCEND.</span>
        </h2>
        <p>{t("ctaDescription")}</p>
        <div className="hero-buttons">
          <Link href="/services#configure" className="button">
            {t("startClimb")} <ArrowUpRight size={18} />
          </Link>
          <a href="#services" className="text-link">
            {t("exploreServices")} <ArrowRight size={16} />
          </a>
        </div>
      </div>
    </section>
  );
}
