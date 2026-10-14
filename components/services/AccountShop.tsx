"use client";

import { useLanguage } from "@/components/ui/LanguageProvider";
import { translateText } from "@/lib/i18n";

export function AccountShop({ game }: { game: string; smurfs?: boolean }) {
  const { language } = useLanguage();
  return (
    <section className="account-shop" aria-label={game}>
      <p role="status">{translateText(language,
        "Account inventory is unavailable until its API is connected.",
        "Kho tài khoản chưa khả dụng cho đến khi API được kết nối.")}</p>
    </section>
  );
}
