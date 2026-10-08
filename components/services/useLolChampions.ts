"use client";
import { lolChampions } from "@/data/lol-champions";

// The UI-only release uses the bundled catalog.
export function useLolChampions(enabled: boolean) {
  void enabled;
  return lolChampions;
}
