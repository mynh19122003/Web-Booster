import { boosters } from "@/data/boosters";
import { ArrowUpRight, ShieldCheck } from "lucide-react";
import Link from "next/link";
export function BoosterSection() {
  return (
    <section className="section" id="pros">
      <div className="container">
        <div className="section-heading" data-reveal>
          <div>
            <p className="eyebrow">THE PEOPLE BEHIND THE PROGRESS</p>
            <h2>
              Meet your <span className="muted">unfair advantage.</span>
            </h2>
          </div>
          <p>
            Exceptional skill. A human connection.
            <br />
            <span className="demo-tag">FICTIONAL PLAYER PROFILES</span>
          </p>
        </div>
        <div className="booster-grid">
          {boosters.map((b, i) => (
            <article
              className="player-card"
              style={{ "--player-color": b.color } as React.CSSProperties}
              key={b.name}
            >
              <div className="player-art">
                <span className="player-rank">
                  <ShieldCheck size={13} />
                  {b.rank}
                </span>
                <div className={`player-silhouette player-${i}`}>
                  <div className="player-head" />
                  <div className="player-body" />
                </div>
                <span className="player-watermark">{b.name}</span>
                <span className="player-online">
                  <span className="status-dot" /> AVAILABLE · DEMO
                </span>
              </div>
              <div className="player-info">
                <h3>
                  {b.name}
                  <ShieldCheck size={18} />
                </h3>
                <p>{b.game}</p>
                <div className="player-stats">
                  <div>
                    <strong>{b.win}</strong>
                    <small>WIN RATE</small>
                  </div>
                  <div>
                    <strong>{b.orders}</strong>
                    <small>ORDERS</small>
                  </div>
                  <div>
                    <strong>{b.rating}</strong>
                    <small>RATING</small>
                  </div>
                </div>
                <Link href="/#configure" className="text-link">
                  Build a plan <ArrowUpRight size={16} />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
