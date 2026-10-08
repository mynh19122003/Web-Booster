"use client";

import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { games } from "@/data/games";
import { initialRanks, servicesFor } from "@/lib/service-options";
import { useStore } from "@/store/useStore";
import { useLanguage } from "@/components/ui/LanguageProvider";

export function GameSelector() {
  const { t } = useLanguage();
  const game = useStore((state) => state.game);
  const service = useStore((state) => state.service);
  const set = useStore((state) => state.set);
  const router = useRouter();
  const pathname = usePathname();
  const reducedMotion = useReducedMotion();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const current = games.find((item) => item.slug === game) ?? games[0];

  useEffect(() => {
    if (!open) return;
    const closeOnOutside = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  function selectGame(nextGame: string) {
    const nextService = servicesFor(nextGame).some((option) => option.slug === service)
      ? service
      : "rank-boost";
    const nextQueue = nextService === "duo-boost"
      ? "Duo"
      : nextGame === "valorant"
        ? "Competitive"
        : nextGame === "teamfight-tactics"
          ? "Ranked"
          : "Solo";
    set({
      game: nextGame,
      product: null,
      checkoutDetails: null,
      quoteOverride: null,
      quoteAddOns: [],
      service: nextService,
      ...initialRanks(nextGame),
      queue: nextQueue,
      role: nextGame === "valorant" ? "Duelist" : nextGame === "league-of-legends" ? "Mid" : "Any",
      champions: "",
    });
    setOpen(false);
    const destination = `/games/${nextGame === "teamfight-tactics" ? "tft" : nextGame}`;
    if (pathname !== destination) router.push(destination, { scroll: false });
  }

  return (
    <div className="game-selector" ref={rootRef}>
      <button
        type="button"
        className="game-selector-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`${t("selectedGame")}: ${current.name}`}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="game-selector-logo"><Image src={current.logo} alt="" width={24} height={24} /></span>
        <span className="game-selector-copy"><strong>{current.name}</strong></span>
        <ChevronDown size={17} className={open ? "game-selector-chevron is-open" : "game-selector-chevron"} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            className="game-selector-menu"
            role="listbox"
            aria-label={t("selectGameAria")}
            initial={reducedMotion ? false : { opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: reducedMotion ? 0.12 : 0.18, ease: "easeOut" }}
          >
            {games.map((item) => (
              <button
                key={item.slug}
                type="button"
                role="option"
                aria-selected={item.slug === game}
                className="game-selector-option"
                onClick={() => selectGame(item.slug)}
              >
                <span className="game-selector-logo"><Image src={item.logo} alt="" width={24} height={24} /></span>
                <span><strong>{item.name}</strong><small>{item.short}</small></span>
                {item.slug === game && <Check size={17} aria-hidden="true" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
