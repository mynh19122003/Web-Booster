"use client";

import { useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import type { Review } from "@/types/review";
import { reviews as defaultReviews } from "@/data/reviews";
import { useLanguage } from "@/components/ui/LanguageProvider";
import { reviewTextFor } from "@/data/review-copy";
import type { LanguageCode } from "@/lib/i18n";

const mockReviewGames = new Set([
  "League of Legends",
  "Teamfight Tactics",
  "Valorant",
]);

function mergeReviews(remoteReviews: Review[]) {
  const combined = [...remoteReviews, ...defaultReviews];
  const seen = new Set<string>();

  return combined.filter((review) => {
    if (!mockReviewGames.has(review.game)) return false;

    const key = `${review.name}|${review.game}|${review.text}`.toLowerCase();
    if (seen.has(key)) return false;

    seen.add(key);
    return true;
  });
}

function ReviewCard({ review, language }: { review: Review; language: LanguageCode }) {
  return (
    <article
      className="review-card min-h-[230px] w-full rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.12),0_12px_32px_rgba(0,0,0,0.5)] hover:border-[#FF9F3C]/50 hover:shadow-[0_0_20px_rgba(255,159,60,0.15)] flex flex-col justify-between select-none"
    >
      <div>
        {/* Header: Star Rating */}
        <div className="flex items-center gap-1 mb-3.5">
          <span className="text-[#FF9F3C] text-sm tracking-widest font-semibold select-none">
            ★★★★★
          </span>
        </div>

        {/* Punchy 2-Line Quote */}
        <p className="text-zinc-200 text-sm leading-relaxed font-normal line-clamp-2 min-h-[2.75rem]">
          “{reviewTextFor(language, review)}”
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
  const { language, t } = useLanguage();
  const [cards, setCards] = useState<Review[]>(mergeReviews(defaultReviews));
  const [inView, setInView] = useState(false);
  const [paused, setPaused] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const element = carouselRef.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.1 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    fetch("/api/reviews?limit=50")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && Array.isArray(data.items)) {
          setCards(mergeReviews(data.items));
        }
      })
      .catch(() => {
        // Fallback default reviews are already active
      });
  }, []);

  return (
    <section className="section reviews-section" id="reviews">
      <div className="site-container">
        <div className="section-heading" data-reveal>
          <div>
            <p className="eyebrow text-[#FF9F3C]">{t("playerReviews")}</p>
            <h2>
              {t("trustedPlayers")}
              <br />
              <span className="muted">{t("provenResults")}</span>
            </h2>
          </div>
        </div>

        <div className="trust-stats">
          <div>
            <strong className="font-heading font-extrabold tabular-nums">15,000+</strong>
            <span className="font-heading tracking-wider">{t("completedOrdersLabel")}</span>
          </div>
          <div>
            <strong className="font-heading font-extrabold tabular-nums">99.4%</strong>
            <span className="font-heading tracking-wider">{t("satisfaction")}</span>
          </div>
          <div>
            <strong className="font-heading font-extrabold tabular-nums">4.9 / 5</strong>
            <span className="font-heading tracking-wider">{t("communityRating")}</span>
          </div>
        </div>
      <div
        ref={carouselRef}
        className="reviews-marquee relative w-full overflow-hidden py-4"
        role="region"
        aria-label={t("playerComments")}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocusCapture={() => setPaused(true)}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setPaused(false);
        }}
      >
        <div className="reviews-viewport overflow-hidden" tabIndex={0} aria-label={t("playerComments")} aria-live="off">
          <div
            className="reviews-track flex"
            style={{
              animationDuration: `${Math.max(cards.length, 1) * 4}s`,
              animationPlayState:
                inView && !paused && !reduceMotion ? "running" : "paused",
            }}
          >
            {[0, 1].map((group) => (
              <div
                key={group}
                className="reviews-group"
                aria-hidden={group === 1 ? "true" : undefined}
              >
                {cards.map((review, index) => (
                  <div
                    key={`${review.name}-${review.initials}-${index}`}
                    className="review-slide"
                  >
                    <ReviewCard review={review} language={language} />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
      </div>
    </section>
  );
}
