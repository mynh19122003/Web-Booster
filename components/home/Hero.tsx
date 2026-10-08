"use client";

import { ArrowDown, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { AscendLogo } from "@/components/ui/AscendLogo";
import { HeroBackgroundAnimation } from "@/components/home/HeroBackgroundAnimation";

import { HeroTrustRibbon } from "@/components/home/HeroTrustRibbon";
import { useStore } from "@/store/useStore";
import { gameConfigFor } from "@/lib/game-config";
import { useLanguage } from "@/components/ui/LanguageProvider";

export function Hero() {
  const { t } = useLanguage();
  const selectedGame = useStore((state) => state.game);
  const gameConfig = gameConfigFor(selectedGame);
  const heroDescription = selectedGame === "valorant" ? t("heroValorant") : selectedGame === "teamfight-tactics" ? t("heroTft") : t("heroLeague");
  return (
    <section id="hero" className="hero relative isolate overflow-hidden pt-20">
      <HeroBackgroundAnimation />
      <div className="hero-grid pointer-events-none" aria-hidden="true" />
      <div className="site-container relative flex min-h-[calc(100svh-5rem)] flex-col justify-between pt-1 pb-3 md:pt-2 md:pb-4">
        <div className="grid flex-1 grid-cols-1 items-center gap-6 py-2 lg:min-h-0 lg:grid-cols-12 lg:gap-10 lg:py-4">
          <div className="relative z-10 min-w-0 lg:col-span-7">
            <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-[#FF9F3C]">
              <span className="size-2 shrink-0 rounded-full bg-[#FF9F3C] shadow-[0_0_10px_#FF9F3C]" aria-hidden="true" />
              {t("premierServices")}
            </div>
            <h1 className="!text-[clamp(2.5rem,5.2vw,5rem)] !leading-[1.08] !tracking-tight !mb-6">
              {gameConfig.heroTitle}<br />
              <span className="gradient-text">{t("heroTagline")}</span>
            </h1>
            <p className="!mt-0 mb-8 max-w-xl text-base leading-relaxed text-zinc-300 md:text-lg">
              {heroDescription}
            </p>
            <div className="mb-8 flex flex-wrap items-center gap-4">
              <Link className="button magnetic !px-7 !py-3.5 !text-base" href="/#services">{t("startClimb")} <ArrowUpRight size={19} /></Link>
              <Link className="button ghost !px-6 !py-3.5 !text-base" href="#services">{t("exploreServices")} <ArrowDown size={17} /></Link>
            </div>
            <div className="flex items-center gap-4">
              <div className="avatar-stack shrink-0" aria-hidden="true"><span>AK</span><span>JL</span><span>RM</span><span>+</span></div>
              <div className="text-xs leading-relaxed md:text-sm">
                <div><span className="text-[#FF9F3C]" aria-label={t("fiveStars")}>★★★★★</span><strong className="ml-2 text-zinc-100 text-sm md:text-base">4.9/5 {t("rating")}</strong></div>
                <p className="mt-1 text-zinc-400">15,000+ {t("completedOrders")}</p>
              </div>
            </div>
          </div>
          <div className="relative flex min-w-0 flex-col items-center justify-center lg:col-span-5">
            <div id="hero-artifact-anchor" className="pointer-events-none relative flex h-[520px] w-full max-w-[620px] items-center justify-center aspect-square lg:h-[600px] lg:max-w-[660px]" aria-hidden="true" />
            <div className="relative z-10 mt-4 flex w-full max-w-[440px] items-center gap-3 border-t border-white/[0.08] pt-4 lg:absolute lg:top-full">
              <AscendLogo variant="icon" size="sm" className="shrink-0" />
              <div className="min-w-0"><p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-300">{t("artifact")}</p><p className="mt-1 text-xs text-zinc-400">{t("artifactDescription")}</p></div>
              <span className="ml-auto shrink-0 font-mono text-[11px] text-zinc-500">01 / ∞</span>
            </div>
          </div>
        </div>

        {/* Bottom Area: All Systems Ready + Trust Ribbon */}
        <div className="relative z-10 mt-auto flex flex-col gap-3">
          <div className="grid w-full grid-cols-[1fr_auto_1fr] items-center gap-3 border-t border-white/[0.06] pt-3 pb-1 font-mono text-[10px] uppercase tracking-widest text-zinc-500 sm:text-[11px]">
            <span className="flex items-center gap-2"><span className="size-1.5 shrink-0 rounded-full bg-[#FF9F3C]" aria-hidden="true" /><span>{t("systemsReady")}</span></span>
            <Link href="#services" className="flex items-center justify-center gap-2 text-center transition-colors hover:text-white"><span>{t("scrollExplore")}</span><ArrowDown size={13} className="shrink-0" /></Link>
            <span className="justify-self-end text-right">{t("establishedYear", { year: 2026 })}</span>
          </div>

          <HeroTrustRibbon />
        </div>
      </div>
    </section>
  );
}
