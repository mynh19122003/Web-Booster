"use client";

import Link from "next/link";
import { ArrowUpRight, Trophy, Clock3, Users } from "lucide-react";
import { RecruitmentForm } from "@/components/careers/RecruitmentForm";
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
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-stretch">
            {/* Left Details Column */}
            <div className="lg:col-span-5 flex flex-col justify-between h-full">
              <div>
                <p className="text-[#FF9F3C] text-xs font-heading font-bold tracking-widest uppercase mb-3">
                  {t("recruitEyebrow")}
                </p>
                <h2 className="text-4xl lg:text-5xl font-heading font-black uppercase text-white tracking-tight leading-[1.1] mb-4">
                  {t("recruitLead")} <span className="text-[#FF9F3C]">{t("recruitFinish")}</span>
                </h2>
                <p className="text-zinc-300 text-sm sm:text-base leading-relaxed font-normal mb-8">
                  {t("recruitDescription")}
                </p>

                <ul className="my-8 space-y-6">
                  <li className="flex items-center gap-3.5 text-sm font-medium text-zinc-300 leading-relaxed">
                    <div className="w-10 h-10 rounded-xl bg-[#FF9F3C]/10 border border-[#FF9F3C]/20 flex items-center justify-center text-[#FF9F3C] flex-shrink-0">
                      <Trophy size={18} />
                    </div>
                    <span>{t("recruitOne")}</span>
                  </li>
                  <li className="flex items-center gap-3.5 text-sm font-medium text-zinc-300 leading-relaxed">
                    <div className="w-10 h-10 rounded-xl bg-[#FF9F3C]/10 border border-[#FF9F3C]/20 flex items-center justify-center text-[#FF9F3C] flex-shrink-0">
                      <Clock3 size={18} />
                    </div>
                    <span>{t("recruitTwo")}</span>
                  </li>
                  <li className="flex items-center gap-3.5 text-sm font-medium text-zinc-300 leading-relaxed">
                    <div className="w-10 h-10 rounded-xl bg-[#FF9F3C]/10 border border-[#FF9F3C]/20 flex items-center justify-center text-[#FF9F3C] flex-shrink-0">
                      <Users size={18} />
                    </div>
                    <span>{t("recruitThree")}</span>
                  </li>
                </ul>
              </div>

              <div className="pt-6 border-t border-white/[0.08] space-y-3">
                <p className="text-xs text-zinc-400 leading-relaxed">
                  {t("recruitNote")}
                </p>
                <Link
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#FF9F3C] hover:text-[#f8b15d] transition-colors group"
                  href="/careers"
                >
                  {t("recruitAction")}
                  <ArrowUpRight size={16} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </Link>
              </div>
            </div>

            {/* Right Form Column */}
            <div className="lg:col-span-7 flex flex-col justify-between h-full">
              <RecruitmentForm />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
