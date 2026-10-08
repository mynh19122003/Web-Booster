"use client";
import { useLanguage } from "@/components/ui/LanguageProvider";
import { translateText } from "@/lib/i18n";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Search } from "lucide-react";
import { championIconSources } from "@/lib/account-artwork";
import { AccountImage } from "./AccountImage";

export function AccountInventory({ game, items, label }: { game: string; items: string[]; label: string }) {
  const { language } = useLanguage();
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState(false);
  const filtered = useMemo(() => items.filter((item) => item.toLowerCase().includes(query.toLowerCase())), [items, query]);
  const visible = query || expanded ? filtered : filtered.slice(0, 20);
  return <section className="account-section account-inventory">
    <div className="account-section-heading"><div><span className="account-section-index">{translateText(language, "INVENTORY", "Bộ sưu tập")}</span><h2>{translateText(language, label)} <span>{items.length}</span></h2></div></div>
    <label className="account-inventory-search"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={translateText(language, "Search {label}…", "Tìm {label}…", {label:translateText(language,label)})} aria-label={translateText(language,"Search {label}","Tìm {label}",{label:translateText(language,label)})} /></label>
    <div className="account-inventory-grid">{visible.map((item) => {
      const sources = game === "league-of-legends" ? championIconSources(item) : [];
      return <div className="account-inventory-item" key={item}><AccountImage sources={sources} width={56} height={56} fallbackLabel={item} className="account-champion-avatar" /><span>{item}</span></div>;
    })}{visible.length === 0 && <p className="account-empty-search">{translateText(language, "No matching {label}.", "Không tìm thấy {label} phù hợp.", {label:translateText(language,label)})}</p>}</div>
    {!query && items.length > 20 && <button className="account-inventory-more" type="button" onClick={() => setExpanded(!expanded)} aria-expanded={expanded}>{expanded ? <>{translateText(language, "Show less", "Thu gọn")}<ChevronUp size={15} /></> : <>{translateText(language, "Load more", "Xem thêm")} <span>+{items.length - 20}</span><ChevronDown size={15} /></>}</button>}
  </section>;
}
