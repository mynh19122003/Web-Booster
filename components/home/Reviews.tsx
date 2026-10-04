"use client";
import { reviews } from "@/data/reviews";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
function Counter({ value }: { value: number }) {
  const [n, setN] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();
  useEffect(() => {
    if (reduced) {
      const frame = requestAnimationFrame(() => setN(value));
      return () => cancelAnimationFrame(frame);
    }
    let frame = 0;
    const obs = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      let start: number;
      const tick = (time: number) => {
        start ??= time;
        const p = Math.min((time - start) / 1000, 1);
        setN(Math.round(value * p));
        if (p < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
      obs.disconnect();
    });
    if (ref.current) obs.observe(ref.current);
    return () => {
      obs.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [value, reduced]);
  return <span ref={ref}>{n}</span>;
}
export function Reviews() {
  return (
    <section className="section reviews-section" id="reviews">
      <div className="container">
        <div className="section-heading" data-reveal>
          <div>
            <p className="eyebrow">BUILT AROUND THE PLAYER</p>
            <h2>
              Good games.
              <br />
              <span className="muted">Better experiences.</span>
            </h2>
          </div>
          <p>
            What a great experience could look like.
            <br />
            <span className="demo-tag">
              ILLUSTRATIVE REVIEWS · FICTIONAL PLAYERS
            </span>
          </p>
        </div>
        <div className="trust-stats">
          <div>
            <strong>
              <Counter value={10} />+
            </strong>
            <span>GAMES. ONE DESTINATION.</span>
          </div>
          <div>
            <strong>
              <Counter value={4} />
            </strong>
            <span>WAYS TO MAKE YOUR NEXT MOVE</span>
          </div>
          <div>
            <strong>100%</strong>
            <span>FOCUSED ON YOUR JOURNEY</span>
          </div>
        </div>
      </div>
      <div className="reviews-marquee">
        <motion.div className="reviews-track">
          {[...reviews, ...reviews].map((r, i) => (
            <article
              className="review-card"
              key={i}
              aria-hidden={i >= reviews.length ? true : undefined}
            >
              <div className="review-top">
                <span className="stars">★★★★★</span>
                <span>Sample story</span>
              </div>
              <p>“{r.text}”</p>
              <div className="review-author">
                <span className="small-avatar">{r.initials}</span>
                <div>
                  <strong>{r.name}</strong>
                  <small>{r.game}</small>
                </div>
              </div>
            </article>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
