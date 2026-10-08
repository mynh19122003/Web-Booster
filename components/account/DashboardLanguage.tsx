"use client";
import { translateText } from "@/lib/i18n";

import { useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { languages } from "@/lib/i18n";
import { setLanguage, useLanguage } from "@/components/ui/LanguageProvider";
import { LanguageFlag } from "@/components/ui/LanguageFlag";

export function DashboardLanguage() {
  const { language, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const trigger = useRef<HTMLButtonElement>(null);
  const current = languages.find((item) => item.code === language) ?? languages[0];
  const filtered = languages.filter((item) => `${item.name} ${item.country} ${item.short}`.toLocaleLowerCase().includes(query.toLocaleLowerCase()));
  return <div className="dashboard-locale" onKeyDown={(event) => {
    if (open && event.key === "Escape") { event.stopPropagation(); setOpen(false); trigger.current?.focus(); }
  }}>
    <button ref={trigger} type="button" className="dashboard-locale-trigger" aria-expanded={open} aria-controls="dashboard-languages" onClick={() => { setOpen(!open); setQuery(""); }}>
      <LanguageFlag code={current.flagCode} /><span><small>{t("language")}</small><strong>{current.name}</strong></span><ChevronDown size={17} style={{ transform: open ? "rotate(180deg)" : undefined }} />
    </button>
    {open && <div id="dashboard-languages" className="dashboard-locale-options">
      <input autoFocus type="search" value={query} onChange={(event) => setQuery(event.target.value)} aria-label={translateText(language, "Search languages", "Tìm ngôn ngữ")} placeholder={translateText(language, "Search languages…", "Tìm ngôn ngữ…")} />
      <div className="dashboard-locale-list" role="group" aria-label={t("language")}>
        {filtered.map((item) => <button type="button" key={item.code} aria-pressed={language === item.code} onClick={() => { setLanguage(item.code); setOpen(false); trigger.current?.focus(); }}><LanguageFlag code={item.flagCode} /><span><strong>{item.name}</strong><small>{item.country}</small></span>{item.code === language && <Check size={16} />}</button>)}
        {filtered.length === 0 && <p>{translateText(language, "No languages found.", "Không tìm thấy ngôn ngữ.")}</p>}
      </div>
    </div>}
  </div>;
}
