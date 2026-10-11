"use client";
import { translateText } from "@/lib/i18n";

import { NumberInput } from "@/components/ui/NumberInput";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowUpRight, Check, Clock3, GraduationCap, ShieldCheck, Star, Users, Trophy, Swords, Pencil } from "lucide-react";
import { coachGameLogoPath, coachRankCardIconPath, type Coach } from "@/data/coaches";
import { coachMockMetrics, coachOffers, coachRankHistory, coachReputation, coachPricing, coachMockFeedback } from "@/data/coach-profile";
import { rankLevelsFor } from "@/lib/service-options";
import { useLanguage } from "@/components/ui/LanguageProvider";
import { useMoney } from "@/components/ui/Currency";
import { useStore } from "@/store/useStore";
import { CoachAttributes } from "@/components/coaches/CoachAttributes";
import { CoachGameplay } from "@/components/coaches/CoachGameplay";
import { CoachTopChampions } from "@/components/coaches/CoachTopChampions";
import { DuoPackageGrid } from "@/components/coaches/DuoPackageGrid";
import { CoachingSessionFormats } from "@/components/coaches/CoachingSessionFormats";
import { subscribeCoachProfileUpdates } from "@/lib/coach-profile-events";
import type { MatchHistory } from "@/lib/riot-types";

export function CoachProfile({ coach: initialCoach, canEdit = false, initialHistory = null }: { coach: Coach; canEdit?: boolean; initialHistory?: MatchHistory | null }) {
  const [coach, setCoach] = useState(initialCoach);
  const { language, t } = useLanguage();
  const money = useMoney();
  const router = useRouter();
  const [online, setOnline] = useState(coach.online);
  useEffect(() => {
    const abort = new AbortController();
    let pending = false;
    async function refresh() {
      if (document.hidden || pending) return;
      pending = true;
      try {
        const response = await fetch(`/api/coaches/${coach.slug}`, { cache: "no-store", signal: abort.signal });
        if (response.status === 404) { router.refresh(); return; }
        if (response.ok) {
          const data = await response.json();
          if (!abort.signal.aborted) {
            setCoach(data.coach);
            setOnline(Boolean(data.coach.online));
          }
        }
      } catch {} finally { pending = false; }
    }
    void refresh();
    const timer = setInterval(refresh, 15000);
    const unsubscribe = subscribeCoachProfileUpdates(() => { void refresh(); });
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => { unsubscribe(); abort.abort(); clearInterval(timer); window.removeEventListener("focus", refresh); document.removeEventListener("visibilitychange", refresh); };
  }, [coach.slug, coach.online, router]);
  const savedBooking = useStore(state => state.coachBooking);
  const previous = savedBooking?.coachId === coach.slug ? savedBooking : null;
  const [selectedFormat, setSelectedFormat] = useState<"live" | "vod">(previous?.sessionFormat ?? coach.sessionFormats[0]);
  const sessionFormat = coach.sessionFormats.includes(selectedFormat) ? selectedFormat : coach.sessionFormats[0];
  const set = useStore((state) => state.set);
  const [mode, setMode] = useState<"duo" | "coaching">(previous?.format === "hourly" ? "coaching" : "duo");
  const [selectedOfferId, setSelectedOfferId] = useState(previous?.packageId ?? "duo-2");
  const [quantity, setQuantity] = useState(previous?.quantity ?? 3);
  const offers = useMemo(() => coachOffers(coach), [coach]);
  const selectedOffer = offers.find((offer) => offer.id === selectedOfferId) ?? offers[2];
  const metrics = useMemo(() => coachMockMetrics(coach), [coach]);
  const reputation = useMemo(() => coachReputation(coach), [coach]);
  const rankHistory = useMemo(() => coachRankHistory(coach.game, coach.slug.length), [coach.game, coach.slug]);
  const feedback = useMemo(() => coachMockFeedback(coach), [coach]);
  const unitPrice = mode === "duo" ? selectedOffer.price : coach.hourlyRate;
  const { total, subtotal, discount, discountRate } = coachPricing(unitPrice, quantity);

  function rankIndex(rank: string, target: boolean) {
    const levels = rankLevelsFor(coach.game);
    const division = coach.game === "valorant" ? (target ? "3" : "1") : (target ? "I" : "IV");
    const matching = levels.findIndex((level) => level.tier === rank && (level.division === division || level.division === ""));
    return matching < 0 ? 0 : matching;
  }

  function bookSession() {
    const packageName = mode === "duo" ? `${selectedOffer.startRank} → ${selectedOffer.targetRank} Duo` : `${quantity}h Coaching Session`;
    set({
      game: coach.game,
      product: "coaching",
      service: mode === "duo" ? "duo-boost" : "coaching",
      units: quantity,
      quoteOverride: total,
      quoteAddOns: [],
      current: rankIndex(mode === "duo" ? selectedOffer.startRank : coach.peakRank, false),
      target: rankIndex(mode === "duo" ? selectedOffer.targetRank : coach.peakRank, true),
      queue: mode === "duo" ? "Duo" : "Solo",
      checkoutDetails: {
        name: `${coach.name} · ${packageName}`,
        from: mode === "duo" ? selectedOffer.startRank : `${coach.name} (${coach.peakRank})`,
        to: mode === "duo" ? selectedOffer.targetRank : `${quantity} ${quantity === 1 ? "hour" : "hours"}`,
        quoteRequired: false,
      },
      coachBooking: {
        sessionFormat, discount,
        coachId: coach.slug,
        coachName: coach.name,
        coachSlug: coach.slug,
        packageId: mode === "duo" ? selectedOffer.id : "hourly",
        packageName,
        format: mode === "duo" ? "duo" : "hourly",
        quantity,
        unitPrice,
        total,
      },
      modal: null,
    });
    const params = new URLSearchParams({ type: "coaching", coach: coach.slug, game: coach.game, name: `${coach.name} · ${mode === "duo" ? "Duo" : "Coaching"}`, amount: String(total), mode, offer: selectedOffer.id, quantity: String(quantity), format: sessionFormat });
    router.push(`/checkout?${params}`);
  }

  return (
    <div className="coach-profile-page">
      <div className="container">
        <Link className="coach-back-link" href={"/coaches?game=" + coach.game}><ArrowLeft size={16} />{t("coachBackToList")}</Link>
        <p className="coach-demo-note">{translateText(language, "Profile details, availability, coaching statistics and reviews use demo data. Match history comes from the linked Riot account.", "Hồ sơ, lịch rảnh, thống kê coaching và đánh giá là dữ liệu mẫu. Lịch sử trận đấu lấy từ tài khoản Riot đã liên kết.")}</p>
        <section className="coach-profile-hero" style={{ "--coach-accent": coach.accent } as React.CSSProperties}>
          <div className="coach-profile-identity">
            <div className="coach-profile-avatar-wrap">
              <Image className="coach-profile-avatar" src={coach.avatar || ("/images/coaches/" + coach.slug + ".svg")} alt={coach.name} width={132} height={132} unoptimized={Boolean(coach.avatar?.startsWith("data:"))} />
              <span className={"coach-profile-online-dot " + (online ? "is-online" : "")} />
            </div>
            <div className="coach-profile-intro">
              <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                <span className="coach-verified"><ShieldCheck size={14} />{t("verifiedCoach")}</span>
                {coach.isMvp && <span className="coach-mvp-badge">{t("mvpCoach")}</span>}
              </div>
              <h1>{coach.name}</h1>
              <p className="coach-profile-game"><Image src={coachGameLogoPath(coach.game)} alt="" width={23} height={23} />{coach.gameName}<span>· {coach.server}</span></p>
              <div className="coach-profile-rank-rating">
                <div className="coach-profile-peak"><Image src={coachRankCardIconPath(coach.game, coach.peakRank)} alt="" width={48} height={48} /><span>{t("coachPeakRank")}<strong>{coach.peakRank}</strong></span></div>
                <span className="coach-profile-divider" />
                <div className="coach-profile-rating"><Star size={17} fill="currentColor" /><strong>{coach.rating.toFixed(2)}</strong><span>({coach.reviewCount} {t("coachReviews")})</span></div>
              </div>
              <div className="coach-profile-hero-attributes"><CoachAttributes coach={coach} /></div>
            </div>
          </div>
          <div className="coach-profile-hero-side">
            <div className={"coach-profile-presence " + (online ? "is-online" : "is-offline")}><i className={online ? "is-online" : ""} />{online ? t("coachOnline") : t("coachOffline")}</div>
            {canEdit && <Link className="coach-profile-edit-link" href={`/employee/coaches/${coach.slug}/edit`}><Pencil size={15} />{translateText(language, "Edit profile", "Chỉnh sửa hồ sơ")}</Link>}
            <a className="coach-profile-hero-cta" href="#coach-booking">{t("coachLearnFrom")} <ArrowUpRight size={16} /></a>
          </div>
          <div className="coach-profile-hero-copy"><strong>{t("coachBuyWithCoach")}</strong></div>
        </section>

        <div className="coach-profile-layout">
          <div className="coach-profile-main">
            <section className="coach-profile-panel coach-offers-panel">
              <div className="coach-profile-section-heading"><div><p className="eyebrow">{t("coachDuoPackages")}</p><h2>{t("coachBuyWithCoach")}</h2></div><span>{coach.gameName}</span></div>
              <div className="coach-offer-mode" role="tablist" aria-label={t("coachDuoPackages")}>
                <button type="button" role="tab" aria-selected={mode === "duo"} className={mode === "duo" ? "is-active" : ""} onClick={() => setMode("duo")}><Swords size={16} />{t("coachPlayTogether")}</button>
                <button type="button" role="tab" aria-selected={mode === "coaching"} className={mode === "coaching" ? "is-active" : ""} onClick={() => setMode("coaching")}><GraduationCap size={16} />{t("coachLearnFrom")}</button>
              </div>
              {mode === "duo" ? (
                <DuoPackageGrid game={coach.game} offers={offers} selectedOfferId={selectedOffer.id} onSelect={setSelectedOfferId} />
              ) : (
                <div className="coach-session-option">
                  <span className="coach-session-icon"><GraduationCap size={21} /></span>
                  <div><strong>{t("coachCoachingOptions")}</strong><p>{coach.bioOverride || t(coach.bioKey)}</p><div className="coach-profile-tags">{coach.sessionFormats.map((format) => <span key={format}>{format === "live" ? t("coachLiveSession") : t("coachVodReview")}</span>)}</div></div>
                  <strong className="coach-session-rate">{money.format(coach.hourlyRate)}<small> / {t("coachHourlyRate")}</small></strong>
                  <CoachingSessionFormats formats={coach.sessionFormats} value={sessionFormat} onChange={setSelectedFormat} />
                </div>
              )}
            </section>

            {coach.game === "league-of-legends" && <CoachTopChampions key={coach.slug} slug={coach.slug} />}
            <CoachGameplay key={coach.slug} coach={coach} initialHistory={initialHistory} />
            <section className="coach-profile-panel coach-profile-stats coach-profile-stats-four">
              <div><span className="coach-stat-icon"><Check size={18} /></span><strong>{metrics.completedOrders.toLocaleString()}</strong><small>{t("coachCompletedOrders")}</small></div>
              <div><span className="coach-stat-icon"><Star size={18} /></span><strong>{Math.round(reputation[0].width)}%</strong><small>{translateText(language, "Five-star reviews", "Đánh giá 5 sao")}</small></div>
              <div><span className="coach-stat-icon"><Swords size={18} /></span><strong>{metrics.gamesWon.toLocaleString()}</strong><small>{t("coachGamesWon")}</small></div>
              <div><span className="coach-stat-icon"><Clock3 size={18} /></span><strong>{metrics.since}</strong><small>{t("coachMemberSince")}</small></div>
            </section>

            <section className="coach-profile-panel coach-profile-about">
              <div className="coach-profile-section-title"><GraduationCap size={18} /><h2>{t("aboutCoach")}</h2></div>
              <p>{coach.bioOverride || t(coach.bioKey)}</p>
              <CoachAttributes coach={coach} />
            </section>

            <section className="coach-profile-panel">
              <div className="coach-profile-section-title"><Star size={18} /><h2>{t("coachReputation")}</h2></div>
              <div className="coach-reputation-layout">
                <div className="coach-reputation-score"><strong>{coach.rating.toFixed(2)}</strong><span><span>{Array.from({ length: 5 }, (_, index) => <Star key={index} size={14} fill="currentColor" />)}</span>{t("coachRatingsFromVerified")}</span></div>
                <div className="coach-reputation-bars">{reputation.map((row) => <div className="coach-reputation-row" key={row.stars}><span>{row.stars} <Star size={11} fill="currentColor" /></span><div><i style={{ width: row.width + "%" }} /></div><small>{row.count}</small></div>)}</div>
              </div>
            </section>

            <section className="coach-profile-panel">
              <div className="coach-profile-section-title"><Trophy size={18} /><div><h2>{t("coachRankHistory")}</h2><small>{t("coachCompetitiveProgress")}</small></div></div>
              <div className="coach-rank-history">{rankHistory.map((step) => <div className="coach-rank-history-item" key={step.rank}><Image src={coachRankCardIconPath(coach.game, step.rank)} alt="" width={44} height={44} /><div><strong>{step.rank}</strong><span><i style={{ width: step.winRate + "%" }} /></span><small>{step.wins}W · {step.losses}L</small></div><small>{step.winRate}%</small></div>)}</div>
            </section>

            <section className="coach-profile-panel">
              <div className="coach-profile-section-title"><Users size={18} /><div><h2>{t("coachClientFeedback")}</h2><small>{t("coachRatingsFromVerified")}</small></div></div>
              <div className="coach-feedback-grid">{feedback.map((review) => <article className="coach-feedback-card" key={review.initials}><span className="coach-feedback-stars">★★★★★</span><p>“{translateText(language,review.en,review.vi)}”</p><div><span>{review.initials}</span><div><strong>{review.name}</strong><small>{translateText(language, "Demo review", "Đánh giá mẫu")}</small></div><Check size={14} /></div></article>)}</div>
            </section>
          </div>

          <aside className="coach-booking-panel" id="coach-booking">
            <div className="coach-booking-heading"><div><p className="eyebrow">{t("coachSelectedPackage")}</p><strong>{mode === "duo" ? `${t("coachPlayTogether")} · ${selectedOffer.startRank}` : t("coachCoachingOptions")}</strong></div><span className="coach-booking-mark"><Clock3 size={20} /></span></div>
            <p className="coach-booking-description">{mode === "duo" ? `${selectedOffer.startRank} → ${selectedOffer.targetRank}` : coach.gameName + " · " + coach.roles.join(" · ")}</p>
            <strong className="coach-booking-rate">{money.format(unitPrice)} <small>/ {mode === "duo" ? t("coachNumberGames").toLowerCase() : t("coachHourlyRate")}</small></strong>
            <label className="coach-hours-control">
              <span>{mode === "duo" ? t("coachNumberGames") : t("coachNumberHours")}</span>
              <div><button type="button" aria-label={t("decreaseCoachingHours")} disabled={quantity <= 1} onClick={() => setQuantity((value) => Math.max(1, value - 1))}>−</button><NumberInput type="number" min={1} max={10} value={quantity} onChange={(event) => setQuantity(Math.max(1, Math.min(10, Number(event.target.value) || 1)))} /><button type="button" aria-label={t("increaseCoachingHours")} disabled={quantity >= 10} onClick={() => setQuantity((value) => Math.min(10, value + 1))}>+</button></div>
            </label>
            <p className="coach-session-helper">{translateText(language, "Save 5% on 3+ games/hours · 10% on 5+", "3+ trận/giờ giảm 5% · 5+ giảm 10%")}</p>
            {discount > 0 && <div className="coach-discount-summary"><span>{money.format(subtotal)}</span><strong>−{Math.round(discountRate * 100)}% · {money.format(discount)}</strong></div>}
            <div className="coach-estimate"><span>{t("coachOrderTotal")}</span><strong>{money.format(total)}</strong></div>
            <button type="button" className="button coach-book-button" onClick={bookSession}>{mode === "duo" ? t("coachBookDuo") : t("coachBookCoach")} <ArrowUpRight size={16} /></button>
          </aside>
        </div>
      </div>
    </div>
  );
}
