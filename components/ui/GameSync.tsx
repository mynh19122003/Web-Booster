"use client";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useStore } from "@/store/useStore";
import { initialRanks, servicesFor } from "@/lib/service-options";
import { productsByGame } from "@/lib/product-categories";

export function GameSync({
  slug,
  queue,
  service,
}: {
  slug?: string;
  queue?: string;
  service?: string;
}) {
  const set = useStore((s) => s.set);
  const searchParams = useSearchParams();

  useEffect(() => {
    const game = slug ?? useStore.getState().game;
    const requested = service ?? useStore.getState().service;
    const selected = servicesFor(game).some((s) => s.slug === requested)
      ? requested
      : "rank-boost";
    const categoryParam = searchParams.get("category");
    const validProduct = categoryParam && productsByGame[game]?.some((p) => p.id === categoryParam)
      ? categoryParam
      : null;

    set({
      game,
      product: validProduct,
      checkoutDetails: null,
      quoteOverride: null,
      quoteAddOns: [],
      service: selected,
      queue: queue ?? (selected === "duo-boost" ? "Duo" : game === "valorant" ? "Competitive" : game === "teamfight-tactics" ? "Ranked" : "Solo"),
      role: game === "valorant" ? "Duelist" : game === "league-of-legends" ? "Mid" : "Any",
      ...initialRanks(game),
    });
  }, [slug, queue, service, set, searchParams]);
  return null;
}
