"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  ShieldCheck,
  GraduationCap,
  Users,
  Trophy,
  Target,
} from "lucide-react";
import { useStore } from "@/store/useStore";
import { games } from "@/data/games";
import { initialRanks, ranksFor, servicesFor } from "@/lib/service-options";
import { RankPicker } from "@/components/services/RankPicker";
import { estimateQuote } from "@/lib/quote";
import { CurrencySwitch, useMoney } from "@/components/ui/Currency";
import { RegionSelector } from "@/components/ui/RegionSelector";
import { regions } from "@/data/regions";

const icons = {
  "rank-boost": Trophy,
  "duo-boost": Users,
  coaching: GraduationCap,
  placements: Target,
};

export function ServiceConfigurator() {
  const s = useStore();
  const sectionRef = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) =>
      setInView(entry.isIntersecting),
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const money = useMoney();
  const ranks = ranksFor(s.game);
  const choices = servicesFor(s.game);
  const service =
    choices.find((option) => option.slug === s.service) ?? choices[0];
  const current = Math.min(s.current, ranks.length - 2);
  const target = Math.min(Math.max(s.target, current + 1), ranks.length - 1);
  const queue = service.slug === "duo-boost" ? "Duo" : "Solo";
  const { price, minHours, maxHours } = estimateQuote(
    current,
    target,
    queue,
    service.slug,
    s.units,
    s.game,
  );
  const unitService =
    service.slug === "coaching" || service.slug === "placements";

  function reviewPlan() {
    s.set({ current, target, service: service.slug, queue, modal: "checkout" });
  }

  return (
    <section
      ref={sectionRef}
      className="section compact-config relative overflow-hidden py-16"
      id="configure"
    >
      {/* 1. AMBIENT BACKGROUND GLOW (Burnt Orange & Prime Gold diffusion) */}
      <div
        className="absolute -top-32 left-1/4 w-[500px] h-[500px] bg-[#FF9F3C] rounded-full blur-[160px] opacity-15 pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute -bottom-32 right-1/4 w-[500px] h-[500px] bg-[#D97706] rounded-full blur-[160px] opacity-15 pointer-events-none"
        aria-hidden="true"
      />

      <div className="container relative z-10">
        <div className="section-heading mb-8" data-reveal>
          <div>
            <p className="eyebrow text-[#FF9F3C]">RANK CONFIGURATOR</p>
            <h2>
              A plan for <span className="muted">your climb.</span>
            </h2>
          </div>
          <Link href="/services" className="text-link">
            All services <ArrowUpRight size={17} />
          </Link>
        </div>

        {/* 2. MAIN CONTAINER */}
        <div className="glass-panel relative overflow-hidden bg-gradient-to-b from-white/[0.05] via-white/[0.02] to-transparent backdrop-blur-2xl border border-white/10 rounded-3xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),0_20px_60px_rgba(0,0,0,0.7)]">
          {/* Top Bar: Game Selector */}
          <div className="flex items-center justify-between gap-4 p-4 sm:px-8 border-b border-white/[0.06] bg-white/[0.01]">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Selected Game
            </span>
            <div className="flex items-center gap-3">
              <label className="sr-only" htmlFor="game">
                Game
              </label>
              <select
                id="game"
                value={s.game}
                onChange={(e) => {
                  const game = e.target.value;
                  const nextService = servicesFor(game).some(
                    (option) => option.slug === s.service,
                  )
                    ? s.service
                    : "rank-boost";
                  s.set({
                    game,
                    service: nextService,
                    ...initialRanks(game),
                    queue: nextService === "duo-boost" ? "Duo" : "Solo",
                  });
                }}
                className="bg-black/40 backdrop-blur-md border border-white/10 rounded-lg px-3.5 py-1.5 text-sm text-white font-medium focus:outline-none focus:border-[#FF9F3C]/50 hover:border-white/20 transition-all cursor-pointer"
              >
                {games.map((g) => (
                  <option key={g.slug} value={g.slug} className="bg-[#121316]/95 backdrop-blur-2xl text-white">
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 5. TAB NAVIGATION (Tabs with soft gold gradient glow underneath active tab) */}
          <div
            className="grid grid-cols-2 sm:grid-cols-4 border-b border-white/[0.06] bg-black/20"
            role="group"
            aria-label="Choose service"
          >
            {choices.map((option) => {
              const Icon = icons[option.slug as keyof typeof icons];
              const isActive = service.slug === option.slug;
              return (
                <button
                  key={option.slug}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() =>
                    s.set({
                      service: option.slug,
                      queue: option.slug === "duo-boost" ? "Duo" : "Solo",
                    })
                  }
                  className={`relative flex items-center justify-center gap-2.5 min-h-[60px] px-4 text-xs sm:text-sm font-medium transition-all ${
                    isActive
                      ? "text-[#FF9F3C] font-semibold bg-white/[0.02]"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.02]"
                  }`}
                >
                  <Icon
                    size={18}
                    className={isActive ? "text-[#FF9F3C]" : "text-zinc-400"}
                  />
                  <span>{option.name}</span>
                  {isActive && (
                    <>
                      {/* Active line with soft fade at edges */}
                      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#FF9F3C] to-transparent" />
                      {/* Soft gold gradient glow underneath */}
                      <div
                        className="absolute -bottom-1 left-1/4 right-1/4 h-3 bg-[#FF9F3C]/20 blur-md pointer-events-none"
                        aria-hidden="true"
                      />
                    </>
                  )}
                </button>
              );
            })}
          </div>

          {/* Configuration Body & Order Summary Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 p-6 sm:p-8">
            {/* Left Column: Controls & Ranks */}
            <div className="lg:col-span-7 xl:col-span-8 flex flex-col justify-between space-y-6">
              <div>
                {unitService ? (
                  <div className="bg-black/40 backdrop-blur-md border border-white/[0.06] rounded-xl p-5 mb-6 space-y-3">
                    <label
                      htmlFor="service-units"
                      className="block text-xs font-semibold tracking-wider uppercase text-zinc-400"
                    >
                      {service.slug === "coaching"
                        ? "Coaching hours"
                        : "Placement matches"}
                    </label>
                    <input
                      id="service-units"
                      type="number"
                      min={1}
                      max={10}
                      value={s.units}
                      onChange={(e) =>
                        s.set({
                          units: Math.max(
                            1,
                            Math.min(10, Number(e.target.value) || 1),
                          ),
                        })
                      }
                      className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white text-base focus:outline-none focus:border-[#FF9F3C]/50 transition-all"
                    />
                    <p className="text-xs text-zinc-400">
                      {service.slug === "coaching"
                        ? "One-to-one sessions with replay review and practice plan."
                        : "Select number of placement matches."}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-stretch gap-4 lg:gap-6 mb-6">
                    <RankPicker
                      game={s.game}
                      label="Current rank"
                      value={current}
                      max={ranks.length - 2}
                      onChange={(value) =>
                        s.set({
                          current: value,
                          target: Math.max(target, value + 1),
                        })
                      }
                    />

                    {/* Centered Forward Transition Arrow */}
                    <div className="flex items-center justify-center -my-2 md:my-0 select-none">
                      <div className="w-11 h-11 rounded-full bg-white/[0.03] backdrop-blur-md border border-white/[0.08] shadow-[0_0_20px_rgba(255,159,60,0.15)] flex items-center justify-center text-[#FF9F3C] shrink-0 rotate-90 md:rotate-0 transition-transform">
                        <ArrowRight size={20} />
                      </div>
                    </div>

                    <RankPicker
                      game={s.game}
                      label="Desired rank"
                      value={target}
                      min={current + 1}
                      max={ranks.length - 1}
                      onChange={(value) => s.set({ target: value })}
                    />
                  </div>
                )}

                {/* Sub-options: Region, Role, Queue */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <div className="bg-black/40 backdrop-blur-md border border-white/[0.06] rounded-xl p-3.5 hover:border-[#FF9F3C]/50 hover:bg-black/50 transition-all">
                    <RegionSelector
                      options={regions}
                      value={s.region}
                      onChange={(region) => s.set({ region })}
                    />
                  </div>

                  {s.game === "league-of-legends" ? (
                    <div className="bg-black/40 backdrop-blur-md border border-white/[0.06] rounded-xl p-3.5 hover:border-[#FF9F3C]/50 hover:bg-black/50 transition-all flex flex-col justify-between">
                      <label className="text-[11px] font-semibold tracking-wider uppercase text-zinc-400 block mb-1">
                        ROLE
                      </label>
                      <select
                        aria-label="ROLE"
                        value={s.role}
                        onChange={(e) => s.set({ role: e.target.value })}
                        className="w-full bg-transparent text-sm text-white font-medium focus:outline-none cursor-pointer"
                      >
                        {["Mid", "Top", "Jungle", "ADC", "Support", "Any"].map(
                          (r) => (
                            <option key={r} value={r} className="bg-[#121316]/95 backdrop-blur-2xl text-white">
                              {r}
                            </option>
                          ),
                        )}
                      </select>
                    </div>
                  ) : (
                    <div className="bg-black/40 backdrop-blur-md border border-white/[0.06] rounded-xl p-3.5 flex flex-col justify-between">
                      <span className="text-[11px] font-semibold tracking-wider uppercase text-zinc-400 block">
                        SERVER
                      </span>
                      <strong className="text-sm font-medium text-white mt-1">
                        Official
                      </strong>
                    </div>
                  )}

                  <div className="bg-black/40 backdrop-blur-md border border-white/[0.06] rounded-xl p-3.5 flex flex-col justify-between">
                    <span className="text-[11px] font-semibold tracking-wider uppercase text-zinc-400 block">
                      QUEUE
                    </span>
                    <strong className="text-sm font-medium text-white mt-1">
                      {queue}
                    </strong>
                  </div>
                </div>

                {/* Optional Preferences Accordion */}
                <details className="mt-6 bg-black/30 border border-white/[0.06] rounded-xl p-4 transition-all group">
                  <summary className="text-xs font-semibold text-zinc-400 uppercase tracking-wider cursor-pointer list-none flex items-center justify-between select-none">
                    <span>
                      Optional preferences{s.champions ? " · Added" : ""}
                    </span>
                    <span className="text-[11px] text-zinc-500 font-normal">
                      Click to expand
                    </span>
                  </summary>
                  <div className="pt-3 mt-3 border-t border-white/5">
                    <label className="block text-xs font-medium text-zinc-400 mb-2">
                      {s.game === "valorant"
                        ? "PREFERRED AGENTS"
                        : s.game === "teamfight-tactics"
                          ? "PREFERRED COMPOSITIONS"
                          : "PREFERRED CHAMPIONS"}
                    </label>
                    <input
                      value={s.champions}
                      onChange={(e) => s.set({ champions: e.target.value })}
                      placeholder="Your preferences (e.g. specific roles, champions)"
                      maxLength={120}
                      className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-[#FF9F3C]/50 transition-all placeholder:text-zinc-600"
                    />
                  </div>
                </details>
              </div>
            </div>

            {/* 4. RIGHT-SIDE ORDER SUMMARY */}
            <div className="lg:col-span-5 xl:col-span-4 bg-white/[0.025] backdrop-blur-xl border border-white/[0.07] rounded-xl p-6 sm:p-7 flex flex-col justify-between shadow-[inset_0_1px_1px_rgba(255,255,255,0.08),0_10px_30px_rgba(0,0,0,0.4)]">
              <div>
                <div className="flex items-center justify-between gap-2 mb-4">
                  <span className="text-[11px] font-heading font-bold tracking-widest text-zinc-400 uppercase">
                    ORDER SUMMARY
                  </span>
                  <CurrencySwitch />
                </div>

                {/* Plan Selection Details */}
                <p className="text-sm font-medium text-zinc-300 leading-relaxed py-2">
                  <strong className="text-white block font-heading font-bold uppercase tracking-wide text-base mb-1">
                    {games.find((game) => game.slug === s.game)?.name}
                  </strong>
                  {unitService
                    ? `${s.units} ${service.slug === "coaching" ? "hours" : "matches"}`
                    : `${ranks[current]} → ${ranks[target]}`}
                  <br />
                  <span className="text-xs text-zinc-400 mt-1 block">
                    {s.region} · {queue}
                    {s.game === "league-of-legends" ? ` · ${s.role}` : ""}
                  </span>
                </p>

                {/* Big Price with micro gold glow and tabular-nums */}
                <div
                  className="text-4xl sm:text-5xl font-heading font-extrabold tracking-tight text-white drop-shadow-[0_0_15px_rgba(255,159,60,0.18)] flex items-baseline gap-2 my-5 select-none tabular-nums"
                  aria-live="polite"
                  aria-atomic="true"
                >
                  {money.format(price)}
                  <small className="text-sm font-heading font-bold text-zinc-400 tracking-normal">
                    {money.currency}
                  </small>
                </div>

                {/* Summary rows */}
                <div className="space-y-3 pt-3 border-t border-white/[0.06] text-xs">
                  <div className="flex items-center justify-between text-zinc-400">
                    <span>Estimated delivery</span>
                    <strong className="text-white font-medium tabular-nums">
                      {minHours}–{maxHours} hours
                    </strong>
                  </div>
                  <div className="flex items-center justify-between text-zinc-400">
                    <span>Service</span>
                    <strong className="text-white font-medium">
                      {service.name}
                    </strong>
                  </div>
                </div>
              </div>

              {/* CTA Button and Security Notice */}
              <div className="mt-8">
                <button
                  type="button"
                  className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-[#FF9F3C] to-[#D97706] text-black font-heading font-bold uppercase tracking-wider text-sm hover:brightness-110 shadow-[0_0_20px_rgba(255,159,60,0.25)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  disabled={money.amount(price) === null}
                  onClick={reviewPlan}
                >
                  <span>Start Boost</span>
                  <ArrowUpRight size={17} />
                </button>
                <small className="flex items-center justify-center gap-1.5 text-[11px] text-zinc-400 text-center mt-3.5">
                  <ShieldCheck size={14} className="text-[#FF9F3C]" /> Instant assignment · 100% Encrypted
                </small>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Floating Plan Bar */}
      {inView && !s.modal && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0e1014]/90 backdrop-blur-xl border-t border-white/10 p-3.5 px-5 flex items-center justify-between shadow-2xl">
          <div>
            <strong className="text-lg font-bold text-white block">
              {money.format(price)}
            </strong>
            <span className="text-xs text-zinc-400">
              {s.region} ·{" "}
              {unitService
                ? service.name
                : `${ranks[current]} → ${ranks[target]}`}
            </span>
          </div>
          <button
            type="button"
            className="py-2.5 px-5 rounded-lg bg-gradient-to-r from-[#FF9F3C] to-[#D97706] text-black font-semibold text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(255,159,60,0.25)] disabled:opacity-50"
            disabled={money.amount(price) === null}
            onClick={reviewPlan}
          >
            Start Boost <ArrowUpRight size={15} />
          </button>
        </div>
      )}
    </section>
  );
}
