"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type WalletTransaction = {
  id: string;
  kind: "purchase" | "topup";
  title: string;
  amount: number;
  date: string;
};
export type WalletOrder = {
  id: string;
  title: string;
  amount: number;
  method: string;
  status: "Paid";
  date: string;
  details?: string[];
};

type WalletState = {
  balance: number;
  transactions: WalletTransaction[];
  orders: WalletOrder[];
  completePayment: (amount: number, title: string, method: string, chargeWallet: boolean, details: string[]) => WalletOrder | null;
};

export const useWallet = create<WalletState>()(persist((set, get) => ({
  // Demo account seed, persisted after the first visit.
  balance: 500,
  transactions: [],
  orders: [],
  completePayment: (amount, title, method, chargeWallet, details) => {
    const state = get();
    if (!Number.isFinite(amount) || amount <= 0 || (chargeWallet && state.balance < amount)) return null;
    const date = new Date().toISOString();
    const order: WalletOrder = { id: `ASC-${new Date().getFullYear()}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`, title, amount, method, status: "Paid", date, details };
    set({
      balance: chargeWallet ? Math.round((state.balance - amount) * 100) / 100 : state.balance,
      transactions: chargeWallet ? [{ id: order.id, kind: "purchase", title, amount: -amount, date }, ...state.transactions] : state.transactions,
      orders: [order, ...state.orders],
    });
    return order;
  },
}), { name: "ascend-wallet-demo-v1", storage: createJSONStorage(() => localStorage), skipHydration: true }));
