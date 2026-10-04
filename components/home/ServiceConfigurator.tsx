"use client";
import Link from "next/link";
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

const icons = {
  "rank-boost": Trophy,
  "duo-boost": Users,
  coaching: GraduationCap,
  placements: Target,
};
const regionFlags: Record<string, string> = {
  EUW: "🇪🇺",
  EUNE: "🇪🇺",
  NA: "🇺🇸",
  OCE: "🇦🇺",
  KR: "🇰🇷",
  SEA: "🇸🇬",
};
export function ServiceConfigurator() {
  const s = useStore();
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
                <label>
                  REGION
                  <select
                    aria-label="REGION"
                    value={s.region}
                    onChange={(e) => s.set({ region: e.target.value })}
                  >
                    {["EUW", "EUNE", "NA", "OCE", "KR", "SEA"].map((r) => (
                      <option key={r} value={r}>
                        {regionFlags[r]} {r}
                      </option>
                    ))}
                  </select>
                </label>
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
            </div>
            <div className="price-summary">
              <span className="eyebrow">YOUR NEXT LEVEL</span>
              <CurrencySwitch />
              <div
                className="price converted-price"
                aria-live="polite"
                aria-atomic="true"
              >
                {money.format(price)}
                <small>{money.currency}</small>
              </div>
              <p className="rate-note">
                {money.usdPerEur
                  ? `1 EUR = ${money.usdPerEur.toFixed(4)} USD · ${money.rateDate}${money.rateState === "cached" ? " · cached rate" : ""}`
                  : money.rateState === "loading"
                    ? "Loading exchange rate..."
                    : "Exchange rate unavailable. USD prices remain available."}
              </p>
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
                onClick={() =>
                  s.set({
                    current,
                    target,
                    service: service.slug,
                    queue,
                    modal: "checkout",
                  })
                }
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
    </section>
  );
}
