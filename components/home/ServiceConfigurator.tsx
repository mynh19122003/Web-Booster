"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  ShieldCheck,
  GraduationCap,
  Users,
  Trophy,
  Target,
} from "lucide-react";
import { useStore } from "@/store/useStore";
import { games } from "@/data/games";
import { initialRanks, ranksFor, servicesFor } from "@/lib/service-options";
import { RankPicker } from "@/components/services/RankPicker";
import { estimateQuote } from "@/lib/quote";
import { CurrencySwitch, useMoney } from "@/components/ui/Currency";
import { RegionSelector } from "@/components/ui/RegionSelector";
import { regions } from "@/data/regions";

const icons = {
  "rank-boost": Trophy,
  "duo-boost": Users,
  coaching: GraduationCap,
  placements: Target,
};
export function ServiceConfigurator() {
  const s = useStore();
  const sectionRef = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting));
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);
  const money = useMoney();
  const ranks = ranksFor(s.game);
  const choices = servicesFor(s.game);
  const service =
    choices.find((option) => option.slug === s.service) ?? choices[0];
  const current = Math.min(s.current, ranks.length - 2);
  const target = Math.min(Math.max(s.target, current + 1), ranks.length - 1);
  const queue = service.slug === "duo-boost" ? "Duo" : "Solo";
  const { price, minHours, maxHours } = estimateQuote(
    current,
    target,
    queue,
    service.slug,
    s.units,
    s.game,
  );
  const unitService =
    service.slug === "coaching" || service.slug === "placements";
  function reviewPlan() {
    s.set({ current, target, service: service.slug, queue, modal: "checkout" });
  }
  return (
    <section ref={sectionRef} className="section compact-config" id="configure">
      <div className="container">
        <div className="section-heading" data-reveal>
          <div>
            <p className="eyebrow">02 / MAKE YOUR MOVE</p>
            <h2>
              A plan for <span className="muted">your climb.</span>
            </h2>
          </div>
          <Link href="/services" className="text-link">
            All services <ArrowUpRight size={17} />
          </Link>
        </div>
        <div className="config-panel">
          <div className="config-top">
            <span>
              <span className="status-dot" /> BUILD YOUR PLAN
            </span>
            <label className="sr-only" htmlFor="game">
              Game
            </label>
            <select
              id="game"
              value={s.game}
              onChange={(e) => {
                const game = e.target.value;
                const nextService = servicesFor(game).some(
                  (option) => option.slug === s.service,
                )
                  ? s.service
                  : "rank-boost";
                s.set({
                  game,
                  service: nextService,
                  ...initialRanks(game),
                  queue: nextService === "duo-boost" ? "Duo" : "Solo",
                });
              }}
            >
              {games.map((g) => (
                <option key={g.slug} value={g.slug}>
                  {g.name}
                </option>
              ))}
            </select>
            <span className="demo-tag">ESTIMATED QUOTE</span>
          </div>
          <div
            className="service-picker"
            role="group"
            aria-label="Choose service"
          >
            {choices.map((option) => {
              const Icon = icons[option.slug as keyof typeof icons];
              return (
                <button
                  key={option.slug}
                  aria-pressed={service.slug === option.slug}
                  onClick={() =>
                    s.set({
                      service: option.slug,
                      queue: option.slug === "duo-boost" ? "Duo" : "Solo",
                    })
                  }
                >
                  <Icon size={19} />
                  <span>{option.name}</span>
                </button>
              );
            })}
          </div>
          <div className="config-body">
            <div className="rank-controls">
              <p className="service-description">{service.description}</p>
              {unitService ? (
                <div className="unit-controls">
                  <label htmlFor="service-units">
                    {service.slug === "coaching"
                      ? "Coaching hours"
                      : "Placement matches"}
                  </label>
                  <input
                    id="service-units"
                    type="number"
                    min={1}
                    max={10}
                    value={s.units}
                    onChange={(e) =>
                      s.set({
                        units: Math.max(
                          1,
                          Math.min(10, Number(e.target.value) || 1),
                        ),
                      })
                    }
                  />
                  <p>
                    {service.slug === "coaching"
                      ? "One-to-one sessions with replay review and a focused practice plan."
                      : "Choose how many placement matches to include in your plan."}
                  </p>
                </div>
              ) : (
                <div className="rank-pair">
                  <RankPicker
                    game={s.game}
                    label="Current rank"
                    value={current}
                    max={ranks.length - 2}
                    onChange={(value) =>
                      s.set({
                        current: value,
                        target: Math.max(target, value + 1),
                      })
                    }
                  />
                  <ArrowRight className="rank-arrow" />
                  <RankPicker
                    game={s.game}
                    label="Desired rank"
                    value={target}
                    min={current + 1}
                    max={ranks.length - 1}
                    onChange={(value) => s.set({ target: value })}
                  />
                </div>
              )}
              <div className="config-options">
                <RegionSelector options={regions} value={s.region} onChange={(region) => s.set({ region })} />
                {s.game === "league-of-legends" && (
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
                )}
                <div className="queue-summary">
                  <span>QUEUE</span>
                  <strong>{queue}</strong>
                </div>
              </div>
              <details className="optional-preferences">
              <summary>Optional preferences{s.champions ? " · Added" : ""}</summary>
              <label className="champion-label">
                {s.game === "valorant"
                  ? "PREFERRED AGENTS"
                  : s.game === "teamfight-tactics"
                    ? "PREFERRED COMPOSITIONS"
                    : "PREFERRED CHAMPIONS"}{" "}
                <span>OPTIONAL</span>
                <input
                  value={s.champions}
                  onChange={(e) => s.set({ champions: e.target.value })}
                  placeholder="Your preferences"
                  maxLength={120}
                />
              </label>
              </details>
            </div>
            <div className="price-summary">
              <span className="eyebrow">YOUR NEXT LEVEL</span>
              <CurrencySwitch />
              <p className="plan-selection">{games.find((game) => game.slug === s.game)?.name}<br />{unitService ? `${s.units} ${service.slug === "coaching" ? "hours" : "matches"}` : `${ranks[current]} → ${ranks[target]}`}<br />{s.region} · {queue}{s.game === "league-of-legends" ? ` · ${s.role}` : ""}</p>
              <div
                className="price converted-price"
                aria-live="polite"
                aria-atomic="true"
              >
                {money.format(price)}
                <small>{money.currency}</small>
              </div>
              <div className="summary-row">
                <span>Estimated delivery</span>
                <strong>
                  {minHours}–{maxHours} hours
                </strong>
              </div>
              <div className="summary-row">
                <span>Selected service</span>
                <strong>{service.name}</strong>
              </div>
              <button
                className="button"
                disabled={money.amount(price) === null}
                onClick={reviewPlan}
              >
                Review your plan <ArrowUpRight size={17} />
              </button>
              <small>
                <ShieldCheck size={13} /> Final quote confirmed before payment.
              </small>
            </div>
          </div>
        </div>
      </div>
      {inView && !s.modal && <div className="mobile-plan-bar">
        <div><strong>{money.format(price)}</strong><span>{s.region} · {unitService ? service.name : `${ranks[current]} → ${ranks[target]}`}</span></div>
        <button className="button" disabled={money.amount(price) === null} onClick={reviewPlan}>Review plan <ArrowUpRight size={16} /></button>
      </div>}
    </section>
  );
}
