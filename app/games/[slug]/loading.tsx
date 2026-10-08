"use client";

import { useLanguage } from "@/components/ui/LanguageProvider";
import { translateText } from "@/lib/i18n";

export default function Loading() {
  const { language } = useLanguage();
  return <section id="configure" className="section game-loading" aria-busy="true">
    <div className="container">
      <p role="status">{translateText(language,"Opening your game configurator…","Đang mở cấu hình game…")}</p>
      <div className="game-loading-title" aria-hidden="true" />
      <div className="game-loading-grid" aria-hidden="true">
        <div /><div /><div />
      </div>
    </div>
  </section>;
}
