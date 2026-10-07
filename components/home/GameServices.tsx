"use client";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowUpRight, ArrowLeft, ArrowRight, LoaderCircle } from "lucide-react";
import { games } from "@/data/games";
import { serviceSlug } from "@/lib/service-options";
import { serviceCopyFor } from "@/data/service-copy";
import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/components/ui/LanguageProvider";

type PreviewMedia = HTMLVideoElement;
type PreviewState = { wanted: boolean; pending: boolean; attempt: number; recovered: boolean };
const previews = new WeakMap<PreviewMedia, PreviewState>();
function previewState(video: PreviewMedia) {
  let state = previews.get(video);
  if (!state) { state = { wanted: false, pending: false, attempt: 0, recovered: false }; previews.set(video, state); }
  return state;
}
function stopPreview(video: PreviewMedia | null) {
  if (!video) return;
  const state = previewState(video);
  state.wanted = false;
  state.pending = false;
  state.attempt += 1;
  delete video.dataset.playing;
  video.pause();
  // Preserve buffered frames; seeking to zero on every leave interrupts pending play().
}
function playPreview(video: PreviewMedia, retryAbort = true) {
  const state = previewState(video);
  if (!state.wanted || state.pending || document.hidden || !video.isConnected) return;
  video.muted = true;
  video.defaultMuted = true;
  if (video.error) {
    if (state.recovered) return;
    state.recovered = true;
    video.load();
  }
  if (!video.paused && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
    video.dataset.playing = "true";
    return;
  }
  state.pending = true;
  const attempt = ++state.attempt;
  void video.play().then(() => {
    if (state.attempt !== attempt) return;
    state.pending = false;
    if (state.wanted && !document.hidden && video.isConnected) video.dataset.playing = "true";
    else stopPreview(video);
  }).catch((error: unknown) => {
    if (state.attempt !== attempt) return;
    state.pending = false;
    delete video.dataset.playing;
    if (retryAbort && error instanceof DOMException && error.name === "AbortError" && state.wanted) {
      playPreview(video, false);
    }
  });
}
function startPreview(card: HTMLElement) {
  const video = card.querySelector<PreviewMedia>("video.game-preview");
  if (!video) return;
  const state = previewState(video);
  if (!state.wanted) state.recovered = false;
  state.wanted = true;
  video.preload = "auto";
  playPreview(video);
}
function preparePreview(card: HTMLElement) {
  const video = card.querySelector<PreviewMedia>("video.game-preview");
  if (video) video.preload = "auto";
}
export function GameServices() {
  const { language, t } = useLanguage();
  const track = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [opening, setOpening] = useState<string | null>(null);
  useEffect(() => {
    const cards = Array.from(
      track.current?.querySelectorAll<HTMLElement>(".game-card") ?? [],
    );
    const prepareAll = () => {
      games.forEach((game) => router.prefetch("/games/" + game.slug));
      cards.forEach(preparePreview);
    };
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          prepareAll();
          observer.disconnect();
        }
      },
      { rootMargin: "300px" },
    );
    if (track.current) observer.observe(track.current);

    const stopAll = () => {
      track.current
        ?.querySelectorAll<PreviewMedia>("video.game-preview")
        .forEach(stopPreview);
    };
    const onVisibilityChange = () => {
      if (document.hidden) stopAll();
      else cards.filter((card) => card.matches(":hover, :focus-within")).forEach(startPreview);
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    const onPageShow = () => { setOpening(null); onVisibilityChange(); };
    window.addEventListener("pageshow", onPageShow);
    return () => {
      stopAll();
      observer.disconnect();
      window.removeEventListener("pageshow", onPageShow);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [router]);
  return (
    <section className="section services-section relative overflow-hidden" id="services">
      {/* Volcanic & Ember Ambient Glow for Depth */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[850px] h-[360px] bg-gradient-to-r from-[#D97706]/15 via-[#FF9F3C]/12 to-[#D97706]/15 rounded-full blur-[130px] pointer-events-none -z-10" />
      <div className="absolute top-1/2 -left-24 w-[450px] h-[450px] bg-[#D97706]/10 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="absolute bottom-10 -right-24 w-[500px] h-[450px] bg-[#FF9F3C]/10 rounded-full blur-[140px] pointer-events-none -z-10" />

      <div className="site-container">
        <div className="section-heading" data-reveal>
          <div>
            <p className="eyebrow text-[#FF9F3C]">{t("chooseGame")}</p>
            <h2>
              {t("selectArena")}
              <br />
              <span className="muted">{t("startClimbing")}</span>
            </h2>
          </div>
          <div>
            <div className="carousel-controls">
              <button
                aria-label={t("previousGames")}
                onClick={() =>
                  track.current?.scrollBy({ left: -320, behavior: "smooth" })
                }
              >
                <ArrowLeft size={17} />
              </button>
              <button
                aria-label={t("nextGames")}
                onClick={() =>
                  track.current?.scrollBy({ left: 320, behavior: "smooth" })
                }
              >
                <ArrowRight size={17} />
              </button>
              <span>{t("exploreGames")}</span>
            </div>
          </div>
        </div>
        <div className="game-track" ref={track}>
          {games.map((g, i) => (
            <article
              key={g.slug}
              className="game-card group relative border border-white/10 bg-white/[0.03] shadow-none transition-all duration-300 hover:bg-white/[0.05] hover:border-amber-500/40 hover:shadow-[0_0_25px_rgba(255,159,60,0.2)] hover:-translate-y-1 rounded-xl overflow-hidden"
              style={{ "--game-color": g.color } as React.CSSProperties}
              data-opening={opening === g.slug}
              aria-busy={opening === g.slug}
              onClick={(event) => {
                if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
                if ((event.target as Element).closest("a, button")) return;
                setOpening(g.slug);
                router.push("/games/" + g.slug + "#configure");
              }}
              onPointerEnter={(event) => {
                if (event.pointerType === "mouse")
                  { router.prefetch("/games/" + g.slug); startPreview(event.currentTarget); }
              }}
              onPointerLeave={(event) =>
                stopPreview(
                  event.currentTarget.querySelector<PreviewMedia>(
                    "video.game-preview",
                  ),
                )
              }
              onFocus={(event) => { router.prefetch("/games/" + g.slug); startPreview(event.currentTarget); }}
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
              <Link
                href={`/games/${g.slug}#configure`} prefetch={true} onNavigate={() => setOpening(g.slug)}
                title={`Explore ${g.name}`}
                aria-label={`View ${g.name} ranks and services`}
                className="game-art focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF9F3C]"
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
                  preload="metadata"
                  aria-hidden="true"
                  onLoadedData={(event) => playPreview(event.currentTarget)}
                  onCanPlay={(event) => playPreview(event.currentTarget)}
                  onPlaying={(event) => {
                    const video = event.currentTarget;
                    if (previewState(video).wanted && !document.hidden) video.dataset.playing = "true";
                    else stopPreview(video);
                  }}
                  onError={(event) => {
                    const video = event.currentTarget;
                    const state = previewState(video);
                    state.pending = false;
                    state.attempt += 1;
                    delete video.dataset.playing;
                    playPreview(video);
                  }}
                />
                <span className="game-number bg-[#0F0F10]/90 text-[#F5D7A1] border border-white/10 font-mono font-bold tracking-widest px-2.5 py-0.5 rounded shadow-sm" aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="game-category bg-[#0F0F10]/90 text-[#FF9F3C] border border-[#FF9F3C]/20 font-semibold tracking-wider uppercase px-2.5 py-0.5 rounded shadow-sm" aria-hidden="true">
                  {g.genre}
                </span>
                <span className="game-wordmark text-[#F5D7A1]/80 font-bold uppercase">{g.short}</span>
              </Link>
              <div className="game-card-info">
                <div>
                  <h3 className="text-white font-bold text-lg group-hover:text-[#F5D7A1] transition-colors">
                    <Link href={`/games/${g.slug}#configure`} prefetch={true} onNavigate={() => setOpening(g.slug)}>{g.name}</Link>
                  </h3>
                  <span className="text-xs text-[#FF9F3C] font-medium">{t("rankDuo")}</span>
                </div>
                <Link
                  href={`/games/${g.slug}#configure`}
                  prefetch={true}
                  onNavigate={() => setOpening(g.slug)}
                  aria-label={`Explore ${g.name}`}
                  className="text-zinc-400 group-hover:text-[#FF9F3C] transition-colors"
                >
                  <ArrowUpRight size={21} />
                </Link>
              </div>
              {opening === g.slug && <span className="game-opening" role="status"><LoaderCircle size={16} aria-hidden="true" />{language === "vi" ? "Đang mở…" : "Opening…"}</span>}
              <div className="service-chips">
                {g.services.slice(0, 3).map((s) => (
                  <Link
                    href={`/services/${serviceSlug(s)}?game=${g.slug}#configure`}
                    key={s}
                    className="bg-[#1F1F23]/80 hover:bg-[#FF9F3C]/20 text-zinc-200 hover:text-[#FF9F3C] border border-white/5 hover:border-[#FF9F3C]/40 text-xs font-semibold px-2.5 py-1 rounded transition-colors backdrop-blur-sm"
                  >
                    {serviceCopyFor(language, serviceSlug(s)).name}
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
