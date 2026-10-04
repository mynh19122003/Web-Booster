"use client";
import { useEffect } from "react";
import { useStore } from "@/store/useStore";
export function GameSync({ slug, queue }: { slug?: string; queue?: string }) {
  const set = useStore((s) => s.set);
  useEffect(() => {
    if (slug) set({ game: slug });
    if (queue) set({ queue });
  }, [slug, queue, set]);
  return null;
}
