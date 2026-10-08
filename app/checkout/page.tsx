import { UiText } from "@/components/ui/UiText";
import type { Metadata } from "next";
import { Suspense } from "react";
import { WalletCheckout } from "@/components/account/WalletCheckout";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Review your boost plan, coaching session or wallet top-up before checkout.",
};

export default function CheckoutPage() {
  return <Suspense fallback={<main className="wallet-checkout-page" aria-busy="true"><UiText english={"Loading checkout…"} /></main>}><WalletCheckout /></Suspense>;
}
