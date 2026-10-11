"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useLanguage } from "@/components/ui/LanguageProvider";
import { translateText } from "@/lib/i18n";
import { notifyCoachProfileUpdated, subscribeCoachProfileUpdates } from "@/lib/coach-profile-events";

export function StatusToggle() {
  const { language } = useLanguage();
  const [online, setOnline] = useState<boolean | null>(null);
  const [error, setError] = useState(false);
  const [pending, startTransition] = useTransition();
  const mutating = useRef(false);
  const revision = useRef(0);
  useEffect(() => {
    const abort = new AbortController();
    async function refresh() {
      if (document.hidden || mutating.current) return;
      const version = revision.current;
      try {
        const response = await fetch("/api/employee/status", { cache: "no-store", signal: abort.signal });
        if (!response.ok) return;
        const data = await response.json();
        if (!abort.signal.aborted && version === revision.current && typeof data.isOnline === "boolean") setOnline(data.isOnline);
      } catch {}
    }
    void refresh();
    const unsubscribe = subscribeCoachProfileUpdates(() => { void refresh(); });
    const timer = setInterval(refresh, 15000);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => { abort.abort(); unsubscribe(); clearInterval(timer); window.removeEventListener("focus", refresh); document.removeEventListener("visibilitychange", refresh); };
  }, []);

  if (online === null) return null;
  return <div className="employee-header-status-wrap">
    <button type="button" role="switch" aria-checked={online} disabled={pending}
      aria-label={translateText(language, "Employee availability", "Trạng thái nhân viên")}
      className={`employee-header-status ${online ? "is-online" : ""}`}
      onClick={() => {
        if (mutating.current) return;
        const previous = online;
        const next = !online;
        mutating.current = true; revision.current++; setOnline(next); setError(false);
        startTransition(async () => {
          try {
            const response = await fetch("/api/employee/status", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isOnline: next }) });
            const data = await response.json();
            if (!response.ok || typeof data.isOnline !== "boolean") throw new Error("status-update-failed");
            setOnline(data.isOnline);
            notifyCoachProfileUpdated();
          } catch { setOnline(previous); setError(true); }
          finally { mutating.current = false; }
        });
      }}><span aria-hidden="true" />{online ? translateText(language, "ONLINE", "TRỰC TUYẾN") : translateText(language, "OFFLINE", "NGOẠI TUYẾN")}</button>
    {error && <span className="employee-header-status-error" role="alert">{translateText(language, "Could not save status. Try again.", "Chưa lưu được trạng thái. Hãy thử lại.")}</span>}
  </div>;
}
