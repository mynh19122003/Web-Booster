"use client";

import { useEffect, useState } from "react";
import { lolChampions } from "@/data/lol-champions";

const storageKey = "lol-champions-catalog-v1";
type Champion = { id: string; name: string };
function valid(value: unknown): value is Champion[] {
  return Array.isArray(value) && value.length >= lolChampions.length && value.every((item) =>
    item && typeof item.id === "string" && /^[A-Za-z0-9]+$/.test(item.id) && typeof item.name === "string");
}

export function useLolChampions(enabled: boolean) {
  const [champions, setChampions] = useState(lolChampions);
  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) ?? "null");
      if (valid(saved)) queueMicrotask(() => {
        if (!controller.signal.aborted) setChampions(saved);
      });
    } catch { /* Storage is optional; the bundled catalog remains available. */ }
    async function refresh() {
      if (document.visibilityState === "hidden") return;
      try {
        const response = await fetch("/api/game-data/lol", { signal: controller.signal });
        if (!response.ok) return;
        const payload = await response.json();
        if (controller.signal.aborted || payload.source !== "riot" || !valid(payload.champions)) return;
        setChampions(payload.champions);
        try { localStorage.setItem(storageKey, JSON.stringify(payload.champions)); } catch { /* Storage may be full. */ }
      } catch { /* Keep the last successfully downloaded catalog. */ }
    }
    void refresh();
    const interval = window.setInterval(() => void refresh(), 60 * 60 * 1000);
    const onVisible = () => { if (document.visibilityState === "visible") void refresh(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      controller.abort(); window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [enabled]);
  return champions;
}
