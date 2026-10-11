"use client";

import Image from "next/image";
import { ArrowUpRight, Check, Swords } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { coachRankCardIconPath, type Coach } from "@/data/coaches";
import type { CoachOffer } from "@/data/coach-profile";
import { useLanguage } from "@/components/ui/LanguageProvider";
import { useMoney } from "@/components/ui/Currency";
import { translateText } from "@/lib/i18n";

type DuoPackageGridProps = {
  game: Coach["game"];
  offers: CoachOffer[];
  selectedOfferId: string;
  onSelect: (offerId: string) => void;
};

export function DuoPackageGrid({ game, offers, selectedOfferId, onSelect }: DuoPackageGridProps) {
  const { language, t } = useLanguage();
  const money = useMoney();
  const reducedMotion = useReducedMotion();

  return (
    <div className="coach-offer-grid" role="group" aria-label={t("coachDuoPackages")}>
      {offers.map((offer) => {
        const selected = selectedOfferId === offer.id;
        return (
          <motion.div
            key={offer.id}
            className="coach-duo-package"
            animate={{ y: 0, scale: 1 }}
            whileHover={reducedMotion ? { y: 0, scale: 1 } : { y: -6, scale: 1.02 }}
            whileTap={reducedMotion ? { scale: 1 } : { scale: 0.98 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
          >
            <button
              type="button"
              className={`coach-offer-card ${selected ? "is-selected" : ""}`}
              aria-pressed={selected}
              onClick={() => onSelect(offer.id)}
            >
              {offer.featured && <span className="coach-offer-featured">{t("coachMostPicked")}</span>}
              <span className="coach-offer-emblems">
                {offer.startRank === "Unranked" ? <Swords size={23} aria-hidden="true" /> : <Image src={coachRankCardIconPath(game, offer.startRank)} alt="" width={34} height={34} />}
                <ArrowUpRight size={14} aria-hidden="true" />
                {offer.targetRank === "Unranked" ? <Swords size={23} aria-hidden="true" /> : <Image src={coachRankCardIconPath(game, offer.targetRank)} alt="" width={34} height={34} />}
              </span>
              <strong>{t("coachPlayTogether")} {offer.startRank}</strong>
              <small>{offer.startRank} → {offer.targetRank}</small>
              <span className="coach-offer-detail">{offer.startRank === "Unranked"
                ? translateText(language, "Casual games · any rank", "Chơi thường · mọi rank")
                : translateText(language, "Ranked duo · {value0}+ lobbies", "Duo xếp hạng · lobby {value0}+", { value0: offer.startRank })}</span>
              <span className="coach-offer-price">{money.format(offer.price)} <small>/ {translateText(language, "game", "trận")}</small></span>
              <span className="coach-offer-selection" aria-hidden="true"><Check size={13} /></span>
            </button>
          </motion.div>
        );
      })}
    </div>
  );
}
