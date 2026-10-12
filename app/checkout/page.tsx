import { UiText } from "@/components/ui/UiText";
import type { Metadata } from "next";
import { Suspense } from "react";
import { WalletCheckout } from "@/components/account/WalletCheckout";
import { privateRobots } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Checkout",
  robots: privateRobots,
  description: "Review your service order and choose your preferred payment method.",
};

export default function CheckoutPage() {
  return <Suspense fallback={<div className="wallet-checkout-page" aria-busy="true"><UiText english={"Loading checkout…"} /></div>}><WalletCheckout /></Suspense>;
}
