"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { accountArtworkSources, accountArtworkLabel } from "@/lib/account-artwork";
import { AccountImage } from "./AccountImage";

export function AccountCosmetics({ game, skins, total }: { game: string; skins: string[]; total: number }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("listed");
  const visible = useMemo(() => {
    const matches = skins.filter((skin) => skin.toLowerCase().includes(query.trim().toLowerCase()));
    return sort === "name" ? matches.sort((a, b) => a.localeCompare(b)) : matches;
  }, [query, sort, skins]);
  return <section className="account-section br-cosmetics">
    <div className="account-section-heading"><div><span className="account-section-index">COSMETICS</span><h2>Skins <span>{total}</span></h2></div>
      <label className="br-skin-sort"><span className="sr-only">Sort skins</span><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="listed">Listed order</option><option value="name">Name A–Z</option></select></label>
    </div>
    <label className="br-cosmetic-search"><Search size={17} aria-hidden="true" /><input value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Search skins" placeholder="Search skins or champions…" />{query && <button type="button" aria-label="Clear skin search" onClick={() => setQuery("")}><X size={16} /></button>}</label>
    <p className="br-inventory-caption" aria-live="polite">{visible.length} listed skin{visible.length === 1 ? "" : "s"}{total > skins.length ? ` · ${total} skins on this account` : ""}</p>
    <div className="br-cosmetic-grid">{visible.map((skin) => {
      const sources = accountArtworkSources(game, skin);
      return <article key={skin}>
        <AccountImage sources={sources} fill className="br-artwork-image" sizes="(max-width:540px) 45vw, (max-width:800px) 30vw, 180px" fallbackLabel={skin} />
        <div><b>{skin}</b>{sources.length > 0 && <small>{accountArtworkLabel(game, skin)}</small>}</div>
      </article>;
    })}</div>
    {visible.length === 0 && <p className="account-empty-search">{skins.length ? "No skins match your search." : "No skin previews listed for this account."}</p>}
  </section>;
}
