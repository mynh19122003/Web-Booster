"use client";
import { create } from "zustand";
type Order = {
  id: string;
  game: string;
  from: string;
  to: string;
  price: number;
  queue: string;
  region: string;
  role: string;
  champions: string;
  service?: string;
  units?: number;
};
type State = {
  game: string;
  service: string;
  units: number;
  currency: "USD" | "EUR";
  usdPerEur: number | null;
  rateDate: string;
  rateState: "loading" | "live" | "cached" | "unavailable";
  current: number;
  target: number;
  queue: string;
  region: string;
  role: string;
  champions: string;
  modal: "account" | "support" | "checkout" | null;
  order: Order | null;
  set: (value: Partial<Omit<State, "set">>) => void;
};
export const useStore = create<State>((set) => ({
  game: "league-of-legends",
  service: "rank-boost",
  units: 1,
  currency: "USD",
  usdPerEur: null,
  rateDate: "",
  rateState: "loading",
  current: 12,
  target: 24,
  queue: "Solo",
  region: "EUW",
  role: "Mid",
  champions: "",
  modal: null,
  order: null,
  set: (value) => set(value),
}));
