"use client";


import { useEffect, useState } from "react";
import type { Review } from "@/types/review";
import { reviews as defaultReviews } from "@/data/reviews";

function ReviewCard({ review }: { review: Review }) {
  return (
    <article className="flex-none w-[340px] md:w-[380px] snap-start bg-white/[0.02] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.12),0_12px_32px_rgba(0,0,0,0.5)] transition-all duration-300 hover:-translate-y-1 hover:border-[#FF9F3C]/50 hover:shadow-[0_0_20px_rgba(255,159,60,0.15)] flex flex-col justify-between select-none">
      <div>
        {/* Header: Star Rating */}
        <div className="flex items-center gap-1 mb-3.5">
          <span className="text-[#FF9F3C] text-sm tracking-widest font-semibold select-none">
            ★★★★★
          </span>
        </div>

        {/* Punchy 2-Line Quote */}
        <p className="text-zinc-200 text-sm leading-relaxed font-normal line-clamp-2 min-h-[2.75rem]">
          “{review.text}”
        </p>
      </div>

      <div>
        <div className="border-t border-white/[0.06] my-4" />

        {/* Author Info with Warm Accent Avatar */}
        <div className="flex items-center gap-3">
          <span className="bg-[#FF9F3C]/10 text-[#FF9F3C] border border-[#FF9F3C]/20 rounded-full w-9 h-9 flex items-center justify-center font-bold text-xs shrink-0">
            {review.initials}
          </span>
          <div className="min-w-0">
            <strong className="block text-white font-medium text-sm truncate">
              {review.name}
            </strong>
            <span className="block text-zinc-400 text-xs truncate mt-0.5">
              {review.game}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}

export function Reviews() {
  const [cards, setCards] = useState<Review[]>(defaultReviews);

  useEffect(() => {
    fetch("/api/reviews?limit=50")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && Array.isArray(data.items) && data.items.length > 0) {
          setCards(data.items);
        }
      })
      .catch(() => {
        // Fallback default reviews are already active
      });
  }, []);

  return (
    <section className="section reviews-section" id="reviews">
      <div className="container">
        <div className="section-heading" data-reveal>
          <div>
            <p className="eyebrow text-[#FF9F3C]">PLAYER REVIEWS</p>
            <h2>
              Trusted by players.
              <br />
              <span className="muted">Proven results.</span>
            </h2>
          </div>
        </div>

        <div className="trust-stats">
          <div>
            <strong className="font-heading font-extrabold tabular-nums">15,000+</strong>
            <span className="font-heading tracking-wider">COMPLETED ORDERS</span>
          </div>
          <div>
            <strong className="font-heading font-extrabold tabular-nums">99.4%</strong>
            <span className="font-heading tracking-wider">ORDER SATISFACTION</span>
          </div>
          <div>
            <strong className="font-heading font-extrabold tabular-nums">4.9 / 5</strong>
            <span className="font-heading tracking-wider">COMMUNITY RATING</span>
          </div>
        </div>
      </div>

      <div
        className="group relative w-full overflow-hidden py-4 [mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)] [-webkit-mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]"
        role="region"
        aria-label="Player comments"
      >
        <div className="flex w-max snap-x snap-mandatory">
          {/* Primary Track */}
          <div className="flex shrink-0 gap-6 pr-6 animate-marquee group-hover:[animation-play-state:paused] hover:[animation-play-state:paused]">
            {cards.map((review, index) => (
              <ReviewCard
                key={`primary-${review.name}-${index}`}
                review={review}
              />
            ))}
          </div>

          {/* Seamless Duplicate Track for Infinite Loop */}
          <div
            aria-hidden="true"
            className="flex shrink-0 gap-6 pr-6 animate-marquee group-hover:[animation-play-state:paused] hover:[animation-play-state:paused]"
          >
            {cards.map((review, index) => (
              <ReviewCard
                key={`duplicate-${review.name}-${index}`}
                review={review}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
