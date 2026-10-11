"use client";

import { motion, useReducedMotion } from "motion/react";
import { AccountImage } from "@/components/account/AccountImage";
import { useLanguage } from "@/components/ui/LanguageProvider";
import { championIconSources } from "@/lib/account-artwork";
import { translateText } from "@/lib/i18n";
import type { TopChampionSummary } from "@/lib/riot-types";

export function TopChampionsList({ champions }: { champions: TopChampionSummary[] }) {
  const { language } = useLanguage();
  const reducedMotion = useReducedMotion();
  const copy = (en: string, vi: string) => translateText(language, en, vi);

  return (
    <motion.ul
      className="champion-stats-list"
      initial={reducedMotion ? false : "hidden"}
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: reducedMotion ? 0 : 0.07 } } }}
    >
      {champions.map((champion) => {
        const winRate = Number.isFinite(champion.winRate) ? Math.min(100, Math.max(0, champion.winRate)) : 0;
        const tier = winRate >= 60 ? "high" : winRate >= 50 ? "medium" : "low";
        return (
          <motion.li
            key={champion.championId}
            className="champion-stats-row"
            variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}
            transition={{ duration: reducedMotion ? 0 : 0.3 }}
          >
            <AccountImage sources={championIconSources(champion.championName, champion.championKey)} alt="" width={48} height={48} fallbackLabel={champion.championName} />
            <div className="champion-stats-identity">
              <strong>{champion.championName}</strong>
              <small>{champion.gamesPlayed} {copy("games", "trận")} · {champion.wins} {copy("wins", "thắng")}</small>
            </div>
            <div className="champion-win-rate" data-tier={tier}>
              <span>{winRate}% <small>{copy("win rate", "tỷ lệ thắng")}</small></span>
              <div className="champion-win-rate-track" role="progressbar" aria-label={`${champion.championName} ${copy("win rate", "tỷ lệ thắng")}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={winRate}>
                <motion.span
                  className="champion-win-rate-fill"
                  style={{ width: `${winRate}%` }}
                  initial={reducedMotion ? false : { scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: reducedMotion ? 0 : 0.6, delay: reducedMotion ? 0 : 0.15 }}
                />
              </div>
            </div>
          </motion.li>
        );
      })}
    </motion.ul>
  );
}
