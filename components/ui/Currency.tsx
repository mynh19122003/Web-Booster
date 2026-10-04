"use client";
import { useEffect } from "react";
import { useStore } from "@/store/useStore";

export function CurrencyProvider() {
  useEffect(() => {
    const set = useStore.getState().set;
    try {
      const preference = localStorage.getItem("ascend-currency");
      if (preference === "EUR" || preference === "USD")
        set({ currency: preference });
      const cached = JSON.parse(
        localStorage.getItem("ascend-exchange-rate") || "null",
      );
      if (
        cached &&
        Number.isFinite(cached.usdPerEur) &&
        cached.usdPerEur > 0 &&
        /^\d{4}-\d{2}-\d{2}$/.test(cached.date)
      ) {
        set({
          usdPerEur: cached.usdPerEur,
          rateDate: cached.date,
          rateState: "cached",
        });
      }
    } catch {
      /* Storage is optional for currency display. */
    }
    const controller = new AbortController();
    async function refresh() {
      try {
        const response = await fetch("/api/exchange-rate", {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Unavailable");
        const data = await response.json();
        if (
          !Number.isFinite(data.usdPerEur) ||
          data.usdPerEur <= 0 ||
          !/^\d{4}-\d{2}-\d{2}$/.test(data.date)
        )
          throw new Error("Invalid rate");
        set({
          usdPerEur: data.usdPerEur,
          rateDate: data.date,
          rateState: "live",
        });
        try {
          localStorage.setItem("ascend-exchange-rate", JSON.stringify(data));
        } catch {
          /* Continue without a cache. */
        }
      } catch {
        if (!controller.signal.aborted)
          set({
            rateState: useStore.getState().usdPerEur ? "cached" : "unavailable",
          });
      }
    }
    void refresh();
    const timer = setInterval(() => void refresh(), 3600000);
    return () => {
      controller.abort();
      clearInterval(timer);
    };
  }, []);
  return null;
}

export function CurrencySwitch({ compact = false }: { compact?: boolean }) {
  const currency = useStore((s) => s.currency);
  const set = useStore((s) => s.set);
  return (
    <div
      className={`currency-switch ${compact ? "compact" : ""}`}
      role="group"
      aria-label="Display currency"
    >
      {(["USD", "EUR"] as const).map((code) => (
        <button
          key={code}
          type="button"
          aria-pressed={currency === code}
          onClick={() => {
            set({ currency: code });
            try {
              localStorage.setItem("ascend-currency", code);
            } catch {
              /* Preference is optional. */
            }
          }}
        >
          {code}
        </button>
      ))}
    </div>
  );
}

export function useMoney() {
  const currency = useStore((s) => s.currency);
  const usdPerEur = useStore((s) => s.usdPerEur);
  const rateDate = useStore((s) => s.rateDate);
  const rateState = useStore((s) => s.rateState);
  const amount = (usd: number) =>
    currency === "EUR" ? (usdPerEur ? usd / usdPerEur : null) : usd;
  const format = (usd: number) => {
    const value = amount(usd);
    return value === null
      ? "EUR unavailable"
      : new Intl.NumberFormat("en-US", { style: "currency", currency }).format(
          value,
        );
  };
  return { currency, amount, format, rateDate, rateState, usdPerEur };
}
