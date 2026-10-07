"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Search } from "lucide-react";
import { championIconSources } from "@/lib/account-artwork";
import { AccountImage } from "./AccountImage";

export function AccountInventory({ game, items, label }: { game: string; items: string[]; label: string }) {
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState(false);
  const filtered = useMemo(() => items.filter((item) => item.toLowerCase().includes(query.toLowerCase())), [items, query]);
  const visible = query || expanded ? filtered : filtered.slice(0, 20);
  return <section className="account-section account-inventory">
    <div className="account-section-heading"><div><span className="account-section-index">INVENTORY</span><h2>{label} <span>{items.length}</span></h2></div></div>
    <label className="account-inventory-search"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${label.toLowerCase()}...`} aria-label={`Search ${label.toLowerCase()}`} /></label>
    <div className="account-inventory-grid">{visible.map((item) => {
      const sources = game === "league-of-legends" ? championIconSources(item) : [];
      return <div className="account-inventory-item" key={item}><AccountImage sources={sources} width={56} height={56} fallbackLabel={item} className="account-champion-avatar" /><span>{item}</span></div>;
    })}{visible.length === 0 && <p className="account-empty-search">No matching {label.toLowerCase()}.</p>}</div>
    {!query && items.length > 20 && <button className="account-inventory-more" type="button" onClick={() => setExpanded(!expanded)} aria-expanded={expanded}>{expanded ? <>Show less <ChevronUp size={15} /></> : <>Load more {label.toLowerCase()} <span>+{items.length - 20}</span><ChevronDown size={15} /></>}</button>}
  </section>;
}
