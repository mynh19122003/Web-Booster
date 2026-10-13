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
    const categoryParam = searchParams.get("category");
    const category = productsByGame[game]?.find(product => product.id === categoryParam);
    const validProduct = category?.id ?? null;
    // The selected category wins over the page's default service when tabs change the URL.
    const requested = category ? category.service ?? "rank-boost" : service ?? useStore.getState().service;
    const selected = servicesFor(game).some((s) => s.slug === requested) ? requested : "rank-boost";

    set({
      game,
      product: validProduct,
      checkoutDetails: null,
      quoteOverride: null,
      quoteAddOns: [],
      service: selected,
      queue: category?.queue ?? queue ?? (selected === "duo-boost" ? "Duo" : game === "valorant" ? "Competitive" : game === "teamfight-tactics" ? "Ranked" : "Solo"),
      role: game === "valorant" ? "Duelist" : game === "league-of-legends" ? "Mid" : "Any",
      ...initialRanks(game),
    });
  }, [slug, queue, service, set, searchParams]);
  return null;
}
