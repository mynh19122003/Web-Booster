"use client";
import { useEffect, useId } from "react";
import { motion } from "motion/react";
import { Coins } from "lucide-react";
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

export function CurrencySwitch({
  compact = false,
  className = "",
  layoutId,
}: {
  compact?: boolean;
  className?: string;
  layoutId?: string;
}) {
  const currency = useStore((s) => s.currency);
  const set = useStore((s) => s.set);
  const autoId = useId();
  const activeLayoutId = layoutId ?? `activeCurrency-${autoId}`;

  const handleSelect = (code: "USD" | "EUR") => {
    set({ currency: code });
    try {
      localStorage.setItem("ascend-currency", code);
    } catch {
      /* Preference is optional. */
    }
  };

  return (
    <div
      className={`h-9 inline-flex items-center gap-1 bg-white/[0.03] border border-white/10 rounded-full p-1 backdrop-blur-md shrink-0 ${className}`}
      role="group"
      aria-label="Display currency"
    >
      {!compact && <div className="pl-2 pr-1 flex items-center justify-center text-[#FF9F3C]/80 shrink-0 select-none">
        <Coins size={13} aria-hidden="true" />
      </div>}
      {(["USD", "EUR"] as const).map((code) => {
        const isActive = currency === code;
        return (
          <button
            key={code}
            type="button"
            aria-pressed={isActive}
            onClick={() => handleSelect(code)}
            className={`relative h-7 inline-flex items-center justify-center rounded-full px-2.5 text-xs transition-colors select-none leading-none cursor-pointer ${
              isActive
                ? "text-black font-bold"
                : "text-zinc-400 hover:text-white font-medium"
            }`}
          >
            {isActive && (
              <motion.span
                layoutId={activeLayoutId}
                className="absolute inset-0 bg-gradient-to-r from-[#FF9F3C] to-[#D97706] rounded-full shadow-[0_0_12px_rgba(255,159,60,0.3)]"
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
              />
            )}
            <span className="relative z-10">{code}</span>
          </button>
        );
      })}
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
