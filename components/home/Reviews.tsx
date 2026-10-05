"use client";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { PointerEvent } from "react";
import type { Review } from "@/types/review";

type ReviewPage = { items: Review[]; nextCursor: number | null };
type ReviewCardItem = Review & { renderKey: number };
const REVIEW_PAGE_SIZE = 4;
const MAX_RENDERED_REVIEWS = 12;

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
  const reviewsRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<ReviewCardItem[]>([]);
  const cursorRef = useRef<number | null>(0);
  const requestIdRef = useRef(0);
  const loadingRef = useRef(false);
  const dragRef = useRef<{
    pointerId: number;
    x: number;
    scrollLeft: number;
  } | null>(null);
  const [cards, setCards] = useState<ReviewCardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const fetchBatch = useCallback(async (cursor: number, replace = false) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    setLoadError(false);

    try {
      const response = await fetch(
        `/api/reviews?cursor=${cursor}&limit=${REVIEW_PAGE_SIZE}`,
      );
      if (!response.ok) throw new Error("Reviews are unavailable");
      const page = (await response.json()) as ReviewPage;
      if (
        !Array.isArray(page.items) ||
        (typeof page.nextCursor !== "number" && page.nextCursor !== null)
      ) {
        throw new Error("Invalid review response");
      }

      cursorRef.current = page.nextCursor;
      const nextBatch = page.items.map((review) => ({
        ...review,
        renderKey: ++requestIdRef.current,
      }));
      const rail = reviewsRef.current;
      const merged = replace ? nextBatch : [...cardsRef.current, ...nextBatch];
      const trimCount = Math.max(0, merged.length - MAX_RENDERED_REVIEWS);

      if (trimCount > 0 && rail) {
        const track = rail.querySelector<HTMLElement>(".reviews-track");
        const cardNodes = track?.querySelectorAll<HTMLElement>(".review-card");
        const gap = track
          ? Number.parseFloat(getComputedStyle(track).gap) || 0
          : 0;
        let removedWidth = 0;
        for (let i = 0; i < trimCount; i += 1) {
          removedWidth +=
            (cardNodes?.[i]?.getBoundingClientRect().width ?? 0) + gap;
        }
        rail.scrollLeft = Math.max(0, rail.scrollLeft - removedWidth);
      }

      const visibleBatch = trimCount > 0 ? merged.slice(trimCount) : merged;
      cardsRef.current = visibleBatch;
      setCards(visibleBatch);
    } catch {
      setLoadError(true);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchBatch(0, true);
  }, [fetchBatch]);

  useEffect(() => {
    const rail = reviewsRef.current;
    if (!rail || cards.length === 0) return;

    const maybeFetchNext = () => {
      if (loadingRef.current) return;
      const hasOverflow = rail.scrollWidth > rail.clientWidth + 2;
      if (!hasOverflow && cardsRef.current.length >= MAX_RENDERED_REVIEWS)
        return;
      const remaining = rail.scrollWidth - rail.clientWidth - rail.scrollLeft;
      const threshold = Math.max(300, rail.clientWidth * 0.3);
      if (!hasOverflow || remaining < threshold) {
        void fetchBatch(cursorRef.current ?? 0);
      }
    };

    rail.addEventListener("scroll", maybeFetchNext, { passive: true });
    const frame = requestAnimationFrame(maybeFetchNext);
    return () => {
      rail.removeEventListener("scroll", maybeFetchNext);
      cancelAnimationFrame(frame);
    };
  }, [cards.length, fetchBatch]);

  function scrollReviews(direction: -1 | 1) {
    reviewsRef.current?.scrollBy({
      left: direction * 350,
      behavior: "smooth",
    });
  }

  function startDrag(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "mouse" || event.button !== 0) return;
    dragRef.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      scrollLeft: event.currentTarget.scrollLeft,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function moveDrag(event: PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (Math.abs(event.clientX - drag.x) > 4) {
      event.currentTarget.dataset.dragging = "true";
    }
    event.currentTarget.scrollLeft = drag.scrollLeft - (event.clientX - drag.x);
  }

  function stopDrag(event: PointerEvent<HTMLDivElement>) {
    if (dragRef.current?.pointerId !== event.pointerId) return;
    dragRef.current = null;
    delete event.currentTarget.dataset.dragging;
  }

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
          <div className="reviews-heading-aside">
            <p>
              What a great experience could look like.
              <br />
              <span className="demo-tag">
                ILLUSTRATIVE REVIEWS · FICTIONAL PLAYERS
              </span>
            </p>
            <div className="reviews-controls">
              <span>SCROLL TO EXPLORE</span>
              <button
                type="button"
                aria-label="Previous comments"
                onClick={() => scrollReviews(-1)}
              >
                <ArrowLeft size={16} />
              </button>
              <button
                type="button"
                aria-label="Next comments"
                onClick={() => scrollReviews(1)}
              >
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
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
      <div
        className="reviews-marquee"
        ref={reviewsRef}
        role="region"
        aria-label="Player comments"
        tabIndex={0}
        onPointerDown={startDrag}
        onPointerMove={moveDrag}
        onPointerUp={stopDrag}
        onPointerCancel={stopDrag}
      >
        <motion.div className="reviews-track">
          {cards.map((r) => (
            <article className="review-card" key={r.renderKey}>
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
          {loading &&
            cards.length === 0 &&
            Array.from({ length: REVIEW_PAGE_SIZE }, (_, index) => (
              <div
                className="review-card review-card-skeleton"
                aria-hidden="true"
                key={`review-skeleton-${index}`}
              >
                <span />
                <span />
                <span />
              </div>
            ))}
          {loadError && cards.length === 0 && (
            <div className="review-load-error" role="alert">
              <span>Comments could not be loaded.</span>
              <button
                type="button"
                onClick={() => void fetchBatch(cursorRef.current ?? 0, true)}
              >
                Try again
              </button>
            </div>
          )}
        </motion.div>
        <span className="sr-only" aria-live="polite">
          {loading
            ? "Loading comments"
            : loadError
              ? "Could not load comments"
              : ""}
        </span>
      </div>
    </section>
  );
}
