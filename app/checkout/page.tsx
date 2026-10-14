import type { Metadata } from "next";
import { WalletCheckout } from "@/components/account/WalletCheckout";
import { privateRobots } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Checkout",
  robots: privateRobots,
  description: "Checkout is unavailable until payment and order APIs are connected.",
};

export default function CheckoutPage() {
  return <WalletCheckout />;
}
