"use client";

import { useLanguage } from "@/components/ui/LanguageProvider";

export default function Loading() {
  const { language } = useLanguage();
  return <section id="configure" className="section game-loading" aria-busy="true">
    <div className="container">
      <p role="status">{language === "vi" ? "Đang mở cấu hình game…" : "Opening your game configurator…"}</p>
      <div className="game-loading-title" aria-hidden="true" />
      <div className="game-loading-grid" aria-hidden="true">
        <div /><div /><div />
      </div>
    </div>
  </section>;
}
