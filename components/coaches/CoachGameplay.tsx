"use client";
import { translateText } from "@/lib/i18n";

import { useState } from "react";
import { Swords, Heart } from "lucide-react";
import type { Coach } from "@/data/coaches";
import { coachGameLogoPath } from "@/data/coaches";
import { AccountImage } from "@/components/account/AccountImage";
import { championIconSources } from "@/lib/account-artwork";
import { useLanguage } from "@/components/ui/LanguageProvider";

const pools: Record<string, string[]> = {
  luna: ["Ahri", "Orianna", "Syndra", "Lux", "Nami", "Thresh"],
  rift: ["Lee Sin", "Viego", "Graves", "Jax", "Camille", "Gnar"],
  mira: ["Jinx", "Kai'Sa", "Caitlyn", "Ezreal", "Lulu", "Nautilus"],
  nova: ["Jett", "Raze", "Reyna", "Sova", "Fade", "KAY/O"],
  kairo: ["Omen", "Viper", "Brimstone", "Killjoy", "Cypher", "Sage"],
  vex: ["Fast 8", "Reroll", "Tempo", "Econ", "Flex", "Level 9"],
};

export function CoachGameplay({ coach }: { coach: Coach }) {
  const { language } = useLanguage();
  const [result, setResult] = useState("all");
  const [pick, setPick] = useState("all");
  const [expanded, setExpanded] = useState(false);
  const names = pools[coach.slug] ?? [];
  const tft = coach.game === "teamfight-tactics";
  const seed = coach.slug.split("").reduce((sum, letter) => sum + letter.charCodeAt(0), 0);
  const matches = Array.from({ length: 12 }, (_, index) => {
    const won = (index + seed) % 4 !== 0;
    return { id: `${coach.slug}-${index}`, name: names[index % names.length], won,
      role: coach.roles[index % coach.roles.length], kills: 5 + (seed + index * 3) % 14,
      deaths: 1 + index % 6, assists: 4 + (seed + index) % 15,
      minutes: coach.game === "valorant" ? 28 + index % 12 : 23 + index % 14,
      placement: won ? 1 + index % 4 : 5 + index % 4, ago: 1 + index * 3 };
  });
  const filtered = matches.filter(match => (pick === "all" || match.name === pick) && (result === "all" || match.won === (result === "wins")));
  const sources = (name: string) => coach.game === "league-of-legends" ? championIconSources(name) : [coachGameLogoPath(coach.game)];

  return <>
    <section className="coach-profile-panel">
      <div className="coach-profile-section-title"><Heart size={18} /><h2>{tft ? (translateText(language, "Preferred playstyles", "Lối chơi sở trường")) : coach.game === "valorant" ? (translateText(language, "Favorite agents", "Agent sở trường")) : (translateText(language, "Favorite champions", "Tướng sở trường"))}</h2></div>
      <p className="coach-gameplay-note">{translateText(language, "Demo data. Select a pick to filter match history.", "Dữ liệu mẫu. Chọn một mục để lọc lịch sử trận đấu.")}</p>
      <div className="coach-champion-pool">{names.map((name, index) => <button type="button" key={name} aria-pressed={pick === name} onClick={() => { setPick(pick === name ? "all" : name); setExpanded(false); }}>
        <AccountImage sources={sources(name)} alt="" width={48} height={48} fallbackLabel={name} />
        <strong>{name}</strong><span>{44 + (seed + index * 11) % 80} {translateText(language, "games", "trận")}</span><small>{58 + (seed + index * 3) % 20}% {translateText(language, "win rate", "tỉ lệ thắng")}</small>
      </button>)}</div>
    </section>
    <section className="coach-profile-panel">
      <div className="coach-profile-section-title"><Swords size={18} /><h2>{translateText(language, "Match history", "Lịch sử trận đấu")}</h2></div>
      <div className="coach-match-filters" aria-label={translateText(language, "Filter match results", "Lọc kết quả trận")}>{[["all", translateText(language, "All", "Tất cả")], ["wins", tft ? "Top 4" : translateText(language, "Wins", "Thắng")], ["losses", tft ? "Bottom 4" : translateText(language, "Losses", "Thua")]].map(([value, label]) => <button type="button" key={value} aria-pressed={result === value} onClick={() => { setResult(value); setExpanded(false); }}>{label}</button>)}{pick !== "all" && <button type="button" onClick={() => setPick("all")}>{pick} ×</button>}</div>
      <p className="coach-gameplay-note">{translateText(language, "Illustrative matches, not synced from a game account.", "Trận đấu minh họa, không đồng bộ từ tài khoản game.")}</p>
      <div className="coach-match-list">{filtered.slice(0, expanded ? 12 : 5).map(match => <article key={match.id} className="coach-match-row" data-result={match.won ? "win" : "loss"}>
        <AccountImage sources={sources(match.name)} alt="" width={40} height={40} fallbackLabel={match.name} />
        <div><strong>{match.name}</strong><small>{match.role} · {coach.server}</small></div>
        <div className="coach-match-score"><strong>{tft ? `#${match.placement}` : `${match.kills} / ${match.deaths} / ${match.assists}`}</strong><small>{tft ? (translateText(language, "Placement", "Xếp hạng")) : "KDA"}</small></div>
        <div className="coach-match-result"><strong>{tft ? (match.won ? "Top 4" : "Bottom 4") : match.won ? (translateText(language, "Victory", "Thắng")) : (translateText(language, "Defeat", "Thua"))}</strong><small>{match.minutes} {translateText(language, "min", "phút")} · {match.ago}h {translateText(language, "ago", "trước")}</small></div>
      </article>)}</div>
      {filtered.length === 0 && <p className="coach-gameplay-note">{translateText(language, "No demo matches match these filters.", "Không có trận mẫu phù hợp bộ lọc.")}</p>}
      {filtered.length > 5 && <button type="button" className="coach-match-more" onClick={() => setExpanded(!expanded)}>{expanded ? (translateText(language, "Show fewer", "Thu gọn")) : (translateText(language, "Show more matches", "Xem thêm trận"))}</button>}
    </section>
  </>;
}
