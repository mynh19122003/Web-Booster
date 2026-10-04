"use client";
import { useEffect, useRef, useState } from "react";
import { X, Check, ArrowUpRight } from "lucide-react";
import { useStore } from "@/store/useStore";
import { games } from "@/data/games";
import { ranks } from "@/data/services";
import { estimateQuote } from "@/lib/quote";
export function Dialogs() {
  const s = useStore();
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
  const { price } = estimateQuote(s.current, s.target, s.queue);
  const close = () => {
    s.set({ modal: null });
    setSaved(false);
    setError("");
  };
  const save = () => {
    const order = {
      id: `AS-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
      game: games.find((g) => g.slug === s.game)?.name ?? s.game,
      from: ranks[s.current],
      to: ranks[s.target],
      price,
      queue: s.queue,
      region: s.region,
      role: s.role,
      champions: s.champions,
    };
    try {
      localStorage.setItem("ascend-demo-order", JSON.stringify(order));
      s.set({ order });
      setSaved(true);
      setError("");
    } catch {
      setError(
        "Browser storage is unavailable. Your plan remains visible here.",
      );
    }
  };
  const restore = () => {
    try {
      const raw = localStorage.getItem("ascend-demo-order");
      if (!raw) {
        setError("No saved plan yet. Create one in the configurator.");
        return;
      }
      const order: unknown = JSON.parse(raw);
      if (
        typeof order === "object" &&
        order !== null &&
        "id" in order &&
        "price" in order &&
        typeof order.id === "string" &&
        typeof order.price === "number" &&
        "game" in order &&
        typeof order.game === "string" &&
        "from" in order &&
        typeof order.from === "string" &&
        "to" in order &&
        typeof order.to === "string"
      ) {
        s.set({ order: order as NonNullable<typeof s.order> });
        setError("");
      } else setError("Saved plan is invalid. Please create a new plan.");
    } catch {
      setError("Unable to read this browser’s saved plan.");
    }
  };
  return (
    <dialog
      ref={ref}
      className="dialog"
      aria-label={
        s.modal === "checkout" ? "Review your plan" : "Your demo plans"
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
          <h2>{saved ? "Plan saved." : "Review your plan."}</h2>
          <p>
            This is a demonstration. No charge, booking, or live service is
            created.
          </p>
          <div className="order-recap">
            <strong>{games.find((g) => g.slug === s.game)?.name}</strong>
            <span>
              {ranks[s.current]} → {ranks[s.target]}
            </span>
            <span>
              {s.queue} queue · {s.region} · {s.role}
            </span>
            {s.champions && <span>Preferences: {s.champions}</span>}
            <strong>${price.toFixed(2)} USD · illustrative estimate</strong>
          </div>
          <button className="button" onClick={save}>
            {saved ? (
              <>
                <Check size={17} /> Save updated plan
              </>
            ) : (
              <>
                Save demo plan <ArrowUpRight size={17} />
              </>
            )}
          </button>
          {saved && (
            <p role="status">
              Saved on this device. Find it under “Log in” in the header.
            </p>
          )}
        </>
      ) : (
        <>
          <p className="eyebrow">YOUR ASCEND SPACE</p>
          <h2>Your demo plans.</h2>
          <p>
            Account authentication is not connected. You can retrieve a plan
            saved in this browser without signing in.
          </p>
          <button className="button" onClick={restore}>
            Load saved plan <ArrowUpRight size={17} />
          </button>
          {s.order && (
            <div className="order-recap">
              <strong>
                {s.order.id} · {s.order.game}
              </strong>
              <span>
                {s.order.from} → {s.order.to}
              </span>
              <span>${s.order.price.toFixed(2)} USD · demo estimate</span>
            </div>
          )}
        </>
      )}
      {error && <p role="alert">{error}</p>}
    </dialog>
  );
}
