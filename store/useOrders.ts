"use client";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { publicMockMode } from "@/lib/public-data-source";
import type { PaymentMethod } from "@/data/payment-methods";
export type { PaymentMethod } from "@/data/payment-methods";
type Order = { id: string; title: string; amount: number; method: PaymentMethod; date: string; details: string[] };
type OrderState = { orders: Order[]; completePayment: (amount: number, title: string, method: PaymentMethod, details: string[], orderNumber?: string) => Order | null };
export const useOrders = create<OrderState>()(persist((set) => ({
  orders: publicMockMode ? [{ id: "DEMO-1053", title: "Valorant coaching", amount: 22, method: "Apple Pay", date: "2026-10-11T03:00:00.000Z", details: ["Demo order", "Nova · 1 hour"] }] : [],
  completePayment: (amount, title, method, details, orderNumber) => {
    if (!Number.isFinite(amount) || amount <= 0) return null;
    const order: Order = { id: orderNumber ?? `ASC-${new Date().getFullYear()}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`, title, amount, method, date: new Date().toISOString(), details };
    set(state => ({ orders: [order, ...state.orders.filter(existing => existing.id !== order.id)] }));
    return order;
  },
}), { name: "ascend-orders-mock-v1", storage: createJSONStorage(() => localStorage), skipHydration: true }));
