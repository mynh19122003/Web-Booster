import { ArrowUpRight, ArrowRight } from "lucide-react";
export function CTA() {
  return (
    <section className="final-cta" id="final-cta">
      <div className="container">
        <p className="eyebrow">THE NEXT CHAPTER IS YOURS</p>
        <h2>
          DON’T JUST PLAY.
          <br />
          <span className="gradient-text">ASCEND.</span>
        </h2>
        <p>Your next level is closer than you think.</p>
        <div className="hero-buttons">
          <a href="#configure" className="button">
            Start your climb <ArrowUpRight size={18} />
          </a>
          <a href="#services" className="text-link">
            Explore services <ArrowRight size={16} />
          </a>
        </div>
      </div>
    </section>
  );
}
