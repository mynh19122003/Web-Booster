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
};
type State = {
  game: string;
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
  current: 3,
  target: 6,
  queue: "Solo",
  region: "EUW",
  role: "Mid",
  champions: "",
  modal: null,
  order: null,
  set: (value) => set(value),
}));
