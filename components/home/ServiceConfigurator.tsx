"use client";
import { ArrowRight, ArrowUpRight, ShieldCheck, Gem } from "lucide-react";
import { useStore } from "@/store/useStore";
import { ranks } from "@/data/services";
import { games } from "@/data/games";
import { estimateQuote } from "@/lib/quote";
export function ServiceConfigurator() {
  const s = useStore();
  const { price, minHours, maxHours } = estimateQuote(
    s.current,
    s.target,
    s.queue,
  );
  return (
    <section className="section" id="configure">
      <div className="container">
        <div className="section-heading" data-reveal>
          <div>
            <p className="eyebrow">02 / MAKE YOUR MOVE</p>
            <h2>
              A plan for <span className="muted">your climb.</span>
            </h2>
          </div>
          <p>
            No guesswork. No hidden extras.
            <br />
            Just a clear path to your next milestone.
          </p>
        </div>
        <div className="config-panel">
          <div className="config-top">
            <span>
              <span className="status-dot" /> RANK CONFIGURATOR
            </span>
            <label className="sr-only" htmlFor="game">
              Game
            </label>
            <select
              id="game"
              value={s.game}
              onChange={(e) => s.set({ game: e.target.value })}
            >
              {games.map((g) => (
                <option key={g.slug} value={g.slug}>
                  {g.name}
                </option>
              ))}
            </select>
            <span className="demo-tag">DEMO ESTIMATE</span>
          </div>
          <div className="config-body">
            <div className="rank-controls">
              <div className="rank-pair">
                <div>
                  <label htmlFor="current-rank">CURRENT RANK</label>
                  <div className="rank-name">
                    <Gem className="gold" />
                    {ranks[s.current]}
                  </div>
                  <input
                    id="current-rank"
                    type="range"
                    min="0"
                    max="6"
                    value={s.current}
                    aria-valuetext={ranks[s.current]}
                    onChange={(e) =>
                      s.set({
                        current: +e.target.value,
                        target: Math.max(s.target, +e.target.value + 1),
                      })
                    }
                  />
                  <span className="range-hint">
                    Iron <span>Diamond</span>
                  </span>
                </div>
                <ArrowRight className="rank-arrow" />
                <div>
                  <label htmlFor="target-rank">DESIRED RANK</label>
                  <div className="rank-name">
                    <Gem className="diamond" />
                    {ranks[s.target]}
                  </div>
                  <input
                    id="target-rank"
                    type="range"
                    min={s.current + 1}
                    max="7"
                    value={s.target}
                    aria-valuetext={ranks[s.target]}
                    onChange={(e) => s.set({ target: +e.target.value })}
                  />
                  <span className="range-hint">
                    {ranks[s.current + 1]} <span>Master</span>
                  </span>
                </div>
              </div>
              <div className="config-options">
                <fieldset>
                  <legend>QUEUE TYPE</legend>
                  <div className="segmented">
                    {["Solo", "Duo"].map((q) => (
                      <button
                        aria-pressed={s.queue === q}
                        key={q}
                        onClick={() => s.set({ queue: q })}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </fieldset>
                <label>
                  REGION
                  <select
                    aria-label="REGION"
                    value={s.region}
                    onChange={(e) => s.set({ region: e.target.value })}
                  >
                    {["EUW", "EUNE", "NA", "OCE", "KR", "SEA"].map((r) => (
                      <option key={r}>{r}</option>
                    ))}
                  </select>
                </label>
                <label>
                  ROLE
                  <select
                    aria-label="ROLE"
                    value={s.role}
                    onChange={(e) => s.set({ role: e.target.value })}
                  >
                    {["Mid", "Top", "Jungle", "ADC", "Support", "Any"].map(
                      (r) => (
                        <option key={r}>{r}</option>
                      ),
                    )}
                  </select>
                </label>
              </div>
              <label className="champion-label">
                PREFERRED CHAMPIONS <span>OPTIONAL</span>
                <input
                  value={s.champions}
                  onChange={(e) => s.set({ champions: e.target.value })}
                  placeholder="Tell us who you love to play"
                  maxLength={120}
                />
              </label>
            </div>
            <div className="price-summary">
              <span className="eyebrow">YOUR NEXT LEVEL</span>
              <div className="price" aria-live="polite" aria-atomic="true">
                <span>$</span>
                {price.toFixed(2)}
                <small>USD</small>
              </div>
              <div className="summary-row">
                <span>Estimated delivery</span>
                <strong>
                  {minHours}–{maxHours} hours
                </strong>
              </div>
              <div className="summary-row">
                <span>Personalized experience</span>
                <strong>Included</strong>
              </div>
              <button
                className="button"
                onClick={() => s.set({ modal: "checkout" })}
              >
                Review your plan <ArrowUpRight size={17} />
              </button>
              <small>
                <ShieldCheck size={13} /> Free to explore. No payment required.
              </small>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
