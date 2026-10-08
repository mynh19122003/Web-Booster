"use client";
import { translateText } from "@/lib/i18n";

import { NumberInput } from "@/components/ui/NumberInput";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLolChampions } from "./useLolChampions";
import { ShopDisclosure } from "./ShopDisclosure";
import { ShopPrice } from "./ShopPrice";
import { AccountImage } from "@/components/account/AccountImage";
import { accountArtworkSources, championIconSources } from "@/lib/account-artwork";
import { useMemo, useState } from "react";
import { ArrowRight, Search, ShoppingBag, SlidersHorizontal, X, Users, Sparkles, Coins, Layers3, Swords, Heart } from "lucide-react";
import { demoShopAccounts, type ShopAccount } from "@/data/shop-accounts";
import { regionsForGame } from "@/data/regions";
import { gameRanks } from "@/lib/service-options";
import { coachRankCardIconPath } from "@/data/coaches";
import { useLanguage } from "@/components/ui/LanguageProvider";
import { CurrencySwitch } from "@/components/ui/Currency";
import { useShopFavorites } from "@/lib/shop-favorites";

export function AccountShop({ game, smurfs = false }: { game: string; smurfs?: boolean }) {
  const router = useRouter();
  const { language, t } = useLanguage();
  const lolChampions = useLolChampions(game === "league-of-legends");
  const { favorites, toggleFavorite } = useShopFavorites();
  const text = (en: string, vi: string) => translateText(language, en, vi);
  const [search, setSearch] = useState("");
  const [server, setServer] = useState("all");
  const [ranks, setRanks] = useState<string[]>([]);
  const [championsMin, setChampionsMin] = useState(0);
  const [skinsMin, setSkinsMin] = useState(0);
  const [pointsMin, setPointsMin] = useState(0);
  const [lpMin, setLpMin] = useState(0);
  const isTft = game === "teamfight-tactics";
  const ownedLabel = game === "valorant" ? "Agents" : isTft ? "Little Legends" : "Champions";
  const cosmeticLabel = isTft ? "Arenas" : "Skins";
  const ownedThreshold = game === "valorant" ? 20 : isTft ? 30 : 100;
  const [itemQuery, setItemQuery] = useState("");
  const [skinQuery, setSkinQuery] = useState("");
  const [ownedItems, setOwnedItems] = useState<string[]>([]);
  const [lowGain, setLowGain] = useState(false);
  const [role, setRole] = useState("all");
  const [smurfOnly, setSmurfOnly] = useState(smurfs);
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");
  const [collection, setCollection] = useState(false);
  const [sort, setSort] = useState("featured");
  const [limit, setLimit] = useState(12);
  const gameRegions = useMemo(() => regionsForGame(game), [game]);

  const catalog = useMemo(() => demoShopAccounts.filter((item) => item.game === game && (!smurfs || item.tags.includes("Smurf"))), [game, smurfs]);
  const results = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    const filtered = catalog.filter((item) => (server === "all" || item.server === server) && (!ranks.length || ranks.includes(item.rank)) && (!smurfOnly || item.tags.includes("Smurf")) && item.champions >= championsMin && item.skins >= skinsMin && item.points >= pointsMin && item.lpGain >= lpMin && (!lowGain || (item.lpGain > 0 && item.lpGain < 9)) && ownedItems.every((name) => (item.ownedChampions ?? item.items).includes(name)) && (!skinQuery.trim() || item.cosmetics.some((name) => name.toLowerCase().includes(skinQuery.trim().toLowerCase()))) && (role === "all" || item.tags.includes(role)) && (!min || item.price >= Number(min)) && (!max || item.price <= Number(max)) && (!collection || item.skins >= 30) && (!query || `${item.title} ${item.id} ${item.rank} ${item.tags.join(" ")} ${item.items.join(" ")} ${item.cosmetics.join(" ")} ${(item.ownedChampions ?? []).join(" ")}`.toLocaleLowerCase().includes(query)));
    return filtered.sort((a, b) => sort === "price-low" ? a.price - b.price : sort === "price-high" ? b.price - a.price : sort === "skins" ? b.skins - a.skins : 0);
  }, [catalog, server, ranks, smurfOnly, championsMin, skinsMin, pointsMin, role, min, max, collection, search, sort, lpMin, lowGain, ownedItems, skinQuery]);
  const reset = () => { setSearch(""); setServer("all"); setRanks([]); setMin(""); setMax(""); setCollection(false); setChampionsMin(0); setSkinsMin(0); setPointsMin(0); setRole("all"); setSmurfOnly(smurfs); setLpMin(0); setLowGain(false); setOwnedItems([]); setItemQuery(""); setSkinQuery(""); setLimit(12); };
  const toggleRank = (rank: string) => setRanks((selected) => selected.includes(rank) ? selected.filter((item) => item !== rank) : [...selected, rank]);
  const artwork = (account: ShopAccount) => game === "league-of-legends" ? accountArtworkSources(game, account.items[0]) : [`/images/games/${game}.webp`];
  const rankBadge = (account: ShopAccount) => account.rank === "Unranked" ? <ShoppingBag size={32} aria-hidden="true" /> : <Image src={coachRankCardIconPath(game, account.rank)} width={64} height={64} alt="" />;
  return <section className="account-shop">
    <header className="shop-heading"><div><p className="eyebrow">{game === "valorant" ? "VALORANT" : isTft ? "TEAMFIGHT TACTICS" : "LEAGUE OF LEGENDS"}</p><h3>{smurfs ? text("Smurf accounts", "Tài khoản Smurf") : text("Account shop", "Shop tài khoản")}</h3><p>{text("Find a profile that fits your next chapter.", "Tìm tài khoản phù hợp với hành trình tiếp theo.")}</p></div><CurrencySwitch /></header>
    <div className="shop-layout">
      <ShopDisclosure className="shop-filters" open><summary><SlidersHorizontal size={17} />{text("Filters", "Bộ lọc")}</summary><div className="shop-filter-fields">
        <ShopDisclosure className="shop-filter-group" open><summary>{text("Server", "Máy chủ")}</summary><div className="shop-radio-list"><label data-active={server === "all"}><input type="radio" name="shop-server" checked={server === "all"} onChange={() => setServer("all")} />{text("Any server", "Tất cả máy chủ")}</label>{gameRegions.map((item) => <label key={item.code} data-active={server === item.code}><input type="radio" name="shop-server" checked={server === item.code} onChange={() => setServer(item.code)} /><Image src={item.flag} width={18} height={12} alt="" /><span>{item.name}</span><small>{item.code}</small></label>)}</div></ShopDisclosure>
        <ShopDisclosure className="shop-filter-group" open><summary>{text("Price range (USD)", "Khoảng giá (USD)")}</summary><div className="shop-radio-list">{[{label: "Under $50", min: "", max: "50"}, {label: "$50–$100", min: "50", max: "100"}, {label: "$100–$200", min: "100", max: "200"}, {label: "$200–$500", min: "200", max: "500"}, {label: "$500+", min: "500", max: ""}].map((range) => <label key={range.label}><input type="radio" name="shop-price" checked={min === range.min && max === range.max} onChange={() => { setMin(range.min); setMax(range.max); }} />{range.label}</label>)}</div><div className="shop-price-fields"><NumberInput aria-label={text("Minimum price", "Giá thấp nhất")} type="number" min={0} value={min} onChange={(event) => setMin(event.target.value)} placeholder="0" /><span>–</span><NumberInput aria-label={text("Maximum price", "Giá cao nhất")} type="number" min={0} value={max} onChange={(event) => setMax(event.target.value)} placeholder={text("Any", "Bất kỳ")} /></div>
        {min && max && Number(min) > Number(max) && <p className="text-xs text-rose-400 mt-1">{text("Min price exceeds max price", "Giá tối thiểu lớn hơn giá tối đa")}</p>}
        </ShopDisclosure>
        <ShopDisclosure className="shop-filter-group" open><summary>{text("Rank", "Rank")}</summary><div className="shop-radio-list">{["Unranked", ...gameRanks[game]].map((item) => <label key={item} data-active={ranks.includes(item)}><input type="checkbox" checked={ranks.includes(item)} onChange={() => toggleRank(item)} />{item !== "Unranked" && <Image src={coachRankCardIconPath(game, item)} width={20} height={20} alt="" />}{item}</label>)}</div></ShopDisclosure>
        <ShopDisclosure className="shop-filter-group" open><summary><Users size={15} />{ownedLabel}</summary>
          <div className="shop-filter-chips">{(game === "valorant" ? [0, 10, 15, 20] : isTft ? [0, 10, 20, 30, 50] : [0, 20, 50, 100, 150]).map((count) => <button type="button" key={count} aria-pressed={championsMin === count} onClick={() => setChampionsMin(count)}>{count ? count + "+" : text("Any", "Tất cả")}</button>)}</div>
          <label className="shop-range-label">{text("Minimum count", "Số lượng tối thiểu")}<strong>{championsMin}+</strong></label><input type="range" min={0} max={game === "valorant" ? 24 : isTft ? 80 : 170} value={championsMin} aria-label={text("Minimum owned items", "Số lượng sở hữu tối thiểu")} onChange={(event) => setChampionsMin(Number(event.target.value))} />
          <label className="shop-filter-search"><Search size={15} /><input value={itemQuery} onChange={(event) => setItemQuery(event.target.value)} placeholder={text("Search " + ownedLabel.toLowerCase(), "Tìm " + ownedLabel)} /></label>
          <div className="shop-owned-list shop-radio-list">{(game === "league-of-legends" ? lolChampions.map((champion) => champion.name) : Array.from(new Set(catalog.flatMap((account) => account.items.slice(0, isTft ? 2 : 3))))).filter((name) => name.toLowerCase().includes(itemQuery.toLowerCase())).map((name) => <label key={name} data-active={ownedItems.includes(name)}><input type="checkbox" checked={ownedItems.includes(name)} onChange={() => setOwnedItems((items) => items.includes(name) ? items.filter((item) => item !== name) : [...items, name])} />{game === "league-of-legends" && <AccountImage sources={championIconSources(name)} width={24} height={24} fallbackLabel={name} />}<span>{name}</span></label>)}</div>
        </ShopDisclosure>
        <ShopDisclosure className="shop-filter-group" open><summary><Sparkles size={15} />{cosmeticLabel}</summary><div className="shop-filter-chips">{[0, 10, 30, 50, 100].map((count) => <button type="button" key={count} aria-pressed={skinsMin === count} onClick={() => { setSkinsMin(count); setCollection(false); }}>{count ? count + "+" : text("Any", "Tất cả")}</button>)}</div><label className="shop-range-label">{text("Minimum count", "Số lượng tối thiểu")}<strong>{skinsMin}+</strong></label><input type="range" min={0} max={250} value={skinsMin} aria-label={text("Minimum cosmetics", "Số vật phẩm tối thiểu")} onChange={(event) => { setSkinsMin(Number(event.target.value)); setCollection(false); }} /><label className="shop-filter-search"><Search size={15} /><input value={skinQuery} onChange={(event) => setSkinQuery(event.target.value)} placeholder={text("Search cosmetics…", "Tìm vật phẩm…")} /></label></ShopDisclosure>
        <ShopDisclosure className="shop-filter-group" open><summary><Coins size={15} />{game === "valorant" ? "Valorant Points" : "Riot Points"}</summary><div className="shop-filter-chips">{[0, 100, 300, 500, 1000].map((count) => <button type="button" key={count} aria-pressed={pointsMin === count} onClick={() => setPointsMin(count)}>{count ? count.toLocaleString() + "+" : text("Any", "Tất cả")}</button>)}</div><NumberInput type="number" min={0} value={pointsMin || ""} placeholder={text("Minimum points", "Điểm tối thiểu")} aria-label={text("Minimum points", "Điểm tối thiểu")} onChange={(event) => setPointsMin(Math.max(0, Number(event.target.value)))} /></ShopDisclosure>
        <ShopDisclosure className="shop-filter-group" open><summary><Swords size={15} />{isTft ? text("Mode", "Chế độ") : text("Role", "Vị trí")}</summary><div className="shop-filter-chips shop-role-filters"><button type="button" aria-pressed={role === "all"} onClick={() => setRole("all")}>{text("Any", "Tất cả")}</button>{(game === "valorant" ? ["Duelist", "Initiator", "Controller", "Sentinel"] : isTft ? ["Ranked", "Double Up"] : ["Top", "Jungle", "Mid", "ADC", "Support"]).map((item) => <button type="button" key={item} aria-pressed={role === item} onClick={() => setRole(role === item ? "all" : item)}>{isTft ? <Layers3 size={18} aria-hidden="true" /> : <Image src={"/images/roles/" + (game === "valorant" ? "valorant/" : "lol/") + item.toLowerCase() + (game === "valorant" ? ".png" : ".svg")} width={20} height={20} alt="" />}{item === "Mid" ? "Middle" : item === "ADC" ? "Marksman" : item}</button>)}</div></ShopDisclosure>
        <ShopDisclosure className="shop-filter-group" open><summary>{game === "valorant" ? "RR gain" : "LP gain"}</summary><div className="shop-radio-list">{[0, 37, 34, 31, 27, 23, 19, 14, 9].map((points) => <label key={points} data-active={!lowGain && lpMin === points}><input type="radio" name="shop-gain" checked={!lowGain && lpMin === points} onChange={() => { setLpMin(points); setLowGain(false); }} />{points === 0 ? text("Any gain", "Tất cả mức điểm") : points + "+ " + (game === "valorant" ? "RR" : "LP") + " / win"}</label>)}<label data-active={lowGain}><input type="radio" name="shop-gain" checked={lowGain} onChange={() => { setLpMin(0); setLowGain(true); }} />{text("Low gain (<9)", "Điểm thấp (<9)")}</label></div></ShopDisclosure>
        <button type="button" className="shop-reset" onClick={reset}>{text("Clear filters", "Xóa bộ lọc")}</button>
      </div></ShopDisclosure>
      <div className="shop-results">
        <label className="shop-search"><Search size={19} aria-hidden="true" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={text("Search champion, agent, skin or account…", "Tìm tướng, agent, skin hoặc tài khoản…")} aria-label={text("Search accounts", "Tìm tài khoản")} />{search && <button type="button" aria-label={text("Clear search", "Xóa tìm kiếm")} onClick={() => setSearch("")}><X size={16} /></button>}</label>
        <div className="shop-quick-filters"><button type="button" aria-pressed={smurfOnly} onClick={() => setSmurfOnly(!smurfOnly)}>{translateText(language, "Smurfs", "Tài khoản Smurf")}</button>{gameRegions.slice(0, 5).map((r) => <button type="button" key={r.code} aria-pressed={server === r.code} onClick={() => setServer(server === r.code ? "all" : r.code)}>{r.code}</button>)}<button type="button" aria-pressed={championsMin === ownedThreshold} onClick={() => setChampionsMin(championsMin === ownedThreshold ? 0 : ownedThreshold)}>{ownedThreshold}+ {ownedLabel}</button><button type="button" aria-pressed={collection} onClick={() => setCollection(!collection)}>30+ {cosmeticLabel}</button><button type="button" aria-pressed={pointsMin === 1} onClick={() => setPointsMin(pointsMin === 1 ? 0 : 1)}>{translateText(language, "Has", "Có")}{game === "valorant" ? "VP" : "RP"}</button><button type="button" aria-pressed={max === "50"} onClick={() => setMax(max === "50" ? "" : "50")}>{text("Under $50", "Dưới $50")}</button></div>

        {(server !== "all" || ranks.length > 0 || role !== "all" || championsMin > 0 || skinsMin > 0 || pointsMin > 0 || min || max || ownedItems.length > 0 || lowGain || (smurfOnly && !smurfs)) && (
          <div className="flex flex-wrap items-center gap-2 py-2">
            <span className="text-xs text-zinc-400 font-medium">{text("Active filters:", "Đang lọc:")}</span>
            {server !== "all" && (
              <button type="button" className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-xs text-white cursor-pointer" onClick={() => setServer("all")}>
                {server} <X size={12} />
              </button>
            )}
            {ranks.map((r) => (
              <button key={r} type="button" className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-xs text-white cursor-pointer" onClick={() => toggleRank(r)}>
                {r} <X size={12} />
              </button>
            ))}
            {role !== "all" && (
              <button type="button" className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-xs text-white cursor-pointer" onClick={() => setRole("all")}>
                {role} <X size={12} />
              </button>
            )}
            {(min || max) && (
              <button type="button" className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-xs text-white cursor-pointer" onClick={() => { setMin(""); setMax(""); }}>
                ${min || "0"} – ${max || "Any"} <X size={12} />
              </button>
            )}
            {championsMin > 0 && (
              <button type="button" className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-xs text-white cursor-pointer" onClick={() => setChampionsMin(0)}>
                {championsMin}+ {ownedLabel} <X size={12} />
              </button>
            )}
            {skinsMin > 0 && (
              <button type="button" className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-xs text-white cursor-pointer" onClick={() => setSkinsMin(0)}>
                {skinsMin}+ {cosmeticLabel} <X size={12} />
              </button>
            )}
            {ownedItems.map((item) => (
              <button key={item} type="button" className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-xs text-white cursor-pointer" onClick={() => setOwnedItems(ownedItems.filter((i) => i !== item))}>
                {item} <X size={12} />
              </button>
            ))}
            <button type="button" className="text-xs text-amber-400 hover:underline cursor-pointer ml-1" onClick={reset}>
              {text("Clear all", "Xóa tất cả")}
            </button>
          </div>
        )}

        <div className="shop-results-toolbar"><span aria-live="polite">{results.length} {text("accounts", "tài khoản")}</span><label>{text("Sort", "Sắp xếp")}<select value={sort} onChange={(event) => setSort(event.target.value)}><option value="featured">{text("Featured", "Nổi bật")}</option><option value="price-low">{text("Price: low to high", "Giá tăng dần")}</option><option value="price-high">{text("Price: high to low", "Giá giảm dần")}</option><option value="skins">{text("Most skins", "Nhiều skin nhất")}</option></select></label></div>
        <div className="shop-card-grid">{results.slice(0, limit).map((account) => {
          const region = gameRegions.find((item) => item.code === account.server);
          const isFavorite = favorites.includes(account.id);
          return <article key={account.id} className="shop-account-card relative" role="link" tabIndex={0} aria-label={text("Open account details", "Mở chi tiết tài khoản") + ": " + account.title} onClick={(event) => { if ((event.target as HTMLElement).closest("a,button")) return; router.push(`/account/${encodeURIComponent(account.id)}`); }} onKeyDown={(event) => { if (event.target !== event.currentTarget) return; if (event.key === "Enter" || event.key === " ") { event.preventDefault(); router.push(`/account/${encodeURIComponent(account.id)}`); } }}>
            <button
              type="button"
              className="absolute top-3 right-3 z-20 p-2 rounded-full bg-black/50 hover:bg-black/80 backdrop-blur-md text-white transition-all cursor-pointer border border-white/10"
              aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
              onClick={(e) => {
                e.stopPropagation();
                toggleFavorite(account.id);
              }}
            >
              <Heart size={16} className={isFavorite ? "fill-rose-500 text-rose-500" : "text-zinc-300"} />
            </button>
            <Link href={`/account/${encodeURIComponent(account.id)}`} className="shop-card-art" aria-label={text("View account details", "Xem chi tiết tài khoản") + ": " + account.title}>
              <span className="shop-card-art-image" aria-hidden="true"><AccountImage sources={artwork(account)} fill sizes="(max-width:767px) 90vw, 30vw" fallbackLabel={account.items[0]} /></span>
              <span className="shop-card-rank-overlay">
                <span className="shop-crest">{rankBadge(account)}</span>
                <span className="shop-card-rank-copy"><small>{account.server} · {game === "valorant" ? "COMPETITIVE" : isTft ? "RANKED" : "SOLO"}</small><strong>{account.rank} {account.division}</strong></span>
              </span>
            </Link>
            <div className="shop-card-body">
              <p className="shop-card-server">{region && <Image src={region.flag} width={22} height={15} alt="" />}{account.server}<span>Lv. {account.level}</span></p>
              <h4>{account.title}</h4>
              <dl className="shop-account-stats">
                <div><dt><Users size={12} />{ownedLabel}</dt><dd>{account.champions}</dd></div>
                <div><dt><Sparkles size={12} />{cosmeticLabel}</dt><dd>{account.skins}</dd></div>
                {game === "league-of-legends" && <div><dt><Coins size={12} />BE</dt><dd>{account.essence.toLocaleString()}</dd></div>}
                <div><dt>{game === "valorant" ? "VP" : "RP"}</dt><dd>{account.points}</dd></div>
                {account.lpGain > 0 && <div><dt>{game === "valorant" ? "RR/win" : "LP/win"}</dt><dd>+{account.lpGain}</dd></div>}
              </dl>
              <p className="shop-card-items">{account.items.slice(0, 3).join(" · ")}</p>
              <div className="shop-card-bottom">
                <div><small>{text("Price", "Giá")}</small><ShopPrice usd={account.price} /></div>
                <Link href={`/account/${encodeURIComponent(account.id)}`} aria-label={text("View details", "Xem chi tiết") + ": " + account.title}>{text("Details", "Chi tiết")}<ArrowRight size={16} /></Link>
              </div>
            </div>
          </article>;
        })}</div>
        {results.length > limit && (
          <div className="flex justify-center mt-8">
            <button
              type="button"
              className="px-6 py-2.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-sm font-semibold text-white transition-all cursor-pointer"
              onClick={() => setLimit((prev) => prev + 12)}
            >
              {text("Load more accounts", "Xem thêm tài khoản")} ({results.length - limit} {text("remaining", "còn lại")})
            </button>
          </div>
        )}
        {!results.length && <div className="shop-empty"><Search size={30} /><h4>{text("No matching accounts", "Không tìm thấy tài khoản phù hợp")}</h4><p>{text("Try another server, rank or price range.", "Thử máy chủ, rank hoặc khoảng giá khác.")}</p><button type="button" className="shop-reset" onClick={reset}>{text("Clear filters", "Xóa bộ lọc")}</button></div>}
      </div>
    </div>
  </section>;
}
