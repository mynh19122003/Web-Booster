"use client";
import { ArrowUpRight, Radio, TrendingUp, Pause, Play, RotateCcw } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { RankEmblem } from "@/components/services/RankPicker";
import { rankLevelsFor } from "@/lib/service-options";

const results = [24, -14, 26, 21, 28, -12, 25, 24];
const initialDemo = { points: 0, step: 0, matches: [24, 21, -14, 26].map((lp, id) => ({ id: -id - 1, lp, minutes: 32 - id * 3 })) };

export function OrderTracking() {
  const [demo, setDemo] = useState(initialDemo);
  const [game, setGame] = useState("valorant");
  const [paused, setPaused] = useState(false);
  const reduceMotion = useReducedMotion();
  useEffect(() => {
    if (paused) return;
    if (demo.points >= 200) {
      const replay = window.setTimeout(() => setDemo(initialDemo), 2500);
      return () => window.clearTimeout(replay);
    }
    const timer = window.setInterval(() => {
      if (document.hidden) return;
      setDemo((previous) => {
        if (previous.points >= 200) return previous;
        const lp = Math.min(results[previous.step % results.length], 200 - previous.points);
        return { points: Math.max(0, previous.points + lp), step: previous.step + 1, matches: [{ id: previous.step, lp, minutes: 27 + previous.step % 7 }, ...previous.matches].slice(0, 4) };
      });
    }, 5000);
    return () => window.clearInterval(timer);
  }, [paused, demo.points]);
  const progress = Math.round(demo.points / 2);
  const rank = game === "valorant"
    ? demo.points >= 200 ? "Radiant" : demo.points >= 150 ? "Immortal 3" : demo.points >= 100 ? "Immortal 2" : demo.points >= 50 ? "Immortal 1" : "Ascendant 3"
    : demo.points >= 200 ? "Platinum IV" : demo.points >= 100 ? "Gold I" : "Gold II";
  const targetRank = game === "valorant" ? "Radiant" : "Platinum IV";
  const currentEmblem = rankLevelsFor(game).find((level) => level.label === rank)!;
  const targetEmblem = rankLevelsFor(game).find((level) => level.label === targetRank)!;
  const pointsLabel = game === "valorant" ? "RR" : "LP";
  return (
    <section className="section tracking-section">
      <div className="container split-section">
        <div data-reveal>
          <p className="eyebrow">03 / NEVER MISS A MOMENT</p>
          <h2>
            Every match.
            <br />
            Every milestone.
            <br />
            <span className="gradient-text">All in view.</span>
          </h2>
          <p>
            Your journey deserves more than a progress bar.
            <br />
            Follow the climb with match-by-match updates,
            <br />
            direct communication, and total transparency.
          </p>
          <a className="text-link" href="#configure">
            Build your game plan <ArrowUpRight size={17} />
          </a>
          <div className="tracking-points">
            <span>
              <Radio size={15} /> Match-by-match updates
            </span>
            <span>
              <TrendingUp size={15} /> Progress you can see
            </span>
          </div>
        </div>
        <div className="dashboard" data-reveal>
          <div className="dashboard-head">
            <span>
              <span className="status-dot" /> {demo.points >= 200 ? "TARGET REACHED" : "CLIMB IN PROGRESS"}
            </span>
            <span className="demo-tag">DEMO #AS-5821</span>
          </div>
          <div className="dashboard-ranks">
            <div>
              <div style={{ display: "flex", justifyContent: "center" }}><RankEmblem game={game} tier={currentEmblem.tier} src={currentEmblem.icon} /></div>
              <small>CURRENT RANK</small>
              <strong>{rank} · {demo.points % 100} {pointsLabel}</strong>
            </div>
            <div className="progress-number">
              <strong>
                {progress}<span>%</span>
              </strong>
              <small>OF THE WAY THERE</small>
            </div>
            <div>
              <div style={{ display: "flex", justifyContent: "center" }}><RankEmblem game={game} tier={targetEmblem.tier} src={targetEmblem.icon} /></div>
              <small>TARGET RANK</small>
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
            <span>RECENT MATCHES</span>
            <span>{pointsLabel} CHANGE</span>
          </div>
          {demo.matches.map(({ lp, id, minutes }) => (
            <motion.div className="match" key={id} initial={reduceMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }}>
              <span className={lp > 0 ? "win" : "loss"}>
                {lp > 0 ? "W" : "L"}
              </span>
              <strong>{lp > 0 ? "Victory" : "Defeat"}</strong>
              <small>{minutes} min · {game === "valorant" ? "Competitive" : "Ranked Solo"}</small>
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
              <small>Your pro · {game === "valorant" ? "Radiant" : "Challenger"}</small>
            </div>
            <div>
              <small>DEMO STATUS</small>
              <strong>{demo.points >= 200 ? "Completed" : paused ? "Paused" : "Playing"}</strong>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 16 }}>
            <small style={{ flex: 1, color: "#aaa" }}>Simulated matches · Starting rank {game === "valorant" ? "Ascendant III" : "Gold II"}</small>
            <button type="button" aria-label={paused ? "Play demo" : "Pause demo"} title={paused ? "Play demo" : "Pause demo"} onClick={() => setPaused(!paused)} style={{ width: 44, height: 44 }} disabled={demo.points >= 200}>{paused ? <Play size={18} /> : <Pause size={18} />}</button>
            <button type="button" aria-label="Restart demo" title="Restart demo" onClick={() => { setDemo(initialDemo); setPaused(false); }} style={{ width: 44, height: 44 }}><RotateCcw size={18} /></button>
          </div>
          <div className="tracking-game-switch" role="group" aria-label="Demo game">
            {[{ code: "league-of-legends", name: "League of Legends" }, { code: "valorant", name: "Valorant" }].map((option) => <button key={option.code} type="button" aria-pressed={game === option.code} onClick={() => { setGame(option.code); setDemo(initialDemo); setPaused(false); }}>{option.name}</button>)}
          </div>
        </div>
      </div>
    </section>
  );
}
