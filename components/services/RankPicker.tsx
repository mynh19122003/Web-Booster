"use client";

import Image from "next/image";
import { Check, ChevronDown, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { createPortal } from "react-dom";
import type { CSSProperties } from "react";
import { gameRanks, rankLevelsFor } from "@/lib/service-options";

const tierGlowColors: Record<string, { glow: string; text: string }> = {
  Iron: { glow: "rgba(161, 161, 170, 0.22)", text: "text-zinc-400" },
  Bronze: { glow: "rgba(180, 83, 9, 0.26)", text: "text-amber-600" },
  Silver: { glow: "rgba(203, 213, 225, 0.26)", text: "text-slate-300" },
  Gold: { glow: "rgba(255, 159, 60, 0.30)", text: "text-[#FF9F3C]" },
  Platinum: { glow: "rgba(45, 212, 191, 0.28)", text: "text-teal-400" },
  Emerald: { glow: "rgba(16, 185, 129, 0.30)", text: "text-emerald-400" },
  Diamond: { glow: "rgba(56, 189, 248, 0.32)", text: "text-sky-400" },
  Ascendant: { glow: "rgba(52, 211, 153, 0.30)", text: "text-emerald-400" },
  Immortal: { glow: "rgba(244, 63, 94, 0.34)", text: "text-rose-500" },
  Radiant: { glow: "rgba(254, 240, 138, 0.36)", text: "text-amber-300" },
  Master: { glow: "rgba(192, 132, 252, 0.34)", text: "text-purple-400" },
  Grandmaster: { glow: "rgba(244, 63, 94, 0.34)", text: "text-rose-500" },
  Challenger: { glow: "rgba(251, 191, 36, 0.36)", text: "text-amber-400" },
};

export function RankPicker({
  game,
  label,
  value,
  min = 0,
  max,
  onChange,
}: {
  game: string;
  label: string;
  value: number;
  min?: number;
  max: number;
  onChange: (value: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const modalRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const reduced = useReducedMotion();

  // Close on Escape key press
  useEffect(() => {
    if (!open) return;
    const trigger = triggerRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    modalRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      if (e.key === "Tab") {
        const controls = modalRef.current?.querySelectorAll<HTMLButtonElement>("button:not(:disabled)");
        if (!controls?.length) return;
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      trigger?.focus();
    };
  }, [open]);

  const levels = rankLevelsFor(game);
  const selected = levels[value];
  const draftSelected = levels[draft] ?? selected;
  const tiers = gameRanks[game];
  const divisions = levels
    .map((rank, index) => ({ ...rank, index }))
    .filter((r) => r.tier === draftSelected.tier);

  const tierTheme = tierGlowColors[selected.tier] ?? {
    glow: "rgba(255, 159, 60, 0.28)",
    text: "text-[#FF9F3C]",
  };

  return (
    <fieldset className="border-0 m-0 p-0 min-w-0 w-full h-full">
      {/* Hero Glassmorphic Card - Symmetrical with fixed min-height & balanced vertical rhythm */}
      <div className="relative group/card h-full min-h-[330px] bg-white/[0.02] backdrop-blur-xl border border-white/[0.08] shadow-[inset_0_1px_1px_rgba(255,255,255,0.12),0_12px_36px_rgba(0,0,0,0.5)] rounded-2xl p-6 flex flex-col items-center justify-between text-center transition-all duration-300 hover:border-white/15">
        {/* Card Header Label */}
        <span className="text-[11px] font-heading font-bold tracking-widest uppercase text-zinc-400 select-none">
          {label}
        </span>

        {/* 2. PROMINENT, CRISP RANK EMBLEM (w-28 h-28 with centered tier radial glow) */}
        <div className="relative w-28 h-28 my-auto flex items-center justify-center select-none">
          <div
            className="absolute inset-0 rounded-full blur-2xl pointer-events-none transition-all duration-500 scale-125"
            style={{
              background: `radial-gradient(circle, ${tierTheme.glow} 0%, transparent 70%)`,
            }}
            aria-hidden="true"
          />
          <div className="relative z-10 w-28 h-28 rank-hero-emblem flex items-center justify-center">
            <RankEmblem game={game} tier={selected.tier} src={selected.icon} />
          </div>
        </div>

        {/* Centered Rank Title and Change Button */}
        <div className="w-full mt-3">
          <h3 className="text-xl font-heading font-bold uppercase tracking-wide text-white mb-3 select-none">
            {selected.label}
          </h3>

          {/* Sleek Dropdown Trigger Button */}
          <button
            type="button"
            ref={triggerRef}
            onClick={() => { setDraft(value); setOpen(true); }}
            className="w-full py-2.5 px-4 rounded-xl bg-black/40 hover:bg-black/60 border border-white/10 hover:border-[#FF9F3C]/50 text-xs font-heading uppercase tracking-wider font-semibold text-zinc-300 hover:text-white transition-all cursor-pointer flex items-center justify-center gap-2 select-none outline-none shadow-sm focus:border-[#FF9F3C]/50"
            aria-haspopup="dialog"
            aria-expanded={open}
          >
            <span>Change Tier & Division</span>
            <ChevronDown
              size={15}
              className={`text-zinc-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            />
          </button>
        </div>
      </div>

      {/* 1. ELEVATED FLOATING POPOVER / MODAL CONTAINER (Rendered via Portal to eliminate overlap collisions) */}
      {open &&
        createPortal(
          <div
            className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setOpen(false)}
            role="dialog"
            aria-modal="true"
            aria-label={`Select ${label}`}
          >
            <motion.div
              ref={modalRef}
              initial={reduced ? false : { opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: reduced ? 0 : 0.25 }}
              className="w-full max-w-lg max-h-[calc(100dvh-2rem)] overflow-y-auto bg-[#121316]/95 backdrop-blur-2xl border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),0_25px_60px_rgba(0,0,0,0.8)] rounded-3xl p-6 md:p-8 relative text-left"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header with Title and Close Button */}
              <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-white/[0.08]">
                <div>
                  <span className="text-[10px] font-heading font-bold tracking-widest uppercase text-[#FF9F3C] block mb-0.5">
                    {game === "valorant"
                      ? "VALORANT"
                      : game === "teamfight-tactics"
                        ? "TFT"
                        : "LEAGUE OF LEGENDS"}
                  </span>
                  <h4 className="text-base font-heading font-bold uppercase tracking-wide text-white">
                    Select {label}
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
                  aria-label="Close selector"
                >
                  <X size={18} />
                </button>
              </div>

              {/* 2. CRISP, VISIBLE RANK GRID */}
              <div
                className="grid grid-cols-3 gap-3 mb-8"
                role="group"
                aria-label={`${label} tier selection`}
              >
                {tiers.map((tier) => {
                  const candidates = levels
                    .map((rank, index) => ({ ...rank, index }))
                    .filter((r) => r.tier === tier && r.index >= min && r.index <= max);
                  const representative =
                    levels.find((r) => r.tier === tier && r.division === "3") ??
                    levels.find((r) => r.tier === tier)!;
                  const active = draftSelected.tier === tier;
                  const glow = tierGlowColors[tier]?.glow ?? tierTheme.glow;

                  return (
                    <motion.button
                      key={tier}
                      type="button"
                      title={tier}
                      aria-label={`${label}: ${tier}`}
                      aria-pressed={active}
                      disabled={!candidates.length}
                      whileHover={reduced || !candidates.length ? undefined : { scale: 1.04, y: -2 }}
                      whileTap={reduced || !candidates.length ? undefined : { scale: 0.97 }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                      style={active ? { borderColor: glow, boxShadow: `0 0 20px ${glow}` } : undefined}
                      className={`rank-tier-btn group isolate relative flex flex-col items-center justify-center py-4 px-2 rounded-2xl border transition-colors duration-300 cursor-pointer ${
                        active
                          ? "border-[#FF9F3C] bg-white/[0.05] shadow-[0_0_15px_rgba(255,159,60,0.2)]"
                          : "border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/20"
                      } disabled:opacity-20 disabled:cursor-not-allowed`}
                      onClick={() =>
                        setDraft(
                          (
                            candidates.find((r) => r.division === draftSelected.division) ??
                            candidates[0]
                          ).index,
                        )
                      }
                    >
                      <div aria-hidden="true" className={`absolute -z-10 w-16 h-16 rounded-full blur-xl pointer-events-none transition-opacity duration-300 ${active ? "opacity-100" : "opacity-0 group-hover:opacity-75"}`} style={{ backgroundColor: glow }} />
                      <div className="w-12 h-12 flex items-center justify-center relative overflow-visible my-0.5">
                        <RankEmblem game={game} tier={tier} src={representative.icon} />
                      </div>
                      <span className="mt-1 text-xs font-semibold text-zinc-300 truncate w-full text-center">
                        {tier}
                      </span>
                      {active && (
                        <Check
                          size={13}
                          className="absolute top-1.5 right-1.5 text-[#FF9F3C]"
                        />
                      )}
                    </motion.button>
                  );
                })}
              </div>

              {/* 3. DEDICATED DIVISION SELECTOR (IV, III, II, I) */}
              {divisions.length > 1 && (
                <div className="pt-4 border-t border-white/[0.08]">
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-[10px] font-bold tracking-widest uppercase text-zinc-400">
                      SELECT DIVISION
                    </span>
                    <span className="text-xs text-zinc-400">
                      Tier: <strong className="text-white font-medium">{draftSelected.tier}</strong>
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {divisions.map((rank) => (
                      <button
                        key={rank.index}
                        type="button"
                        aria-label={`${label}: ${rank.label}`}
                        aria-pressed={draft === rank.index}
                        disabled={rank.index < min || rank.index > max}
                        className={`h-10 rounded-lg text-sm font-bold transition-all flex items-center justify-center cursor-pointer ${
                          draft === rank.index
                            ? "bg-black/60 text-[#FF9F3C] border border-[#FF9F3C] shadow-[0_0_15px_rgba(255,159,60,0.25)]"
                            : "bg-black/40 border border-white/10 text-white hover:border-[#FF9F3C]/50 hover:bg-black/60"
                        } disabled:opacity-20 disabled:cursor-not-allowed`}
                        onClick={() => {
                          setDraft(rank.index);
                        }}
                      >
                        {rank.division}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Confirmation / Close button */}
              <button
                type="button"
                disabled={draft < min || draft > max}
                onClick={() => { onChange(draft); setOpen(false); }}
                className="w-full mt-6 h-12 rounded-xl bg-gradient-to-r from-[#FF9F3C] via-[#F59E0B] to-[#D97706] text-black font-extrabold text-xs uppercase tracking-widest shadow-[0_0_20px_rgba(255,159,60,0.35)] hover:shadow-[0_0_30px_rgba(255,159,60,0.5)] hover:brightness-110 active:scale-[0.99] transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Confirm Selection
              </button>
            </motion.div>
          </div>,
          document.body,
        )}
    </fieldset>
  );
}

// League client emblems include a large transparent canvas; fit the visible crest.
const leagueScale: Record<string, number> = {
  Iron: 3.12,
  Bronze: 2.62,
  Silver: 2.41,
  Gold: 2.39,
  Platinum: 2.34,
  Emerald: 2.12,
  Diamond: 1.96,
  Master: 2.05,
  Grandmaster: 1.97,
  Challenger: 1.91,
};

export function RankEmblem({
  game,
  tier,
  src,
}: {
  game: string;
  tier: string;
  src: string;
}) {
  return (
    <span
      className={`rank-emblem ${game === "valorant" ? "" : "rank-emblem-league"}`}
      style={{ "--emblem-scale": leagueScale[tier] ?? 3 } as CSSProperties}
      aria-hidden="true"
    >
      <Image src={src} alt="" width={160} height={160} unoptimized />
    </span>
  );
}
