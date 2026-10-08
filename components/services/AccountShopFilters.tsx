"use client";
import { translateText } from "@/lib/i18n";

import Image from "next/image";
import { useId, useState } from "react";
import { Coins, Search, Sparkles, Swords, Users } from "lucide-react";
import type { ShopAccount } from "@/data/shop-accounts";
import { regions } from "@/data/regions";
import { gameRanks } from "@/lib/service-options";
import { coachRankCardIconPath } from "@/data/coaches";
import type { AccountFilters } from "@/lib/account-shop";
import { useLanguage } from "@/components/ui/LanguageProvider";
import { NumberInput } from "@/components/ui/NumberInput";
import { ShopDisclosure } from "./ShopDisclosure";
import { AccountImage } from "@/components/account/AccountImage";
import { championIconSources } from "@/lib/account-artwork";

type Champion = { id: string; name: string };
type Props = {
  game: string;
  catalog: ShopAccount[];
  champions: Champion[];
  filters: AccountFilters;
  change: (patch: Partial<AccountFilters>) => void;
};

export function AccountShopFilters({ game, catalog, champions, filters: f, change }: Props) {
  const { language } = useLanguage();
  const text = (en: string, vi: string) => translateText(language, en, vi);
  const groupId = useId();
  const [itemQuery, setItemQuery] = useState("");
  const [list, setList] = useState({ query: "", limit: 40 });
  const isLol = game === "league-of-legends";
  const isTft = game === "teamfight-tactics";
  const ownedLabel = isLol ? text("Champions", "Tướng") : isTft ? "Little Legends" : "Agents";
  const cosmeticLabel = isTft ? text("Arenas", "Sàn đấu") : text("Skins", "Trang phục");
  const currencyPoints = game === "valorant" ? "VP" : "RP";
  const availableItems = isLol ? champions : Array.from(new Set(catalog.flatMap(account => account.items.slice(0, isTft ? 2 : 3)))).map(name => ({ id: name, name }));
  const matchedItems = availableItems.filter(item => item.name.toLowerCase().includes(itemQuery.trim().toLowerCase()));
  const limit = list.query === itemQuery ? list.limit : 40;
  const roles = isLol ? ["Top", "Jungle", "Mid", "ADC", "Support"] : isTft ? ["Ranked", "Double Up"] : ["Duelist", "Initiator", "Controller", "Sentinel"];
  const maxOwned = isLol ? Math.max(170, champions.length) : isTft ? 80 : 24;
  const toggleRank = (rank: string) => change({ ranks: f.ranks.includes(rank) ? f.ranks.filter(value => value !== rank) : [...f.ranks, rank] });

  return <div className="shop-filter-fields">
    <ShopDisclosure className="shop-filter-group" open>
      <summary>{text("Server", "Máy chủ")}</summary>
      <div className="shop-radio-list">
        <label data-active={f.server === "all"}><input type="radio" name={`${groupId}-server`} checked={f.server === "all"} onChange={() => change({ server: "all" })} />{text("Any server", "Tất cả máy chủ")}<small>{catalog.length}</small></label>
        {regions.map(region => <label key={region.code} data-active={f.server === region.code}>
          <input type="radio" name={`${groupId}-server`} checked={f.server === region.code} onChange={() => change({ server: region.code })} />
          <Image src={region.flag} width={18} height={12} alt="" /><span>{region.code}</span><small>{catalog.filter(account => account.server === region.code).length}</small>
        </label>)}
      </div>
    </ShopDisclosure>
    <ShopDisclosure className="shop-filter-group" open>
      <summary>{text("Price range (USD)", "Khoảng giá (USD)")}</summary>
      <div className="shop-price-fields">
        <NumberInput min={0} step="any" value={f.min} onChange={event => change({ min: event.target.value })} placeholder="0" aria-label={text("Minimum price in USD", "Giá thấp nhất bằng USD")} />
        <span>–</span>
        <NumberInput min={0} step="any" value={f.max} onChange={event => change({ max: event.target.value })} placeholder={text("Any", "Bất kỳ")} aria-label={text("Maximum price in USD", "Giá cao nhất bằng USD")} />
      </div>
      {f.min && f.max && Number(f.min) > Number(f.max) && <p className="shop-filter-warning" role="status">{text("Minimum price exceeds maximum price.", "Giá tối thiểu đang lớn hơn giá tối đa.")}</p>}
      <div className="shop-radio-list">
        {[{ label: text("Any price", "Tất cả mức giá"), min: "", max: "" }, { label: text("Under $50", "Dưới $50"), min: "", max: "50" }, { label: "$50–$100", min: "50", max: "100" }, { label: "$100–$200", min: "100", max: "200" }, { label: "$200–$500", min: "200", max: "500" }, { label: "$500+", min: "500", max: "" }].map(range => <label key={range.label} data-active={f.min === range.min && f.max === range.max}>
          <input type="radio" name={`${groupId}-price`} checked={f.min === range.min && f.max === range.max} onChange={() => change({ min: range.min, max: range.max })} />{range.label}
        </label>)}
      </div>
    </ShopDisclosure>
    <ShopDisclosure className="shop-filter-group" open>
      <summary>{text("Rank", "Xếp hạng")}{f.ranks.length > 0 && <span className="shop-filter-count">{f.ranks.length}</span>}</summary>
      <div className="shop-radio-list">{["Unranked", ...(gameRanks[game] ?? [])].map(rank => <label key={rank} data-active={f.ranks.includes(rank)}>
        <input type="checkbox" checked={f.ranks.includes(rank)} onChange={() => toggleRank(rank)} />
        {rank !== "Unranked" && <Image src={coachRankCardIconPath(game, rank)} width={24} height={24} alt="" />}
        <span>{rank === "Unranked" ? text("Unranked", "Chưa xếp hạng") : rank}</span>
      </label>)}</div>
    </ShopDisclosure>
    <ShopDisclosure className="shop-filter-group" open>
      <summary><Users size={15} />{ownedLabel}</summary>
      <div className="shop-filter-chips">{(isLol ? [0, 50, 100, 150] : isTft ? [0, 10, 30, 50] : [0, 10, 15, 20]).map(count => <button type="button" key={count} aria-pressed={f.championsMin === count} onClick={() => change({ championsMin: count })}>{count ? count + "+" : text("Any", "Tất cả")}</button>)}</div>
      <div className="shop-range-label"><span>{text("Minimum count", "Số lượng tối thiểu")}</span><strong>{f.championsMin}+</strong></div>
      <input type="range" min={0} max={maxOwned} value={f.championsMin} onChange={event => change({ championsMin: Number(event.target.value) })} aria-label={text("Minimum owned items", "Số lượng sở hữu tối thiểu")} />
      <label className="shop-filter-search"><Search size={15} /><input value={itemQuery} onChange={event => setItemQuery(event.target.value)} placeholder={text("Search " + ownedLabel.toLowerCase(), "Tìm " + ownedLabel.toLowerCase())} aria-label={text("Search " + ownedLabel.toLowerCase(), "Tìm " + ownedLabel.toLowerCase())} /></label>
      <div className="shop-owned-list shop-radio-list">
        {matchedItems.slice(0, limit).map(item => <label key={item.id} data-active={f.ownedItems.includes(item.name)}>
          <input type="checkbox" checked={f.ownedItems.includes(item.name)} onChange={() => change({ ownedItems: f.ownedItems.includes(item.name) ? f.ownedItems.filter(name => name !== item.name) : [...f.ownedItems, item.name] })} />
          {isLol && <AccountImage sources={championIconSources(item.name, item.id)} width={24} height={24} fallbackLabel={item.name} />}<span>{item.name}</span>
        </label>)}
        {!matchedItems.length && <p className="shop-filter-empty">{text("No matches", "Không tìm thấy")}</p>}
      </div>
      {matchedItems.length > limit && <button className="shop-show-more" type="button" onClick={() => setList({ query: itemQuery, limit: limit + 40 })}>{text("Show more", "Xem thêm")} <small>({matchedItems.length - limit})</small></button>}
    </ShopDisclosure>
    <ShopDisclosure className="shop-filter-group">
      <summary><Sparkles size={15} />{cosmeticLabel}</summary>
      <div className="shop-filter-chips">{[0, 10, 30, 50, 100].map(count => <button type="button" key={count} aria-pressed={f.skinsMin === count} onClick={() => change({ skinsMin: count })}>{count ? count + "+" : text("Any", "Tất cả")}</button>)}</div>
      <div className="shop-range-label"><span>{text("Minimum count", "Số lượng tối thiểu")}</span><strong>{f.skinsMin}+</strong></div>
      <input type="range" min={0} max={250} value={f.skinsMin} onChange={event => change({ skinsMin: Number(event.target.value) })} aria-label={text("Minimum cosmetics", "Số vật phẩm tối thiểu")} />
      <label className="shop-filter-search"><Search size={15} /><input value={f.skinQuery} onChange={event => change({ skinQuery: event.target.value })} placeholder={text("Search cosmetics…", "Tìm trang phục, vật phẩm…")} aria-label={text("Search cosmetics", "Tìm trang phục, vật phẩm")} /></label>
    </ShopDisclosure>
    <ShopDisclosure className="shop-filter-group">
      <summary><Coins size={15} />{currencyPoints}</summary>
      <div className="shop-filter-chips">{[0, 100, 500, 1000].map(count => <button type="button" key={count} aria-pressed={f.pointsMin === count} onClick={() => change({ pointsMin: count })}>{count ? count.toLocaleString() + "+" : text("Any", "Tất cả")}</button>)}</div>
      <NumberInput min={0} step={1} value={f.pointsMin || ""} onChange={event => change({ pointsMin: Math.max(0, Math.floor(Number(event.target.value))) })} placeholder={text("Minimum points", "Điểm tối thiểu")} aria-label={text("Minimum points", "Điểm tối thiểu")} />
    </ShopDisclosure>
    <ShopDisclosure className="shop-filter-group">
      <summary><Swords size={15} />{isTft ? text("Mode", "Chế độ") : text("Role", "Vị trí")}</summary>
      <div className="shop-filter-chips"><button type="button" aria-pressed={f.role === "all"} onClick={() => change({ role: "all" })}>{text("Any", "Tất cả")}</button>{roles.map(role => <button type="button" key={role} aria-pressed={f.role === role} onClick={() => change({ role: f.role === role ? "all" : role })}>{role}</button>)}</div>
    </ShopDisclosure>
    <ShopDisclosure className="shop-filter-group">
      <summary>{game === "valorant" ? text("RR per win", "RR mỗi trận thắng") : text("LP per win", "LP mỗi trận thắng")}</summary>
      <div className="shop-radio-list">{[0, 37, 34, 31, 27, 23, 19, 14, 9].map(points => <label key={points} data-active={!f.lowGain && f.lpMin === points}>
        <input type="radio" name={`${groupId}-gain`} checked={!f.lowGain && f.lpMin === points} onChange={() => change({ lpMin: points, lowGain: false })} />{points ? `${points}+ ${game === "valorant" ? "RR" : "LP"}` : text("Any gain", "Tất cả mức điểm")}
      </label>)}<label data-active={f.lowGain}><input type="radio" name={`${groupId}-gain`} checked={f.lowGain} onChange={() => change({ lpMin: 0, lowGain: true })} />{text("Low gain (<9)", "Điểm thấp (<9)")}</label></div>
    </ShopDisclosure>
  </div>;
}
