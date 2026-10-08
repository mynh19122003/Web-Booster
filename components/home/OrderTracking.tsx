"use client";
import { UiText } from "@/components/ui/UiText";

import { translateText } from "@/lib/i18n";
import { ArrowUpRight, Radio, TrendingUp, Pause, Play } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { coachRankCardIconPath } from "@/data/coaches";
import { rankLevelsFor } from "@/lib/service-options";
import { useLanguage } from "@/components/ui/LanguageProvider";
import { useRequests } from "@/lib/local-records";

const results = [24, -14, 26, 21, 28, -12, 25, 24];
const initialDemo = { points: 0, step: 0, matches: [24, 21, -14, 26].map((lp, id) => ({ id: -id - 1, lp, minutes: 32 - id * 3 })) };

export function OrderTracking() {
  const { language, t } = useLanguage();
  const requests = useRequests();
  const activeRequest = requests[0];
  const [demo, setDemo] = useState(initialDemo);
  const [game, setGame] = useState("league-of-legends");
  const [paused, setPaused] = useState(false);
  const reduceMotion = useReducedMotion();
  const levels = rankLevelsFor(game);
  // Illustrative LP progression for the demo; not live server promotion cutoffs.
  const totalPoints = game === "valorant" ? 200 : game === "teamfight-tactics" ? 300 : 400;
  const complete = demo.points >= totalPoints;
  useEffect(() => {
    if (paused) return;
    if (complete) {
      const replay = window.setTimeout(() => setDemo(initialDemo), 2500);
      return () => window.clearTimeout(replay);
    }
    const timer = window.setInterval(() => {
      if (document.hidden) return;
      setDemo((previous) => {
        if (previous.points >= totalPoints) return previous;
        const lp = Math.min(results[previous.step % results.length], totalPoints - previous.points);
        return { points: Math.max(0, previous.points + lp), step: previous.step + 1, matches: [{ id: previous.step, lp, minutes: 27 + previous.step % 7 }, ...previous.matches].slice(0, 4) };
      });
    }, 5000);
    return () => window.clearInterval(timer);
  }, [demo.points, totalPoints, complete, paused]);
  const progress = complete ? 100 : Math.min(99, Math.round(demo.points / totalPoints * 100));
  const rank = game === "valorant"
    ? complete ? "Radiant" : demo.points >= 150 ? "Immortal 3" : demo.points >= 100 ? "Immortal 2" : demo.points >= 50 ? "Immortal 1" : "Ascendant 3"
    : complete ? "Challenger" : "Grandmaster";
  const targetRank = game === "valorant" ? "Radiant" : "Challenger";
  const currentEmblem = levels.find((level) => level.label === rank)!;
  const targetEmblem = levels.find((level) => level.label === targetRank)!;
  const trackingIcon = (level: typeof currentEmblem) => game === "valorant"
    ? "/images/ranks/cards/valorant/" + level.tier.toLowerCase() + (level.division ? "-" + level.division : "") + ".webp"
    : coachRankCardIconPath(game, level.tier);
  const pointsLabel = game === "valorant" ? "RR" : "LP";
  const peakRank = game === "valorant" ? "Radiant" : "Challenger";
  return (
    <section className="section tracking-section">
      <div className="site-container split-section">
        <div data-reveal>
          <p className="eyebrow">{t("trackingEyebrow")}</p>
          <h2>
            {t("everyMatch")}
            <br />
            {t("everyMilestone")}
            <br />
            <span className="gradient-text">{t("allInView")}</span>
          </h2>
          <p>
            {t("trackingDescription")}
            <br />
            {t("trackingDescriptionTwo")}
            <br />
            {t("trackingDescriptionThree")}
          </p>
          <Link className="text-link" href="/#services">
            {t("buildPlan")} <ArrowUpRight size={17} />
          </Link>
          <div className="tracking-points">
            <span>
              <Radio size={15} /> {t("matchUpdates")}
            </span>
            <span>
              <TrendingUp size={15} /> {t("visibleProgress")}
            </span>
          </div>
        </div>
        <div className="dashboard" data-reveal>
          <div className="dashboard-head">
            <span>
              <span className="status-dot" /> {activeRequest ? (translateText(language, "Order: {value0}", "Đơn hàng: {value0}", {value0: activeRequest.status})) : (complete ? t("orderComplete") : t("orderLive"))}
            </span>
            <span className="demo-head-actions"><span className="demo-tag">{activeRequest ? `#${activeRequest.id}` : t("orderNumber", { id: "AS-5821" })}</span><button type="button" className="tracking-demo-toggle" onClick={() => setPaused((value) => !value)} aria-label={paused ? (translateText(language, "Resume demo", "Tiếp tục mô phỏng")) : (translateText(language, "Pause demo", "Tạm dừng mô phỏng"))} aria-pressed={paused}>{paused ? <Play size={14} /> : <Pause size={14} />}{paused ? (translateText(language, "Resume", "Tiếp tục")) : (translateText(language, "Pause", "Tạm dừng"))}</button></span>
          </div>
          {activeRequest && (
            <div className="p-3 my-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-zinc-300 flex items-center justify-between">
              <div>
                <strong className="text-amber-400 block">{activeRequest.categoryName ?? activeRequest.service}: {activeRequest.from} → {activeRequest.to}</strong>
                <span>{activeRequest.name} ({activeRequest.email}) · ${activeRequest.priceUsd} {activeRequest.currency}</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold">{activeRequest.status}</span>
            </div>
          )}
          <div className="dashboard-ranks">
            <div>
              <div style={{ display: "flex", justifyContent: "center" }}><Image className="tracking-rank-image" src={trackingIcon(currentEmblem)} width={96} height={96} alt="" /></div>
              <small>{t("currentRank")}</small>
              <strong>{rank} · {game === "valorant" ? demo.points % 100 : (game === "teamfight-tactics" ? 200 : 400) + demo.points} {pointsLabel}</strong>
            </div>
            <div className="progress-number">
              <strong>
                {progress}<span>%</span>
              </strong>
              <small>{t("wayThere")}</small>
            </div>
            <div>
              <div style={{ display: "flex", justifyContent: "center" }}><Image className="tracking-rank-image" src={trackingIcon(targetEmblem)} width={96} height={96} alt="" /></div>
              <small>{t("targetRank")}</small>
              <strong>{targetRank}</strong>
            </div>
          </div>
          <div className="progress-track">
            <motion.div
            initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: reduceMotion ? 0 : 0.7 }}
            />
          </div>
          <div className="match-title">
            <span>{t("recentMatches")}</span>
            <span>{pointsLabel} {t("pointsChange")}</span>
          </div>
          {demo.matches.map(({ lp, id, minutes }) => (
            <motion.div className="match" key={id} initial={reduceMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }}>
              <span className={lp > 0 ? "win" : "loss"}>
                {game === "teamfight-tactics" ? "#" + (lp > 0 ? 1 + Math.abs(id) % 4 : 5 + Math.abs(id) % 4) : lp > 0 ? "W" : "L"}
              </span>
              <strong>{game === "teamfight-tactics" ? (translateText(language, "Place ", "Hạng ")) + (lp > 0 ? 1 + Math.abs(id) % 4 : 5 + Math.abs(id) % 4) : lp > 0 ? t("victory") : t("defeat")}</strong>
              <small>{minutes}<UiText english={"min ·"} />{game === "valorant" ? t("competitiveQueue") : game === "teamfight-tactics" ? (translateText(language, "Ranked TFT", "Xếp hạng TFT")) : t("rankedSoloQueue")}</small>
              <span className={lp > 0 ? "green" : "muted"}>
                {lp > 0 ? "+" : ""}
                {lp} {pointsLabel}
              </span>
            </motion.div>
          ))}
          <div className="booster-status">
            <div className="small-avatar">N</div>
            <div>
              <strong>
                NOVA <span className="status-dot" />
              </strong>
              <small className="tracking-pro-peak">{t("assignedPro")} · <Image className="tracking-pro-rank-image" src={coachRankCardIconPath(game, peakRank)} width={28} height={28} alt="" />{peakRank}</small>
            </div>
            <div>
              <small>{t("status")}</small>
              <strong>{complete ? t("completed") : t("inMatch")}</strong>
            </div>
          </div>
          <div className="tracking-game-switch" role="group" aria-label={t("trackingGame")}>
            {[{ code: "league-of-legends", name: "League of Legends" }, { code: "valorant", name: "Valorant" }, { code: "teamfight-tactics", name: "TFT" }].map((option) => <button key={option.code} type="button" aria-pressed={game === option.code} onClick={() => { if (game === option.code) return; setGame(option.code); setDemo(initialDemo); }}>{option.name}</button>)}
          </div>
        </div>
      </div>
    </section>
  );
}
