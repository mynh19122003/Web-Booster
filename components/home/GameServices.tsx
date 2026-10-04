"use client";
import Link from "next/link";
import {
  ArrowUpRight,
  ArrowLeft,
  ArrowRight,
  Crosshair,
  Swords,
} from "lucide-react";
import { games } from "@/data/games";
import { useStore } from "@/store/useStore";
import { useRef } from "react";
export function GameServices() {
  const selected = useStore((s) => s.game);
  const set = useStore((s) => s.set);
  const track = useRef<HTMLDivElement>(null);
  return (
    <section className="section services-section" id="services">
      <div className="container">
        <div className="section-heading" data-reveal>
          <div>
            <p className="eyebrow">01 / CHOOSE YOUR ARENA</p>
            <h2>
              Different games.
              <br />
              <span className="muted">Same ambition.</span>
            </h2>
          </div>
          <div>
            <p>
              Your next milestone starts here.
              <br />
              Expert services for the games you live for.
            </p>
            <div className="carousel-controls">
              <button
                aria-label="Previous games"
                onClick={() =>
                  track.current?.scrollBy({ left: -320, behavior: "smooth" })
                }
              >
                <ArrowLeft size={17} />
              </button>
              <button
                aria-label="Next games"
                onClick={() =>
                  track.current?.scrollBy({ left: 320, behavior: "smooth" })
                }
              >
                <ArrowRight size={17} />
              </button>
              <span>EXPLORE THE LINEUP</span>
            </div>
          </div>
        </div>
        <div className="game-track" ref={track}>
          {games.map((g, i) => (
            <article
              key={g.slug}
              className={`game-card ${selected === g.slug ? "selected" : ""}`}
              style={{ "--game-color": g.color } as React.CSSProperties}
            >
              <button
                title={`Select ${g.name}`}
                aria-pressed={selected === g.slug}
                className="game-art"
                onClick={() => set({ game: g.slug })}
              >
                <span className="game-number" aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="game-category" aria-hidden="true">
                  {g.genre}
                </span>
                <div
                  className={`original-emblem emblem-${i % 3}`}
                  aria-hidden="true"
                >
                  <span />
                  {i % 2 ? <Crosshair /> : <Swords />}
                  <i />
                </div>
                <span className="game-wordmark">{g.short}</span>
                <span className="art-caption" aria-hidden="true">
                  ORIGINAL CONCEPT ART
                </span>
              </button>
              <div className="game-card-info">
                <div>
                  <h3>{g.name}</h3>
                  <span>{g.services.length} ways to level up</span>
                </div>
                <Link
                  href={`/games/${g.slug}`}
                  aria-label={`Explore ${g.name}`}
                >
                  <ArrowUpRight size={21} />
                </Link>
              </div>
              <div className="service-chips">
                {g.services.slice(0, 3).map((s) => (
                  <Link href={`/games/${g.slug}#configure`} key={s}>
                    {s}
                  </Link>
                ))}
              </div>
            </article>
          ))}
        </div>
        <div className="service-foot">
          <span>
            <span className="status-dot" /> YOUR NEXT CHAPTER IS ONE CLICK AWAY
          </span>
          <Link href="/games/league-of-legends">
            Discover all services <ArrowUpRight size={15} />
          </Link>
        </div>
      </div>
    </section>
  );
}
