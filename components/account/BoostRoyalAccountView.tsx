"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, ChevronDown, Coins, Globe, Mail, ShieldCheck, ShoppingCart, Sparkles, Users, Zap } from "lucide-react";
import type { ShopAccount } from "@/data/shop-accounts";
import { coachRankCardIconPath } from "@/data/coaches";
import { AccountInventory } from "./AccountInventory";
import { AccountCosmetics } from "./AccountCosmetics";
import { accountArtworkSources, accountArtworkLabel } from "@/lib/account-artwork";
import { AccountImage } from "./AccountImage";
import { ShopPrice } from "@/components/services/ShopPrice";
import { CurrencySwitch } from "@/components/ui/Currency";
import { useStore } from "@/store/useStore";

export function BoostRoyalAccountView({ account }: { account: ShopAccount }) {
  const s = useStore();
  const searchParams = useSearchParams();
  const game = account.game === "league-of-legends" ? "League of Legends" : account.game === "valorant" ? "VALORANT" : "Teamfight Tactics";
  const label = account.game === "league-of-legends" ? "Champions" : account.game === "valorant" ? "Agents" : "Little Legends";
  const items = account.ownedChampions?.length ? account.ownedChampions : account.items.filter((item) => !account.cosmetics.includes(item));
  const heroSources = account.game === "league-of-legends" ? accountArtworkSources(account.game, account.items[0] ?? "Ahri") : [`/images/games/${account.game}.webp`];
  const topSkins = [...new Set(account.cosmetics)].slice(0, 3);
  const rankIcon = account.rank === "Unranked" ? null : coachRankCardIconPath(account.game, account.rank);
  const titleRank = `${account.rank}${account.division ? ` ${account.division}` : ""}`;

  const buyAccount = () => {
    s.set({
      game: account.game,
      product: "accounts",
      service: "account-purchase",
      units: 1,
      quoteOverride: account.price,
      quoteAddOns: [],
      checkoutDetails: {
        name: `Account #${account.id} · ${titleRank}`,
        from: account.server,
        to: `${titleRank} (${account.title})`,
        quoteRequired: false,
      },
      accountPurchase: {
        accountId: account.id,
        title: account.title,
        game: account.game,
        price: account.price,
        server: account.server,
        rank: titleRank,
        division: account.division,
        level: account.level,
      },
      modal: "checkout",
    });
  };

  useEffect(() => {
    if (searchParams.get("buy") === "1") {
      buyAccount();
    }
  }, [searchParams]);

  const currencyOne = account.game === "valorant" ? "RADIANITE" : account.game === "teamfight-tactics" ? "REALM CRYSTALS" : "BLUE ESSENCE";
  const currencyOneVal = account.game === "valorant" ? "120" : account.game === "teamfight-tactics" ? "800" : account.essence.toLocaleString();
  const currencyTwo = account.game === "valorant" ? "VALORANT POINTS" : "RIOT POINTS";
  const gainNote = account.game === "valorant" ? `~${account.lpGain}+ RR Gain` : account.game === "teamfight-tactics" ? "Top 4 Rate 65%+" : `~${account.lpGain}+ LP Gain`;

  return <main className="br-account-page" id="main">
    <div className="br-account-wrap">
      <Link className="br-back" href={`/games/${account.game}?category=accounts`}><ArrowLeft size={15} /> Back to Catalog</Link>
      <div className="br-account-layout">
        <div className="br-account-main">
          <section className="br-profile-hero">
            <div className="br-profile-art" aria-hidden="true"><AccountImage sources={heroSources} fill className="br-hero-image" sizes="(max-width:800px) 100vw, 70vw" fallbackLabel={account.items[0]} /><span className="br-profile-art-shade" /></div>
            <div className="br-badges"><span>{account.server}</span><span><i /> AVAILABLE NOW</span></div><small className="br-listing-id">Account #{account.id}</small>
            <div className="br-profile-title"><span className="br-profile-emblem">{rankIcon ? <Image src={rankIcon} alt="" width={62} height={62} /> : <ShoppingCart size={30} />}</span><div><h1>{titleRank}</h1><p>{game} account · <b>{account.server} server</b></p><span className="br-account-subtitle">{account.title} <span>·</span> Level {account.level}</span></div></div>
            <div className="br-stat-row"><div><Users /><b>{account.champions}</b><small>{label.toUpperCase()}</small></div><div><Sparkles /><b>{account.skins}</b><small>{account.game === "teamfight-tactics" ? "ARENAS" : "SKINS"}</small></div><div><Zap /><b>{currencyOneVal}</b><small>{currencyOne}</small></div><div><Coins /><b>{account.points.toLocaleString()}</b><small>{currencyTwo}</small></div></div>
            <div className="br-rank-history"><div>{rankIcon ? <Image src={rankIcon} alt="" width={36} height={36} /> : <ShieldCheck size={25} />}<span><small>CURRENT RANK</small><b>{titleRank}</b></span></div><div><Users size={25} /><span><small>ACCOUNT LEVEL</small><b>Level {account.level}</b></span></div><div><Globe size={25} /><span><small>REGION</small><b>{account.server}</b></span></div></div>
            {topSkins.length > 0 && <div className="br-top-skins"><div className="br-preview-heading"><small>FEATURED SKINS</small><a href="#account-skins">View listed skins <ArrowRight size={13} /></a></div><div>{topSkins.map((skin) => {
              const sources = accountArtworkSources(account.game, skin);
              return <article key={skin}><AccountImage sources={sources} fill className="br-artwork-image" sizes="(max-width:540px) 45vw, 30vw" fallbackLabel={skin} /><div><b>{skin}</b>{sources.length > 0 && <small>{accountArtworkLabel(account.game, skin)}</small>}</div></article>;
            })}</div></div>}
          </section>
          <section className="br-seller">
            <div className="br-seller-avatar">🐾<i /></div><div className="br-seller-content"><div className="br-seller-heading"><span>LISTED BY</span><b>ASCEND Verified</b><em><Check size={11} /> Verified Seller</em></div><small>259+ completed account orders</small><div className="br-seller-note"><small>SELLER NOTE</small><p>🔥 {gainNote}&nbsp; 🔥 Lifetime warranty ✅ Full e-mail access ✅ Professional support team ✅ Instant credentials delivery ✅</p></div></div>
          </section>
          <div id="account-skins"><AccountCosmetics game={account.game} skins={account.cosmetics} total={account.skins} /></div>
          <AccountInventory game={account.game} items={items} label={label} />
        </div>
        <aside className="br-order-column">
          <section className="br-order-card"><div className="br-order-inner">
            <div className="br-order-heading"><div><small>ORDER SUMMARY</small><h2>Ready to order</h2></div><span><Zap size={12} /> INSTANT</span></div>
            <div className="br-order-product"><span className="br-order-product-icon">{rankIcon ? <Image src={rankIcon} alt="" width={40} height={40} /> : <ShoppingCart size={24} />}</span><div><b>{titleRank} · {account.server}</b><span>{game} · Level {account.level}</span><small>Account #{account.id}</small></div></div>
            <div className="br-order-total"><div className="br-total-label"><small>TOTAL</small><CurrencySwitch compact /></div><ShopPrice usd={account.price} /></div>
            <div className="br-order-perks"><div><Zap />Instant delivery<b><Check /> Included</b></div><div><ShieldCheck />Lifetime warranty<b><Check /> Included</b></div><div><Mail />Full email access<b><Check /> Included</b></div></div>
            <button type="button" className="br-buy-button w-full cursor-pointer" onClick={buyAccount}><ShoppingCart size={18} /> Buy Account Now <ArrowRight size={17} /></button>
            <div className="br-checkout-trust"><span><Zap /> Fast checkout</span><i /> <span><ShieldCheck /> Verified sellers</span><span className="br-money-back">↶ &nbsp;Money-back guarantee</span></div>
          </div></section>
          <details className="br-shield"><summary><ShieldCheck /><span><small>ASCEND SHIELD™</small><b>How we protect your purchase</b></span><ChevronDown className="br-shield-chevron" size={16} /></summary><p>Every listing is verified and includes full email access, delivery support, and purchase protection.</p></details>
        </aside>
      </div>
    </div>
  </main>;
}
