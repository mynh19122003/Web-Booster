"use client";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, ArrowLeft, ArrowRight } from "lucide-react";
import { games } from "@/data/games";
import { useStore } from "@/store/useStore";
import { initialRanks, serviceSlug, servicesFor } from "@/lib/service-options";
import { useEffect, useRef } from "react";

type PreviewMedia = HTMLVideoElement;

function stopPreview(media: PreviewMedia | null) {
  if (!media) return;
  delete media.dataset.playing;
  delete media.dataset.loading;
  if (media instanceof HTMLVideoElement) {
    media.pause();
    media.currentTime = 0;
  }
}

function startPreview(card: HTMLElement) {
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
          ?.querySelectorAll<PreviewMedia>("video.game-preview")
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
    <section className="section services-section relative overflow-hidden" id="services">
      {/* Volcanic & Ember Ambient Glow for Depth */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[850px] h-[360px] bg-gradient-to-r from-[#D97706]/15 via-[#FF9F3C]/12 to-[#D97706]/15 rounded-full blur-[130px] pointer-events-none -z-10" />
      <div className="absolute top-1/2 -left-24 w-[450px] h-[450px] bg-[#D97706]/10 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="absolute bottom-10 -right-24 w-[500px] h-[450px] bg-[#FF9F3C]/10 rounded-full blur-[140px] pointer-events-none -z-10" />

      <div className="container">
        <div className="section-heading" data-reveal>
          <div>
            <p className="eyebrow text-[#FF9F3C]">CHOOSE YOUR GAME</p>
            <h2>
              Select your arena.
              <br />
              <span className="muted">Start climbing today.</span>
            </h2>
          </div>
          <div>
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
              <span>EXPLORE ALL GAMES</span>
            </div>
          </div>
        </div>
        <div className="game-track" ref={track}>
          {games.map((g, i) => (
            <article
              key={g.slug}
              className="game-card group relative bg-white/[0.03] border border-white/[0.08] shadow-none transition-all duration-300 hover:bg-white/[0.05] hover:border-[#FF9F3C]/50 hover:shadow-[0_0_25px_rgba(255,159,60,0.2)] hover:-translate-y-1 rounded-xl overflow-hidden"
              style={{ "--game-color": g.color } as React.CSSProperties}
              onPointerEnter={(event) => {
                if (event.pointerType === "mouse")
                  startPreview(event.currentTarget);
              }}
              onPointerLeave={(event) =>
                stopPreview(
                  event.currentTarget.querySelector<PreviewMedia>(
                    "video.game-preview",
                  ),
                )
              }
              onFocus={(event) => startPreview(event.currentTarget)}
              onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) {
                  stopPreview(
                    event.currentTarget.querySelector<PreviewMedia>(
                      "video.game-preview",
                    ),
                  );
                }
              }}
            >
              <button
                title={`Select ${g.name}`}
                aria-pressed={selected === g.slug}
                className="game-art focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF9F3C]"
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
                <span className="game-number bg-[#0F0F10]/90 text-[#F5D7A1] border border-white/10 font-mono font-bold tracking-widest px-2.5 py-0.5 rounded shadow-sm" aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="game-category bg-[#0F0F10]/90 text-[#FF9F3C] border border-[#FF9F3C]/20 font-semibold tracking-wider uppercase px-2.5 py-0.5 rounded shadow-sm" aria-hidden="true">
                  {g.genre}
                </span>
                <span className="game-wordmark text-[#F5D7A1]/80 font-bold uppercase">{g.short}</span>
              </button>
              <div className="game-card-info">
                <div>
                  <h3 className="text-white font-bold text-lg group-hover:text-[#F5D7A1] transition-colors">{g.name}</h3>
                  <span className="text-xs text-[#FF9F3C] font-medium">Rank & Duo Boost</span>
                </div>
                <Link
                  href={`/games/${g.slug}`}
                  aria-label={`Explore ${g.name}`}
                  className="text-zinc-400 group-hover:text-[#FF9F3C] transition-colors"
                >
                  <ArrowUpRight size={21} />
                </Link>
              </div>
              <div className="service-chips">
                {g.services.slice(0, 3).map((s) => (
                  <Link
                    href={`/services/${serviceSlug(s)}?game=${g.slug}#configure`}
                    key={s}
                    className="bg-[#1F1F23]/80 hover:bg-[#FF9F3C]/20 text-zinc-200 hover:text-[#FF9F3C] border border-white/5 hover:border-[#FF9F3C]/40 text-xs font-semibold px-2.5 py-1 rounded transition-colors backdrop-blur-sm"
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
            <span className="status-dot !bg-[#FF9F3C] !shadow-[0_0_8px_#FF9F3C]" /> YOUR NEXT CHAPTER IS ONE CLICK AWAY
          </span>
          <Link href="/services" className="hover:text-[#FF9F3C] transition-colors">
            Discover all services <ArrowUpRight size={15} />
          </Link>
        </div>
      </div>
    </section>
  );
}
