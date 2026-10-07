"use client";

import { useMoney } from "@/components/ui/Currency";
import { useLanguage } from "@/components/ui/LanguageProvider";
import { intlLocales } from "@/lib/i18n";

export function ShopPrice({ usd, className = "" }: { usd: number; className?: string }) {
  const money = useMoney();
  const { language } = useLanguage();
  const value = money.amount(usd);
  if (value === null) return <strong className={`shop-price ${className}`}>{money.format(usd)}</strong>;
  const parts = new Intl.NumberFormat(intlLocales[language], { style: "currency", currency: money.currency }).formatToParts(value);
  return <strong className={`shop-price ${className}`} aria-label={money.format(usd)}>
    <span aria-hidden="true">{parts.map((part, index) => <span key={index} className={part.type === "currency" ? "shop-price-currency" : undefined}>{part.value}</span>)}</span>
  </strong>;
}
