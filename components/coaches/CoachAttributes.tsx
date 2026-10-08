"use client";

import Image from "next/image";
import { Coins, Globe2, Languages, Layers3, Swords } from "lucide-react";
import type { Coach } from "@/data/coaches";
import { useLanguage } from "@/components/ui/LanguageProvider";

const languageFlags: Record<string, string> = {
  English: "us", "Tiếng Việt": "vn", Deutsch: "de", "한국어": "kr",
  Français: "fr", Español: "es", "日本語": "jp", "中文": "cn", Chinese: "cn",
};

export function CoachAttributes({ coach }: { coach: Coach }) {
  const { t } = useLanguage();
  return <div className="coach-attributes">
    <div className="coach-attribute-group">
      <span className="coach-attribute-label"><Swords size={15} aria-hidden="true" />{t("coachRoles")}</span>
      <ul className="coach-attribute-badges">
        {coach.roles.map((role) => {
          const slug = role.toLowerCase();
          const icon = coach.game === "league-of-legends" && ["top", "jungle", "mid", "adc", "support"].includes(slug) ? `/images/roles/lol/${slug}.svg`
            : coach.game === "valorant" && ["duelist", "initiator", "controller", "sentinel"].includes(slug) ? `/images/roles/valorant/${slug}.png` : null;
          const TftIcon = role === "Economy" ? Coins : Layers3;
          return <li key={role} className="coach-attribute-badge coach-position-badge">
            {icon ? <Image src={icon} alt="" width={20} height={20} /> : <TftIcon size={20} aria-hidden="true" />}<span>{role}</span>
          </li>;
        })}
      </ul>
    </div>
    <div className="coach-attribute-group">
      <span className="coach-attribute-label"><Languages size={15} aria-hidden="true" />{t("coachLanguages")}</span>
      <ul className="coach-attribute-badges">
        {coach.languages.map((language) => <li key={language} className="coach-attribute-badge">
          {languageFlags[language] ? <Image className="coach-language-flag" src={`/images/flags/${languageFlags[language]}.svg`} alt="" width={24} height={16} /> : <Globe2 size={20} aria-hidden="true" />}
          <span>{language}</span>
        </li>)}
      </ul>
    </div>
  </div>;
}
