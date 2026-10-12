"use client";

import Image from "next/image";
import { Coins, Languages, Layers3, Swords } from "lucide-react";
import type { Coach } from "@/data/coaches";
import { useLanguage } from "@/components/ui/LanguageProvider";
import { LanguageBadge } from "@/components/ui/LanguageBadge";

export function CoachAttributes({ coach }: { coach: Coach }) {
  const { t } = useLanguage();
  return <div className="coach-attributes pt-6 overflow-visible">
    <div className="coach-attribute-group">
      <span className="coach-attribute-label"><Swords size={15} aria-hidden="true" />{t("coachRoles")}</span>
      <ul className="coach-attribute-badges">
        {coach.roles.map((role) => {
          const slug = role.toLowerCase();
          const icon = coach.game === "league-of-legends" && ["top", "jungle", "mid", "adc", "support"].includes(slug) ? `/images/roles/lol/${slug}.svg`
            : coach.game === "valorant" && ["duelist", "initiator", "controller", "sentinel"].includes(slug) ? `/images/roles/valorant/${slug}.png` : null;
          const TftIcon = role === "Economy" ? Coins : Layers3;
          return <li key={role} className="coach-attribute-badge coach-position-badge hover:border-[#FF9F3C]/40 hover:text-white">
            {icon ? <Image src={icon} alt="" width={20} height={20} /> : <TftIcon size={20} aria-hidden="true" />}<span>{role}</span>
          </li>;
        })}
      </ul>
    </div>
    <div className="coach-attribute-group">
      <span className="coach-attribute-label"><Languages size={15} aria-hidden="true" />{t("coachLanguages")}</span>
      <ul className="coach-attribute-badges">
        {coach.languages.map((language) => <li key={language} className="coach-attribute-badge">
          <LanguageBadge language={language} />
        </li>)}
      </ul>
    </div>
  </div>;
}
