"use client";
import { create } from "zustand";
export type CoachBooking = {
  coachId: string;
  coachName: string;
  coachSlug: string;
  packageId?: string;
  packageName?: string;
  format: "hourly" | "duo";
  quantity: number;
  unitPrice: number;
  total: number;
};
export type AccountPurchase = {
  accountId: string;
  title: string;
  game: string;
  price: number;
  server: string;
  rank: string;
  division?: string;
  level: number;
};
type Order = {
  categoryName?: string;
  quoteRequired?: boolean;
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
  lpGain?: string;
  addOns?: string[];
  pricingVersion?: string;
  coachBooking?: CoachBooking;
  accountPurchase?: AccountPurchase;
};
type State = {
  game: string;
  product: string | null;
  checkoutDetails: { name: string; from: string; to: string; quoteRequired: boolean } | null;
  coachBooking: CoachBooking | null;
  accountPurchase: AccountPurchase | null;
  service: string;
  units: number;
  quoteOverride: number | null;
  currency: "USD" | "EUR";
  usdPerEur: number | null;
  rateDate: string;
  rateState: "loading" | "live" | "cached" | "unavailable";
  current: number;
  target: number;
  currentLp: number;
  targetLp: number;
  lpGain: string;
  quoteAddOns: string[];
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
  product: null,
  checkoutDetails: null,
  coachBooking: null,
  accountPurchase: null,
  service: "rank-boost",
  units: 1,
  quoteOverride: null,
  currency: "USD",
  usdPerEur: null,
  rateDate: "",
  rateState: "loading",
  current: 12,
  target: 24,
  currentLp: 0,
  targetLp: 0,
  lpGain: "22-25 LP",
  quoteAddOns: [],
  queue: "Solo",
  region: "EUW",
  role: "Mid",
  champions: "",
  modal: null,
  order: null,
  set: (value) => set(state => {
    const inputs = ["game", "product", "service", "units", "current", "target", "currentLp", "targetLp", "queue", "region", "lpGain"] as const;
    const changed = inputs.some(key => key in value && value[key] !== state[key]);
    const shouldResetQuote = changed && !("quoteOverride" in value) && !("coachBooking" in value) && !("accountPurchase" in value);
    return {
      ...(shouldResetQuote ? { quoteOverride: null, checkoutDetails: null, quoteAddOns: [], coachBooking: null, accountPurchase: null } : {}),
      ...value
    };
  }),
}));
