"use client";

import { useSyncExternalStore } from "react";

const key = "ascend-shop-favorites-v1";
const event = "ascend-shop-favorites-changed";
const empty: readonly string[] = [];
let previousRaw: string | null | undefined;
let snapshot: readonly string[] = empty;

function read() {
  try {
    const raw = localStorage.getItem(key);
    if (raw === previousRaw) return snapshot;
    const parsed: unknown = JSON.parse(raw ?? "[]");
    snapshot = Array.isArray(parsed) ? Array.from(new Set(parsed.filter((id): id is string => typeof id === "string" && /^[A-Za-z0-9_-]{1,100}$/.test(id)))) : empty;
    previousRaw = raw;
  } catch { /* Keep in-memory favorites when browser storage is unavailable. */ }
  return snapshot;
}

function subscribe(listener: () => void) {
  window.addEventListener("storage", listener);
  window.addEventListener(event, listener);
  return () => { window.removeEventListener("storage", listener); window.removeEventListener(event, listener); };
}

export function useShopFavorites() {
  const favorites = useSyncExternalStore(subscribe, read, () => empty);
  function toggleFavorite(id: string) {
    const current = read();
    snapshot = current.includes(id) ? current.filter(value => value !== id) : [...current, id];
    previousRaw = JSON.stringify(snapshot);
    try { localStorage.setItem(key, previousRaw); } catch { /* Favorites remain available in this tab. */ }
    window.dispatchEvent(new Event(event));
  }
  return { favorites, toggleFavorite };
}
