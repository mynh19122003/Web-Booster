"use client";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type CartItem = { id: string; href: string; game: string; title: string; detail: string; price: number };
type CartState = { items: CartItem[]; add: (href: string, addAnother?: boolean) => void; remove: (id: string) => void };
export const useCart = create<CartState>()(persist((set) => ({
  items: [],
  add: (href, addAnother = false) => {
    // localStorage hydration is synchronous; load saved items before persisting a mutation.
    if (!useCart.persist.hasHydrated()) void useCart.persist.rehydrate();
    if (!href.startsWith("/checkout?")) return;
    const params = new URLSearchParams(href.split("?")[1]);
    if (params.get("quote") === "true" || params.get("type") === "wallet") return;
    const price = Number(params.get("amount"));
    if (!Number.isFinite(price) || price <= 0) return;
    params.sort();
    const checkoutHref = `/checkout?${params}`;
    const id = crypto.randomUUID();
    const item: CartItem = { id, href: checkoutHref, game: params.get("game") ?? "league-of-legends", title: params.get("name") ?? params.get("service") ?? "Coaching", detail: params.get("type") === "coaching" ? `${params.get("coach")} · ${params.get("quantity")} ${params.get("mode") === "duo" ? "games" : "hours"}` : `${params.get("from") ?? ""} → ${params.get("to") ?? ""}`, price };
    const sameProduct = (existing: CartItem) => {
      const previous = new URLSearchParams(existing.href.split("?")[1]);
      if (params.get("account")) return previous.get("account") === params.get("account");
      previous.delete("name"); previous.sort();
      const current = new URLSearchParams(params); current.delete("name"); current.sort();
      return previous.toString() === current.toString();
    };
    set(state => (!addAnother || params.has("account")) && state.items.some(sameProduct) ? state : { items: [...state.items, item] });
  },
  remove: (id) => set(state => ({ items: state.items.filter(item => item.id !== id) })),
}), { name: "ascend-cart-v1", storage: createJSONStorage(() => localStorage), skipHydration: true }));
