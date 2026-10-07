"use client";

import { NumberInput } from "@/components/ui/NumberInput";

import Link from "next/link";
import Image from "next/image";
import { useMemo, useState } from "react";
import { ArrowLeft, ArrowUpRight, Check, Clock3, GraduationCap, ShieldCheck, Star, Users, Trophy, Swords } from "lucide-react";
import { coachGameLogoPath, coachRankCardIconPath, type Coach } from "@/data/coaches";
import { coachMockMetrics, coachOffers, coachRankHistory, coachReputation } from "@/data/coach-profile";
import { reviews } from "@/data/reviews";
import { reviewTextFor } from "@/data/review-copy";
import { rankLevelsFor } from "@/lib/service-options";
import { useLanguage } from "@/components/ui/LanguageProvider";
import { useMoney } from "@/components/ui/Currency";
import { useStore } from "@/store/useStore";
import { CoachAttributes } from "@/components/coaches/CoachAttributes";

export function CoachProfile({ coach }: { coach: Coach }) {
  const { language, t } = useLanguage();
  const money = useMoney();
  const set = useStore((state) => state.set);
  const [mode, setMode] = useState<"duo" | "coaching">("duo");
  const [selectedOfferId, setSelectedOfferId] = useState("duo-2");
  const [quantity, setQuantity] = useState(3);
  const offers = useMemo(() => coachOffers(coach), [coach]);
  const selectedOffer = offers.find((offer) => offer.id === selectedOfferId) ?? offers[2];
  const metrics = useMemo(() => coachMockMetrics(coach), [coach]);
  const reputation = useMemo(() => coachReputation(coach), [coach]);
  const rankHistory = useMemo(() => coachRankHistory(coach.game), [coach.game]);
  const feedback = useMemo(() => reviews.filter((review) => review.game === coach.gameName).slice(0, 3), [coach.gameName]);
  const unitPrice = mode === "duo" ? selectedOffer.price : coach.hourlyRate;
  const total = unitPrice * quantity;

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
      modal: "checkout",
    });
  }

  return (
    <div className="coach-profile-page">
      <div className="container">
        <Link className="coach-back-link" href={"/coaches?game=" + coach.game}><ArrowLeft size={16} />{t("coachBackToList")}</Link>
        <section className="coach-profile-hero" style={{ "--coach-accent": coach.accent } as React.CSSProperties}>
          <div className="coach-profile-identity">
            <div className="coach-profile-avatar-wrap">
              <Image className="coach-profile-avatar" src={"/images/coaches/" + coach.slug + ".svg"} alt={coach.name} width={132} height={132} />
              <span className={"coach-profile-online-dot " + (coach.online ? "is-online" : "")} />
            </div>
            <div className="coach-profile-intro">
              <span className="coach-verified"><ShieldCheck size={14} />{t("verifiedCoach")}</span>
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
            <div className={"coach-profile-presence " + (coach.online ? "is-online" : "is-offline")}><i className={coach.online ? "is-online" : ""} />{coach.online ? t("coachOnline") : t("coachOffline")}</div>
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
                <div className="coach-offer-grid">
                  {offers.map((offer) => (
                    <button type="button" key={offer.id} className={"coach-offer-card " + (selectedOffer.id === offer.id ? "is-selected" : "")} onClick={() => setSelectedOfferId(offer.id)}>
                      {offer.featured && <span className="coach-offer-featured">{t("coachMostPicked")}</span>}
                      <span className="coach-offer-emblems">{offer.startRank === "Unranked" ? <Swords size={23} /> : <Image src={coachRankCardIconPath(coach.game, offer.startRank)} alt="" width={34} height={34} />}<ArrowUpRight size={14} />{offer.targetRank === "Unranked" ? <Swords size={23} /> : <Image src={coachRankCardIconPath(coach.game, offer.targetRank)} alt="" width={34} height={34} />}</span>
                      <strong>{t("coachPlayTogether")} {offer.startRank}</strong>
                      <small>{offer.startRank} → {offer.targetRank}</small>
                      <span className="coach-offer-price">{money.format(offer.price)} <small>/ {t("coachNumberGames").toLowerCase()}</small></span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="coach-session-option">
                  <span className="coach-session-icon"><GraduationCap size={21} /></span>
                  <div><strong>{t("coachCoachingOptions")}</strong><p>{t(coach.bioKey)}</p><div className="coach-profile-tags">{coach.sessionFormats.map((format) => <span key={format}>{format === "live" ? t("coachLiveSession") : t("coachVodReview")}</span>)}</div></div>
                  <strong className="coach-session-rate">{money.format(coach.hourlyRate)}<small> / {t("coachHourlyRate")}</small></strong>
                </div>
              )}
            </section>

            <section className="coach-profile-panel coach-profile-stats coach-profile-stats-four">
              <div><span className="coach-stat-icon"><Check size={18} /></span><strong>{metrics.completedOrders.toLocaleString()}</strong><small>{t("coachCompletedOrders")}</small></div>
              <div><span className="coach-stat-icon"><Star size={18} /></span><strong>{Math.round(coach.reviewCount * (coach.rating / 5)).toLocaleString()}</strong><small>{t("coachVerifiedFeedback")}</small></div>
              <div><span className="coach-stat-icon"><Swords size={18} /></span><strong>{metrics.gamesWon.toLocaleString()}</strong><small>{t("coachGamesWon")}</small></div>
              <div><span className="coach-stat-icon"><Clock3 size={18} /></span><strong>{metrics.since}</strong><small>{t("coachMemberSince")}</small></div>
            </section>

            <section className="coach-profile-panel coach-profile-about">
              <div className="coach-profile-section-title"><GraduationCap size={18} /><h2>{t("aboutCoach")}</h2></div>
              <p>{t(coach.bioKey)}</p>
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
              <div className="coach-rank-history">{rankHistory.map((step) => <div className="coach-rank-history-item" key={step.rank}><Image src={coachRankCardIconPath(coach.game, step.rank)} alt="" width={44} height={44} /><div><strong>{step.rank}</strong><span><i style={{ width: step.winRate + "%" }} /></span></div><small>{step.winRate}%</small></div>)}</div>
            </section>

            <section className="coach-profile-panel">
              <div className="coach-profile-section-title"><Users size={18} /><div><h2>{t("coachClientFeedback")}</h2><small>{t("coachRatingsFromVerified")}</small></div></div>
              <div className="coach-feedback-grid">{feedback.map((review) => <article className="coach-feedback-card" key={review.initials}><span className="coach-feedback-stars">★★★★★</span><p>“{reviewTextFor(language, review)}”</p><div><span>{review.initials}</span><div><strong>{review.name}</strong><small>{t("coachVerifiedFeedback")}</small></div><Check size={14} /></div></article>)}</div>
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
            <div className="coach-estimate"><span>{t("coachOrderTotal")}</span><strong>{money.format(total)}</strong></div>
            <button type="button" className="button coach-book-button" onClick={bookSession}>{mode === "duo" ? t("coachBookDuo") : t("coachBookCoach")} <ArrowUpRight size={16} /></button>
          </aside>
        </div>
      </div>
    </div>
  );
}
