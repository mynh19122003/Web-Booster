"use client";

import { gameConfigFor } from "@/lib/game-config";
import { productsByGame, categoryKeys, type ProductCategory } from "@/lib/product-categories";
import { useStore } from "@/store/useStore";
import { useLanguage } from "@/components/ui/LanguageProvider";
import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";

export function GameProductNav({ gameSlug, gameName }: { gameSlug: string; gameName: string }) {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const { service, queue, product, set } = useStore();
  const products = productsByGame[gameSlug] ?? productsByGame["league-of-legends"];
  const urlCategory = searchParams.get("category");
  const active = (urlCategory && products.some(p => p.id === urlCategory))
    ? urlCategory
    : (product ?? products.find((item) => item.service === service && (item.queue ? item.queue === queue : queue !== "Double Up"))?.id ?? products[0].id);

  const categoryLabel = (item: ProductCategory) => t((categoryKeys[item.id] ?? "categoryDivisions") as Parameters<typeof t>[0]);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (urlCategory && products.some(p => p.id === urlCategory) && product !== urlCategory) {
      const item = products.find(p => p.id === urlCategory);
      if (item) {
        set({
          product: item.id,
          service: item.service ?? "rank-boost",
          units: item.id === "placements" ? 5 : 1,
          queue: item.queue ?? (item.id === "games" ? "Duo" : item.id === "normals" ? "Normal Draft" : item.id === "unrated" ? "Unrated" : item.id === "arena" ? "Arena" : gameConfigFor(gameSlug).queues[0]),
        });
      }
    }
  }, [urlCategory, gameSlug, product, products, set]);

  useEffect(() => {
    const track = trackRef.current;
    const selected = track?.querySelector<HTMLButtonElement>('[aria-selected="true"]');
    if (track && selected) track.scrollTo({ left: selected.offsetLeft - track.offsetLeft - (track.clientWidth - selected.clientWidth) / 2 });
  }, [active]);

  function choose(item: ProductCategory) {
    if (item.id === active) return;
    try {
      if (typeof window !== "undefined") {
        const url = new URL(window.location.href);
        url.searchParams.set("category", item.id);
        window.history.replaceState(null, "", url.toString());
      }
    } catch {}

    set({ product: item.id, service: item.service ?? "rank-boost", units: item.id === "placements" ? 5 : 1,
      queue: item.queue ?? (item.id === "games" ? "Duo" : item.id === "normals" ? "Normal Draft" : item.id === "unrated" ? "Unrated" : item.id === "arena" ? "Arena" : gameConfigFor(gameSlug).queues[0]),
      quoteOverride: null, quoteAddOns: [], checkoutDetails: null, champions: "" });
  }

  return (
    <div className="game-product-nav" aria-label={t("gameProducts", { game: gameName })}>
      <label className="game-product-mobile-picker">
        <span>{t("services")}</span>
        <select value={active} onChange={(event) => { const item = products.find((entry) => entry.id === event.target.value); if (item) choose(item); }}>
          {products.map((item) => <option key={item.id} value={item.id}>{categoryLabel(item)}</option>)}
        </select>
      </label>
      <div ref={trackRef} className="game-product-track" role="tablist" aria-label={t("gameProducts", { game: gameName })}>
        {products.map((item) => {
          const Icon = item.icon;
          return (
            <button key={item.id} id={`product-${gameSlug}-${item.id}`} type="button" role="tab" aria-selected={item.id === active} tabIndex={item.id === active ? 0 : -1}
              onKeyDown={(event) => {
                const index = products.indexOf(item);
                const next = event.key === "ArrowRight" ? (index + 1) % products.length : event.key === "ArrowLeft" ? (index - 1 + products.length) % products.length : event.key === "Home" ? 0 : event.key === "End" ? products.length - 1 : null;
                if (next === null) return;
                event.preventDefault(); choose(products[next]);
                document.getElementById(`product-${gameSlug}-${products[next].id}`)?.focus();
              }}
              aria-controls="category-content" onClick={() => choose(item)} className="game-product-tab">
              <Icon size={16} aria-hidden="true" />
              <span>{categoryLabel(item)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
