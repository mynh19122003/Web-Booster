"use client";
import { useEffect } from "react";
import { useStore } from "@/store/useStore";
import { initialRanks, servicesFor } from "@/lib/service-options";
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
  useEffect(() => {
    const game = slug ?? useStore.getState().game;
    const requested = service ?? useStore.getState().service;
    const selected = servicesFor(game).some((s) => s.slug === requested)
      ? requested
      : "rank-boost";
    set({
      game,
      service: selected,
      queue: queue ?? (selected === "duo-boost" ? "Duo" : "Solo"),
      ...initialRanks(game),
    });
  }, [slug, queue, service, set]);
  return null;
}
