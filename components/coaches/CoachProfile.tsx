"use client";
import { translateText } from "@/lib/i18n";

import { NumberInput } from "@/components/ui/NumberInput";

import Link from "next/link";
import Image from "next/image";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowUpRight, Check, Clock3, GraduationCap, ShieldCheck, Star, Users, Trophy, Swords } from "lucide-react";
import { coachGameLogoPath, coachRankCardIconPath, type Coach } from "@/data/coaches";
import { coachMockMetrics, coachOffers, coachRankHistory, coachReputation, coachPricing, coachMockFeedback } from "@/data/coach-profile";
import { rankLevelsFor } from "@/lib/service-options";
import { useLanguage } from "@/components/ui/LanguageProvider";
import { useMoney } from "@/components/ui/Currency";
import { useStore } from "@/store/useStore";
import { CoachAttributes } from "@/components/coaches/CoachAttributes";
import { CoachGameplay } from "@/components/coaches/CoachGameplay";

export function CoachProfile({ coach }: { coach: Coach }) {
  const { language, t } = useLanguage();
  const money = useMoney();
  const router = useRouter();
  const savedBooking = useStore(state => state.coachBooking);
  const previous = savedBooking?.coachId === coach.slug ? savedBooking : null;
  const [sessionFormat, setSessionFormat] = useState<"live" | "vod">(previous?.sessionFormat ?? coach.sessionFormats[0]);
  const [date, setDate] = useState(previous?.date ?? "");
  const [time, setTime] = useState(previous?.time ?? "18:00");
  const [timeZone, setTimeZone] = useState(previous?.timeZone ?? "Asia/Bangkok");
  const [goals, setGoals] = useState(previous?.goals ?? "");
  const [replayUrl, setReplayUrl] = useState(previous?.replayUrl ?? "");
  const [bookingError, setBookingError] = useState("");
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
    if (!date || date < new Date().toISOString().slice(0, 10)) { setBookingError(translateText(language, "Please choose today or a future session date.", "Vui lòng chọn ngày hiện tại hoặc tương lai cho buổi học.")); return; }
    if (replayUrl && !/^https?:\/\//i.test(replayUrl)) { setBookingError(translateText(language, "Use a replay link starting with https:// or http://.", "Link replay cần bắt đầu bằng https:// hoặc http://.")); return; }
    setBookingError("");
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
        sessionFormat, date, time, timeZone, goals, replayUrl, discount,
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
    const params = new URLSearchParams({ type: "coaching", coach: coach.slug, game: coach.game, name: `${coach.name} · ${mode === "duo" ? "Duo" : "Coaching"}`, amount: String(total), mode, offer: selectedOffer.id, quantity: String(quantity), format: sessionFormat, date, time, timezone: timeZone });
    router.push(`/checkout?${params}`);
  }

  return (
    <div className="coach-profile-page">
      <div className="container">
        <Link className="coach-back-link" href={"/coaches?game=" + coach.game}><ArrowLeft size={16} />{t("coachBackToList")}</Link>
        <p className="coach-demo-note">{translateText(language, "Profile details, availability, statistics and reviews use demo data.", "Hồ sơ, lịch rảnh, thống kê và đánh giá là dữ liệu mẫu.")}</p>
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
                      <span className="coach-offer-detail">{offer.startRank === "Unranked" ? (translateText(language, "Casual games · any rank", "Chơi thường · mọi rank")) : (translateText(language, "Ranked duo · {value0}+ lobbies", "Duo xếp hạng · lobby {value0}+", {value0: offer.startRank}))}</span>
                      <span className="coach-offer-price">{money.format(offer.price)} <small>/ {translateText(language, "game", "trận")}</small></span>
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

            <section className="coach-profile-panel coach-session-details">
              <div className="coach-profile-section-title"><Clock3 size={18} /><h2>{translateText(language, "Plan your session", "Chuẩn bị buổi học")}</h2></div>
              {mode === "coaching" && <fieldset className="coach-session-formats"><legend>{translateText(language, "Session format", "Hình thức học")}</legend>{coach.sessionFormats.map(format => <button type="button" key={format} aria-pressed={sessionFormat === format} onClick={() => setSessionFormat(format)}>{format === "live" ? (translateText(language, "Live session", "Học trực tiếp")) : (translateText(language, "VOD review", "Phân tích replay"))}</button>)}</fieldset>}
              <p className="coach-session-helper">{translateText(language, "Demo availability: choose your preferred time. This does not confirm a session.", "Lịch mẫu: chọn thời gian mong muốn. Buổi học chưa được xác nhận tự động.")}</p>
              <div className="coach-session-fields">
                <label><span>{translateText(language, "Preferred date", "Ngày mong muốn")}</span><input type="date" value={date} min={new Date().toISOString().slice(0, 10)} onChange={event => { setDate(event.target.value); setBookingError(""); }} /></label>
                <label><span>{translateText(language, "Start time", "Giờ bắt đầu")}</span><select value={time} onChange={event => setTime(event.target.value)}>{["10:00", "14:00", "18:00", "20:00"].map(slot => <option key={slot}>{slot}</option>)}</select></label>
                <label className="coach-session-wide"><span>{translateText(language, "Time zone", "Múi giờ")}</span><select value={timeZone} onChange={event => setTimeZone(event.target.value)}><option value="Asia/Bangkok">Vietnam / Bangkok (UTC+7)</option><option value="Europe/London">London</option><option value="Europe/Paris">Paris</option><option value="America/New_York">New York</option><option value="America/Los_Angeles">Los Angeles</option></select></label>
                <label className="coach-session-wide"><span>{translateText(language, "Session goals", "Mục tiêu buổi học")}</span><textarea value={goals} onChange={event => setGoals(event.target.value)} maxLength={600} placeholder={translateText(language, "e.g. Improve laning, macro decisions or champion mastery…", "Ví dụ: cải thiện đi đường, macro, chọn tướng…")} /></label>
                {mode === "coaching" && sessionFormat === "vod" && <label className="coach-session-wide"><span>{translateText(language, "Replay link (optional)", "Link replay (tùy chọn)")}</span><input type="url" value={replayUrl} onChange={event => setReplayUrl(event.target.value)} placeholder="https://…" maxLength={500} /></label>}
              </div>
              <div className="coach-session-outcomes"><h3>{translateText(language, "What you will work on", "Bạn nhận được gì?")}</h3><ul><li>{translateText(language, "Review decisions and identify priority mistakes.", "Phân tích các quyết định và lỗi cần ưu tiên.")}</li><li>{translateText(language, "Guidance tailored to your role and goals.", "Hướng dẫn theo vai trò và mục tiêu của bạn.")}</li><li>{translateText(language, "A practice plan and notes to guide your next games.", "Kế hoạch luyện tập và ghi chú sau buổi học.")}</li></ul></div>
            </section>

            <section className="coach-profile-panel coach-profile-stats coach-profile-stats-four">
              <div><span className="coach-stat-icon"><Check size={18} /></span><strong>{metrics.completedOrders.toLocaleString()}</strong><small>{t("coachCompletedOrders")}</small></div>
              <div><span className="coach-stat-icon"><Star size={18} /></span><strong>{Math.round(reputation[0].width)}%</strong><small>{translateText(language, "Five-star reviews", "Đánh giá 5 sao")}</small></div>
              <div><span className="coach-stat-icon"><Swords size={18} /></span><strong>{metrics.gamesWon.toLocaleString()}</strong><small>{t("coachGamesWon")}</small></div>
              <div><span className="coach-stat-icon"><Clock3 size={18} /></span><strong>{metrics.since}</strong><small>{t("coachMemberSince")}</small></div>
            </section>

            <CoachGameplay coach={coach} />

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
            {date && <p className="coach-session-helper">{date} · {time} · {timeZone}</p>}
            <div className="coach-estimate"><span>{t("coachOrderTotal")}</span><strong>{money.format(total)}</strong></div>
            {bookingError && <p className="coach-booking-error" role="alert">{bookingError}</p>}
            <button type="button" className="button coach-book-button" onClick={bookSession}>{mode === "duo" ? t("coachBookDuo") : t("coachBookCoach")} <ArrowUpRight size={16} /></button>
          </aside>
        </div>
      </div>
    </div>
  );
}
