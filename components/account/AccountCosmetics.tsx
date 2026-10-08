"use client";
import { useLanguage } from "@/components/ui/LanguageProvider";
import { intlLocales, translateText } from "@/lib/i18n";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { accountArtworkSources, accountArtworkLabel } from "@/lib/account-artwork";
import { AccountImage } from "./AccountImage";

export function AccountCosmetics({ game, skins, total }: { game: string; skins: string[]; total: number }) {
  const { language } = useLanguage();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("listed");
  const visible = useMemo(() => {
    const matches = skins.filter((skin) => skin.toLowerCase().includes(query.trim().toLowerCase()));
    return sort === "name" ? matches.sort((a, b) => a.localeCompare(b, intlLocales[language])) : matches;
  }, [query, sort, skins, language]);
  return <section className="account-section br-cosmetics">
    <div className="account-section-heading"><div><span className="account-section-index">{translateText(language, "COSMETICS", "Vật phẩm trang trí")}</span><h2>{translateText(language, "Skins", "Trang phục")}<span>{total}</span></h2></div>
      <label className="br-skin-sort"><span className="sr-only">{translateText(language, "Sort skins", "Sắp xếp trang phục")}</span><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="listed">{translateText(language, "Listed order", "Thứ tự danh sách")}</option><option value="name">{translateText(language, "Name A–Z", "Tên A–Z")}</option></select></label>
    </div>
    <label className="br-cosmetic-search"><Search size={17} aria-hidden="true" /><input value={query} onChange={(event) => setQuery(event.target.value)} aria-label={translateText(language, "Search skins", "Tìm trang phục")} placeholder={translateText(language, "Search skins or champions…", "Tìm trang phục hoặc tướng…")} />{query && <button type="button" aria-label={translateText(language,"Clear skin search","Xóa tìm kiếm trang phục")} onClick={() => setQuery("")}><X size={16} /></button>}</label>
    <p className="br-inventory-caption" aria-live="polite">{translateText(language, "{count} listed skins", "{count} trang phục trong danh sách", {count:visible.length})}{total > skins.length && <> · {translateText(language,"{count} skins on this account","{count} trang phục trong tài khoản",{count:total})}</>}</p>
    <div className="br-cosmetic-grid">{visible.map((skin) => {
      const sources = accountArtworkSources(game, skin);
      return <article key={skin}>
        <AccountImage sources={sources} fill className="br-artwork-image" sizes="(max-width:540px) 45vw, (max-width:800px) 30vw, 180px" fallbackLabel={skin} />
        <div><b>{skin}</b>{sources.length > 0 && <small>{accountArtworkLabel(game, skin)}</small>}</div>
      </article>;
    })}</div>
    {visible.length === 0 && <p className="account-empty-search">{skins.length ? translateText(language,"No skins match your search.","Không tìm thấy trang phục phù hợp.") : translateText(language,"No skin previews listed for this account.","Tài khoản chưa có hình xem trước trang phục.")}</p>}
  </section>;
}
