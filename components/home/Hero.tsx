import {
  ArrowUpRight,
  ArrowDown,
  ShieldCheck,
  Zap,
  Headphones,
  Star,
} from "lucide-react";
export function Hero() {
  return (
    <section className="hero" id="hero">
      <div className="hero-grid" />
      <div className="container hero-content">
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="status-dot" /> FOR THE ONES WHO AIM HIGHER
          </div>
          <h1>
            YOUR GAME.
            <br />
            YOUR <span className="gradient-text">RISE.</span>
            <br />
            OUR MISSION.
          </h1>
          <p>
            Greatness is a team effort. Reach your next rank
            <br className="desktop-break" /> with elite players who know the
            way.
          </p>
          <div className="hero-buttons">
            <a className="button magnetic" href="#configure">
              Find your next level <ArrowUpRight size={18} />
            </a>
            <a className="button ghost" href="#services">
              Explore services <ArrowDown size={16} />
            </a>
          </div>
          <div className="hero-rating">
            <div className="avatar-stack">
              <span>AK</span>
              <span>JL</span>
              <span>RM</span>
              <span>+</span>
            </div>
            <div>
              <span className="stars">★★★★★</span>
              <strong> A higher standard.</strong>
              <small>Built for a community of ambitious players</small>
            </div>
          </div>
        </div>
        <div className="artifact-label">
          <span className="tiny-cross">+</span>
          <div>
            <span>THE ASCEND ARTIFACT</span>
            <small>Forged for the next level.</small>
          </div>
          <span className="artifact-index">01 / ∞</span>
        </div>
        <div className="hero-side-label">
          PRECISION. PROGRESSION. POSSIBILITY.
        </div>
        <div className="hero-bottom">
          <span>
            <span className="status-dot" /> ALL SYSTEMS READY
          </span>
          <a href="#services">
            SCROLL TO EXPLORE <ArrowDown size={13} />
          </a>
          <span>
            EST. 2026 <Star size={10} />
          </span>
        </div>
      </div>
      <div className="benefit-bar">
        <div className="container">
          <span>
            <ShieldCheck />
            Privacy by design
          </span>
          <span>
            <Zap />
            Your pace. Your progress.
          </span>
          <span>
            <Headphones />
            Support at every step
          </span>
          <span>
            <Star />
            Elite player network
          </span>
        </div>
      </div>
    </section>
  );
}
