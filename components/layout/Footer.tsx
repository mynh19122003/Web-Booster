"use client";

import Image from "next/image";
import { CreditCard } from "lucide-react";

const paymentLogos = [
  ["Visa", "visa.svg", 72, "max-w-[72px]"],
  ["Mastercard", "mastercard.svg", 48, "max-w-[48px]"],
  ["American Express", "americanexpress.svg", 32, "max-w-[32px]"],
  ["Google Pay", "googlepay.svg", 72, "max-w-[72px]"],
  ["Apple Pay", "applepay.svg", 72, "max-w-[72px]"],
  ["PayPal", "paypal.svg", 32, "max-w-[32px]"],
  ["JCB", "jcb.svg", 44, "max-w-[44px]"],
  ["Revolut", "revolut-wordmark.svg", 76, "max-w-[76px]"],
  ["Bancontact", "bancontact.svg", 48, "max-w-[48px]"],
  ["Discover", "discover.svg", 96, "max-w-[96px]"],
  ["eps", "eps.svg", 48, "max-w-[48px]"],
  ["paysafecard", "paysafecard-wordmark.svg", 100, "max-w-[100px]"],
] as const;

export function Footer() {
  return (
    <footer className="footer">
      <div className="max-w-7xl mx-auto px-6 border-t border-white/[0.08] pt-6 pb-6 mt-12">
        <p className="text-xs font-mono uppercase tracking-widest text-[#FF9F3C] flex items-center gap-2 mb-4"><CreditCard size={14} aria-hidden="true" />Accepted payments</p>
        <div aria-label="Accepted payment methods" className="ascend-payment-strip w-full flex items-center justify-between gap-6 md:gap-8 overflow-x-auto scrollbar-none py-2">
          {paymentLogos.map(([name, file, width, maxWidth]) => (
            <div
              key={name}
              title={name}
              className={`h-7 md:h-8 flex items-center justify-center flex-shrink-0 opacity-80 hover:opacity-100 hover:scale-105 transition-all duration-200 motion-reduce:transform-none motion-reduce:transition-none ${maxWidth}`}
            >
              <Image
                src={`/images/payments/${file}`}
                alt={name}
                width={width}
                height={28}
                className={`h-full w-auto object-contain ${maxWidth}`}
              />
            </div>
          ))}
        </div>
      </div>
    </footer>
  );
}
