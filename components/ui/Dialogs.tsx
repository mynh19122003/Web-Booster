"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { X, Check, ArrowUpRight } from "lucide-react";
import { useStore } from "@/store/useStore";
import { games } from "@/data/games";
import { services } from "@/data/services";
import { ranksFor } from "@/lib/service-options";
import { addRequest, useRequests } from "@/lib/local-records";
import { useMoney } from "@/components/ui/Currency";
import { estimateQuote } from "@/lib/quote";
import Link from "next/link";
export function Dialogs() {
  const s = useStore();
  const money = useMoney();
  const requests = useRequests();
  const ranks = ranksFor(s.game);
  const ref = useRef<HTMLDialogElement>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
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
  const { price } = estimateQuote(
    s.current,
    s.target,
    s.queue,
    s.service,
    s.units,
    s.game,
  );
  const close = () => {
    s.set({ modal: null });
    setSaved(false);
    setError("");
  };
  const save = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saved || money.amount(price) === null) return;
    const values = new FormData(event.currentTarget);
    const name = String(values.get("name") || "").trim();
    const email = String(values.get("email") || "").trim();
    if (name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid name and email.");
      return;
    }
    try {
      const request = addRequest({
        name,
        email,
        game: s.game,
        service: s.service,
        from: ranks[s.current],
        to: ranks[s.target],
        units: s.units,
        priceUsd: price,
        currency: money.currency,
        rate: money.usdPerEur,
        queue: s.queue,
        region: s.region,
        role: s.game === "league-of-legends" ? s.role : "Any",
        champions: s.champions,
      });
      s.set({
        order: {
          id: request.id,
          game: games.find((g) => g.slug === s.game)?.name ?? s.game,
          from: request.from,
          to: request.to,
          price,
          queue: s.queue,
          region: s.region,
          role: request.role,
          champions: s.champions,
          service: s.service,
          units: s.units,
        },
      });
      setSaved(true);
      setError("");
    } catch {
      setError(
        "Browser storage is unavailable. Your plan remains visible here.",
      );
    }
  };
  const restore = () => {
    const request = requests[0];
    if (!request) {
      setError("No saved plan yet. Create one in the configurator.");
      return;
    }
    s.set({
      order: {
        id: request.id,
        game: games.find((g) => g.slug === request.game)?.name || request.game,
        from: request.from,
        to: request.to,
        price: request.priceUsd,
        queue: request.queue,
        region: request.region,
        role: request.role,
        champions: request.champions,
        service: request.service,
        units: request.units,
      },
    });
    setError("");
  };
  return (
    <dialog
      ref={ref}
      className="dialog"
      aria-label={
        s.modal === "checkout" ? "Review your plan" : "Your saved plans"
      }
      onCancel={close}
      onClick={(e) => {
        if (e.target === ref.current) close();
      }}
    >
      <button
        className="dialog-close icon-button"
        aria-label="Close dialog"
        onClick={close}
      >
        <X />
      </button>
      {s.modal === "checkout" ? (
        <>
          <p className="eyebrow">YOUR NEXT CHAPTER</p>
          <h2>{saved ? "Request saved." : "Review your plan."}</h2>
          <p>Save your service request for review. No payment is collected.</p>
          <div className="order-recap">
            <strong>{games.find((g) => g.slug === s.game)?.name}</strong>
            <span>
              {s.service === "coaching"
                ? `${s.units} coaching hours`
                : s.service === "placements"
                  ? `${s.units} placement matches`
                  : `${ranks[s.current]} → ${ranks[s.target]}`}
            </span>
            <span>
              {s.queue} queue · {s.region} · {s.role}
            </span>
            {s.champions && <span>Preferences: {s.champions}</span>}
            <span>
              {services.find((service) => service.slug === s.service)?.name}
            </span>
            <strong>
              {money.format(price)} {money.currency} · estimated quote
            </strong>
          </div>
          {!saved && (
            <form className="request-form" onSubmit={save}>
              <label>
                Full name
                <input
                  name="name"
                  autoComplete="name"
                  minLength={2}
                  maxLength={80}
                  required
                />
              </label>
              <label>
                Email
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  maxLength={120}
                  required
                />
              </label>
              <button
                className="button"
                type="submit"
                disabled={money.amount(price) === null}
              >
                Save service request <ArrowUpRight size={17} />
              </button>
            </form>
          )}
          {saved && (
            <p role="status">
              <Check size={17} /> {s.order?.id} · Saved on this browser.
              Available in the admin workspace.
            </p>
          )}
        </>
      ) : (
        <>
          <p className="eyebrow">YOUR ASCEND SPACE</p>
          <h2>Your saved plans.</h2>
          <p>
            Load a plan saved in this browser, or sign in to your ASCEND account.
          </p>
          <div className="dialog-actions">
            <button className="button" onClick={restore}>
              Load saved plan <ArrowUpRight size={17} />
            </button>
            <Link className="button ghost" href="/login" onClick={close}>
              Sign in <ArrowUpRight size={17} />
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
                {money.format(s.order.price)} {money.currency} · estimated quote
              </span>
            </div>
          )}
        </>
      )}
      {error && <p role="alert">{error}</p>}
    </dialog>
  );
}
