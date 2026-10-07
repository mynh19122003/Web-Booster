"use client";

import { ShieldCheck, Compass, Headphones, Star } from "lucide-react";
import { useLanguage } from "@/components/ui/LanguageProvider";

const trustPillars = [
  {
    icon: ShieldCheck,
    key: "trustPrivacy",
  },
  {
    icon: Compass,
    key: "trustProgress",
  },
  {
    icon: Headphones,
    key: "trustSupport",
  },
  {
    icon: Star,
    key: "trustPlayers",
  },
] as const;

export function HeroTrustRibbon() {
  const { t } = useLanguage();
  return (
    <div className="relative z-10 mt-1 mb-0 w-full pb-12 md:pb-14">
      {/* Ambient backlight */}
      <div
        className="bg-[#D97706]/10 blur-[100px] w-3/4 h-8 absolute inset-x-0 mx-auto -bottom-2 -z-10 pointer-events-none"
        aria-hidden="true"
      />

      {/* Floating Glass Ribbon Container */}
      <div className="hero-trust-glass rounded-2xl border border-white/10 bg-gradient-to-r from-white/[0.04] via-white/[0.02] to-white/[0.04] backdrop-blur-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),0_15px_35px_rgba(0,0,0,0.6)]">
        <div className="grid w-full grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 items-stretch divide-y divide-white/[0.08] sm:divide-y-0 lg:divide-x">
          {trustPillars.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.key}
                className="flex items-center justify-center gap-3 py-3.5 px-4 text-center group cursor-default"
              >
                <Icon className="text-[#FF9F3C] w-4 h-4 flex-shrink-0 group-hover:scale-110 transition-transform duration-200" />
                <span className="text-xs font-semibold text-zinc-300 group-hover:text-white tracking-wide transition-colors">
                  {t(item.key)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
