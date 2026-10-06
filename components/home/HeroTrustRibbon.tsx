"use client";

import { ShieldCheck, Compass, Headphones, Star } from "lucide-react";

const trustPillars = [
  {
    icon: ShieldCheck,
    label: "Privacy by design",
  },
  {
    icon: Compass,
    label: "Your pace. Your progress.",
  },
  {
    icon: Headphones,
    label: "Support at every step",
  },
  {
    icon: Star,
    label: "Elite player network",
  },
];

export function HeroTrustRibbon() {
  return (
    <div className="relative z-10 mx-auto mt-1 mb-0 w-full max-w-7xl px-0">
      {/* Ambient backlight */}
      <div
        className="bg-[#D97706]/10 blur-[100px] w-3/4 h-8 absolute inset-x-0 mx-auto -bottom-2 -z-10 pointer-events-none"
        aria-hidden="true"
      />

      {/* Floating Glass Ribbon Container */}
      <div className="rounded-2xl border border-white/10 bg-gradient-to-r from-white/[0.04] via-white/[0.02] to-white/[0.04] backdrop-blur-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),0_15px_35px_rgba(0,0,0,0.6)]">
        <div className="grid w-full grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 items-stretch divide-y divide-white/[0.08] sm:divide-y-0 lg:divide-x">
          {trustPillars.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className="flex items-center justify-center gap-3 py-3.5 px-4 text-center group cursor-default"
              >
                <Icon className="text-[#FF9F3C] w-4 h-4 flex-shrink-0 group-hover:scale-110 transition-transform duration-200" />
                <span className="text-xs font-semibold text-zinc-300 group-hover:text-white tracking-wide transition-colors">
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
