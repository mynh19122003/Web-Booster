"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { X, Check, ArrowUpRight } from "lucide-react";
import { useStore } from "@/store/useStore";
import { games } from "@/data/games";
import { addRequest, useRequests } from "@/lib/local-records";
import { useMoney } from "@/components/ui/Currency";
import { estimateQuote } from "@/lib/quote";
import { rankDescription } from "@/lib/apex-ranks";
import { useLanguage } from "@/components/ui/LanguageProvider";
import { serviceCopyFor } from "@/data/service-copy";
import type { ServiceSlug } from "@/lib/service-options";
import Link from "next/link";
import { lpGainLabel, PRICING_VERSION } from "@/lib/rank-pricing";
export function Dialogs() {
  const s = useStore();
  const setState = useStore((state) => state.set);
  const money = useMoney();
  const { language, t } = useLanguage();
  const requests = useRequests();
  const router = useRouter();
  const searchParams = useSearchParams();
  const ref = useRef<HTMLDialogElement>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  useEffect(() => {
    if (s.modal) {
      ref.current?.showModal();
      document.body.style.overflow = "hidden";
    } else {
      ref.current?.close();
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [s.modal]);
  useEffect(() => {
    if (searchParams.get("checkout") === "1") setState({ modal: "checkout" });
  }, [searchParams, setState]);
  const { price, quoteRequired: estimateRequired } = estimateQuote(
    s.current,
    s.target,
    s.queue,
    s.service,
    s.units,
    s.game,
    s.currentLp,
    s.targetLp,
    s.region,
    s.lpGain,
  );
  const isCoach = Boolean(s.coachBooking);
  const isAccount = Boolean(s.accountPurchase);
  const quoteRequired = s.checkoutDetails?.quoteRequired ?? (!isCoach && !isAccount && s.quoteOverride === null && estimateRequired);
  const checkoutPrice = quoteRequired ? 0 : isCoach ? s.coachBooking!.total : isAccount ? s.accountPurchase!.price : (s.quoteOverride ?? price);
  const close = () => {
    s.set({ modal: null });
    setSaved(false);
    setError("");
    setFullName("");
    setEmail("");
  };
  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saved || (!quoteRequired && money.amount(checkoutPrice) === null)) return;
    const name = fullName.trim();
    const normalizedEmail = email.trim();
    if (name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError(t("checkoutInvalidContact"));
      return;
    }
    try {
      const response = await fetch("/api/auth/me", { cache: "no-store" });
      const { user } = await response.json();
      if (!response.ok || !user) {
        const nextUrl = typeof window !== "undefined" ? window.location.pathname + window.location.search : "/?checkout=1";
        router.push(`/login?next=${encodeURIComponent(nextUrl || "/?checkout=1")}`);
        return;
      }
    } catch {
      setError(t("checkoutAuthError"));
      return;
    }
    try {
      const request = addRequest({
        name,
        email: normalizedEmail,
        game: s.game,
        service: isAccount ? "account-purchase" : s.service,
        from: s.coachBooking
          ? (s.coachBooking.format === "duo" ? (s.checkoutDetails?.from ?? "Duo") : `${s.coachBooking.coachName} (${s.coachBooking.quantity}h)`)
          : isAccount
            ? s.accountPurchase!.server
            : (s.checkoutDetails?.from ?? rankDescription(s.game, s.current, s.currentLp)),
        to: s.coachBooking
          ? (s.coachBooking.format === "duo" ? (s.checkoutDetails?.to ?? "Duo") : "Coaching Session")
          : isAccount
            ? `${s.accountPurchase!.rank} (${s.accountPurchase!.title})`
            : (s.checkoutDetails?.to ?? rankDescription(s.game, s.target, s.targetLp)),
        categoryName: s.coachBooking ? s.coachBooking.packageName : isAccount ? "Account Purchase" : s.checkoutDetails?.name,
        quoteRequired,
        coachBooking: s.coachBooking ?? undefined,
        accountPurchase: s.accountPurchase ?? undefined,
        lpGain: s.service === "rank-boost" && (!s.product || ["divisions", "ranks"].includes(s.product)) ? s.game === "league-of-legends" ? s.lpGain : s.game === "valorant" ? "22 RR" : undefined : undefined,
        addOns: s.quoteAddOns,
        pricingVersion: PRICING_VERSION,
        units: isCoach ? s.coachBooking!.quantity : s.units,
        priceUsd: checkoutPrice,
        currency: money.currency,
        rate: money.usdPerEur,
        queue: s.queue,
        region: isAccount ? s.accountPurchase!.server : s.region,
        role: (s.game === "league-of-legends" || s.game === "valorant") ? s.role : "Any",
        champions: s.champions,
      });
      s.set({
        order: {
          id: request.id,
          game: games.find((g) => g.slug === s.game)?.name ?? s.game,
          from: request.from,
          to: request.to,
          price: checkoutPrice,
          categoryName: request.categoryName,
          quoteRequired: request.quoteRequired,
          queue: s.queue,
          region: request.region,
          role: request.role,
          champions: s.champions,
          service: request.service,
          units: request.units,
          lpGain: request.lpGain,
          addOns: request.addOns,
          pricingVersion: request.pricingVersion,
          coachBooking: s.coachBooking ?? undefined,
          accountPurchase: s.accountPurchase ?? undefined,
        },
      });
      setSaved(true);
      setError("");
    } catch {
      setError(t("checkoutStorageError"));
    }
  };
  const restore = () => {
    const request = requests[0];
    if (!request) {
      setError(t("noSavedPlan"));
      return;
    }
    s.set({
      order: {
        id: request.id,
        game: games.find((g) => g.slug === request.game)?.name || request.game,
        from: request.from,
        to: request.to,
        price: request.priceUsd,
        categoryName: request.categoryName,
        quoteRequired: request.quoteRequired,
        queue: request.queue,
        region: request.region,
        role: request.role,
        champions: request.champions,
        service: request.service,
        units: request.units,
        lpGain: request.lpGain,
        addOns: request.addOns,
        pricingVersion: request.pricingVersion,
      },
    });
    setError("");
  };
  return (
    <dialog
      ref={ref}
      className="dialog"
      aria-label={
        s.modal === "checkout" ? t("reviewPlan") : t("savedPlans")
      }
      onCancel={close}
      onClick={(e) => {
        if (e.target === ref.current) close();
      }}
    >
      <button
        className="dialog-close icon-button"
        aria-label={t("closeDialog")}
        onClick={close}
      >
        <X />
      </button>
      {s.modal === "checkout" ? (
        <>
          <p className="eyebrow">{t("nextChapter")}</p>
          <h2>{saved ? t("requestSaved") : t("reviewPlanTitle")}</h2>
          <p>{t("checkoutDescription")}</p>
          <div className="order-recap">
            <strong>{games.find((g) => g.slug === s.game)?.name}</strong>
            {s.coachBooking && (
              <span className="font-semibold text-emerald-400">
                {language === "vi" ? "Huấn luyện viên" : "Coach"}: {s.coachBooking.coachName} ({s.coachBooking.packageName})
              </span>
            )}
            {s.accountPurchase && (
              <span className="font-semibold text-amber-400">
                {language === "vi" ? "Tài khoản" : "Account"}: #{s.accountPurchase.accountId} · {s.accountPurchase.rank} ({s.accountPurchase.server})
              </span>
            )}
            <span>
              {s.checkoutDetails ? `${s.checkoutDetails.from} → ${s.checkoutDetails.to}` : s.service === "coaching"
                ? t("checkoutCoachingHours", { count: s.units })
                : s.service === "placements"
                  ? t("checkoutPlacementMatches", { count: s.units })
                  : `${rankDescription(s.game, s.current, s.currentLp)} → ${rankDescription(s.game, s.target, s.targetLp)}`}
            </span>
            <span>
              {t("queueSummary", { queue: s.queue, region: s.region, role: s.role })}
            </span>
            {s.champions && <span>{t("preferencesLabel", { value: s.champions })}</span>}
            {s.game === "league-of-legends" && s.service === "rank-boost" && (!s.product || ["divisions", "ranks"].includes(s.product)) &&
              <span>{language === "vi" ? "LP mỗi trận thắng" : "LP per win"}: {lpGainLabel(s.lpGain)}</span>}
            {s.quoteAddOns.length > 0 && <span>{language === "vi" ? "Tùy chọn" : "Options"}: {s.quoteAddOns.join(" · ")}</span>}
            <span>
              {s.checkoutDetails?.name ?? serviceCopyFor(language, s.service as ServiceSlug).name}
            </span>
            <strong>
              {quoteRequired ? (language === "vi" ? "Chờ xác nhận báo giá" : "Quote pending confirmation") : `${money.format(checkoutPrice)} · ${t("estimatedQuote")}`}
            </strong>
          </div>
          {!saved && (
            <form className="request-form" onSubmit={save}>
              <div className="request-fields">
                <div className="request-field">
                  <label htmlFor="fullName">{t("fullName")}</label>
                <input
                  id="fullName"
                  name="name"
                  type="text"
                  placeholder={t("exampleName")}
                  autoComplete="name"
                  minLength={2}
                  maxLength={80}
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  required
                />
                </div>
                <div className="request-field">
                  <label htmlFor="email">{t("emailAddress")}</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder={t("exampleEmail")}
                  autoComplete="email"
                  maxLength={120}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
                </div>
              </div>
              <button
                className="button"
                type="submit"
                disabled={!quoteRequired && money.amount(checkoutPrice) === null}
              >
                {t("saveServiceRequest")} <ArrowUpRight size={17} />
              </button>
            </form>
          )}
          {saved && (
            <p role="status">
              <Check size={17} /> {s.order?.id}
            </p>
          )}
        </>
      ) : (
        <>
          <p className="eyebrow">{t("authSpace")}</p>
          <h2>{t("savedPlansTitle")}</h2>
          <div className="dialog-actions">
            <button className="button" onClick={restore}>
              {t("loadSavedPlan")} <ArrowUpRight size={17} />
            </button>
            <Link className="button ghost" href="/login" onClick={close}>
              {t("signIn")} <ArrowUpRight size={17} />
            </Link>
          </div>
          {s.order && (
            <div className="order-recap">
              <strong>
                {s.order.id} · {s.order.game}
              </strong>
              <span>
                {s.order.from} → {s.order.to}
              </span>
              <span>
                {s.order.quoteRequired ? (language === "vi" ? "Chờ xác nhận báo giá" : "Quote pending confirmation") : `${money.format(s.order.price)} ${money.currency} · ${t("estimatedQuote")}`}
              </span>
            </div>
          )}
        </>
      )}
      {error && <p role="alert">{error}</p>}
    </dialog>
  );
}
