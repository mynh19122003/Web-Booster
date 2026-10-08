import { UiText } from "@/components/ui/UiText";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Wallet } from "lucide-react";
import { WalletPanel } from "@/components/account/WalletPanel";

export const metadata: Metadata = {
  title: "Wallet",
  description: "View your wallet balance and available top-up options.",
};

export default function WalletPage() {
  return <main className="wallet-page section" id="main">
    <div className="wallet-page-header">
      <Link href="/services" className="wallet-page-back"><ArrowLeft size={15} /><UiText english={"Back to services"} /></Link>
      <div className="wallet-page-title"><span><Wallet size={22} /></span><div><h1><UiText english={"Wallet"} /></h1><p><UiText english={"Balance, top-ups and transaction history"} /></p></div></div>
    </div>
    <WalletPanel />
  </main>;
}
