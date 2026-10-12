"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useLanguage } from "@/components/ui/LanguageProvider";

export function RecruitmentSection() {
  const { t } = useLanguage();
  return (
    <section className="section relative overflow-hidden" id="careers">
      <div className="site-container relative isolate">
        {/* Ambient Glow: burnt orange / gold glow behind the left side */}
        <div
          className="absolute -top-12 -left-12 -z-10 w-[600px] h-[500px] rounded-full bg-[#D97706]/15 blur-[180px] pointer-events-none"
          aria-hidden="true"
        />

        {/* Unified Luxury Glass Panel */}
        <div className="relative overflow-hidden bg-gradient-to-b from-white/[0.05] via-white/[0.02] to-transparent backdrop-blur-2xl border border-white/10 rounded-3xl p-8 md:p-12 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),0_25px_60px_rgba(0,0,0,0.7)]">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between lg:gap-12">
            <div className="min-w-0 max-w-3xl">
              <p className="text-[#FF9F3C] text-xs font-heading font-bold tracking-widest uppercase mb-3">
                {t("recruitEyebrow")}
              </p>
              <h2 className="text-4xl lg:text-5xl font-heading font-black uppercase text-white tracking-tight leading-[1.1] mb-4">
                {t("recruitLead")}{" "}
                <span className="text-[#FF9F3C]">{t("recruitFinish")}</span>
              </h2>
              <p className="text-zinc-300 text-sm sm:text-base leading-relaxed font-normal">
                {t("recruitDescription")}
              </p>
            </div>
            <Link
              className="button inline-flex shrink-0 self-start items-center justify-center gap-2 lg:self-center"
              href="/careers"
            >
              {t("recruitAction")}
              <ArrowUpRight size={18} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
