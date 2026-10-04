"use client";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, ArrowLeft, ArrowRight } from "lucide-react";
import { games } from "@/data/games";
import { useStore } from "@/store/useStore";
import { initialRanks, serviceSlug, servicesFor } from "@/lib/service-options";
import { useEffect, useRef } from "react";

type PreviewMedia = HTMLVideoElement | HTMLIFrameElement;

function stopPreview(media: PreviewMedia | null) {
  if (!media) return;
  delete media.dataset.playing;
  delete media.dataset.loading;
  if (media instanceof HTMLVideoElement) {
    media.pause();
    media.currentTime = 0;
  } else {
    media.src = "about:blank";
  }
}

function startPreview(card: HTMLElement) {
  const frame = card.querySelector<HTMLIFrameElement>("iframe.game-preview");
  if (frame) {
    if (frame.dataset.loading || frame.dataset.playing) return;
    const src = frame.dataset.previewSrc;
    if (!src) return;
    frame.dataset.loading = "true";
    frame.src = src;
    return;
  }

  const video = card.querySelector<HTMLVideoElement>("video.game-preview");
  if (!video || !video.paused) return;
  void video.play().then(
    () => {
      if (card.matches(":hover, :focus-within") && !document.hidden) {
        video.dataset.playing = "true";
      } else {
        stopPreview(video);
      }
    },
    () => delete video.dataset.playing,
  );
}
export function GameServices() {
  const selected = useStore((s) => s.game);
  const set = useStore((s) => s.set);
  const track = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const stopAll = () => {
        track.current
          ?.querySelectorAll<PreviewMedia>("video.game-preview, iframe.game-preview")
          .forEach(stopPreview);
    };
    const onVisibilityChange = () => {
      if (document.hidden) stopAll();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);
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
              onPointerEnter={(event) => {
                if (event.pointerType === "mouse")
                  startPreview(event.currentTarget);
              }}
              onPointerLeave={(event) =>
                stopPreview(
                  event.currentTarget.querySelector<PreviewMedia>(
                    "video.game-preview, iframe.game-preview",
                  ),
                )
              }
              onFocus={(event) => startPreview(event.currentTarget)}
              onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) {
                  stopPreview(
                    event.currentTarget.querySelector<PreviewMedia>(
                      "video.game-preview, iframe.game-preview",
                    ),
                  );
                }
              }}
            >
              <button
                title={`Select ${g.name}`}
                aria-pressed={selected === g.slug}
                className="game-art"
                onClick={() =>
                  set({
                    game: g.slug,
                    ...initialRanks(g.slug),
                    service: servicesFor(g.slug).some(
                      (option) => option.slug === useStore.getState().service,
                    )
                      ? useStore.getState().service
                      : "rank-boost",
                  })
                }
              >
                <Image
                  src={g.image}
                  alt={`${g.name} artwork`}
                  fill
                  unoptimized
                  sizes="(max-width: 600px) 85vw, (max-width: 1000px) 50vw, 33vw"
                  className="game-cover"
                />
                {g.videoEmbed ? (
                  <iframe
                    className="game-preview"
                    src="about:blank"
                    data-preview-src={g.videoEmbed}
                    title={`${g.name} cinematic preview`}
                    aria-hidden="true"
                    tabIndex={-1}
                    allow="autoplay; encrypted-media; picture-in-picture"
                    referrerPolicy="strict-origin-when-cross-origin"
                    onLoad={(event) => {
                      const frame = event.currentTarget;
                      const card = frame.closest(".game-card");
                      if (
                        frame.src !== "about:blank" &&
                        card?.matches(":hover, :focus-within") &&
                        !document.hidden
                      ) {
                        delete frame.dataset.loading;
                        frame.dataset.playing = "true";
                      }
                    }}
                  />
                ) : (
                  <video
                    className="game-preview"
                    src={g.video}
                    poster={g.image}
                    muted
                    loop
                    playsInline
                    preload="none"
                    aria-hidden="true"
                    onError={(event) => stopPreview(event.currentTarget)}
                  />
                )}
                <span className="game-number" aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="game-category" aria-hidden="true">
                  {g.genre}
                </span>
                <span className="game-wordmark">{g.short}</span>
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
                  <Link
                    href={`/services/${serviceSlug(s)}?game=${g.slug}#configure`}
                    key={s}
                  >
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
          <Link href="/services">
            Discover all services <ArrowUpRight size={15} />
          </Link>
        </div>
      </div>
    </section>
  );
}
