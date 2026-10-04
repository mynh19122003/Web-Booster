"use client";
import { ArrowUpRight, Radio, TrendingUp } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
export function OrderTracking() {
  const reduced = useReducedMotion();
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
              <span className="status-dot" /> CLIMB IN PROGRESS
            </span>
            <span className="demo-tag">DEMO #AS-5821</span>
          </div>
          <div className="dashboard-ranks">
            <div>
              <span className="rank-glyph gold">◇</span>
              <small>STARTING RANK</small>
              <strong>Gold II</strong>
            </div>
            <div className="progress-number">
              <strong>
                68<span>%</span>
              </strong>
              <small>OF THE WAY THERE</small>
            </div>
            <div>
              <span className="rank-glyph diamond">◈</span>
              <small>TARGET RANK</small>
              <strong>Platinum IV</strong>
            </div>
          </div>
          <div className="progress-track">
            <motion.div
              initial={{ width: reduced ? "68%" : 0 }}
              whileInView={{ width: "68%" }}
              viewport={{ once: true }}
              transition={{ duration: 1.4 }}
            />
          </div>
          <div className="match-title">
            <span>RECENT MATCHES</span>
            <span>LP CHANGE</span>
          </div>
          {[24, 21, -14, 26].map((lp, i) => (
            <div className="match" key={i}>
              <span className={lp > 0 ? "win" : "loss"}>
                {lp > 0 ? "W" : "L"}
              </span>
              <strong>{lp > 0 ? "Victory" : "Defeat"}</strong>
              <small>{32 - i * 3} min · Ranked Solo</small>
              <span className={lp > 0 ? "green" : "muted"}>
                {lp > 0 ? "+" : ""}
                {lp} LP
              </span>
            </div>
          ))}
          <div className="booster-status">
            <div className="small-avatar">N</div>
            <div>
              <strong>
                NOVA <span className="status-dot" />
              </strong>
              <small>Your pro · Challenger</small>
            </div>
            <div>
              <small>EST. COMPLETION</small>
              <strong>3h 42m</strong>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
