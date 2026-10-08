import { UiText } from "@/components/ui/UiText";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  Clock3,
  Crown,
  Gamepad2,
  Heart,
  MailCheck,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Star,
  Trophy,
} from "lucide-react";

export const metadata: Metadata = {
  title: "League of Legends Account #109084",
  description: "View the rank, champion pool, skins and seller details for League of Legends account #109084.",
};

const champions = [
  "Lee Sin", "Annie", "Xin Zhao", "Master Yi", "Kindred", "Ezreal", "Nunu & Willump", "Miss Fortune", "Garen", "Ashe",
  "Tryndamere", "Riven", "Thresh", "Amumu", "Kog'Maw", "Anivia", "Lux", "Ahri", "Samira", "Lillia", "Sejuani", "Ziggs",
  "Caitlyn", "Ekko", "Nocturne", "Darius", "Jarvan IV", "Vi", "Brand",
];

const skins = ["Victorious Tryndamere", "Victorious Kog'Maw", "Victorious Anivia"];

function RankCard({ rank, label, image, tone }: { rank: string; label: string; image: string; tone: string }) {
  return (
    <article className={`account-rank-card ${tone}`}>
      <div className="account-rank-icon"><Image src={image} alt={`${rank} rank emblem`} width={84} height={84} /></div>
      <div><span>{label}</span><strong>{rank}</strong></div>
      <span className="account-rank-mark"><Check size={14} /></span>
    </article>
  );
}

export default function AccountPage() {
  return (
    <main className="account-detail" id="main">
      <div className="account-detail-wrap">
        <div className="account-breadcrumbs"><Link href="/services"><ArrowLeft size={15} /><UiText english={"Browse services"} /></Link><span>/</span><span><UiText english={"League of Legends accounts"} /></span><span>/</span><strong>#109084</strong></div>

        <section className="account-hero">
          <div className="account-hero-copy">
            <div className="account-kicker"><span className="account-live-dot" /><UiText english={"VERIFIED ACCOUNT"} /><span className="account-kicker-divider" /><UiText english={"LISTING #109084"} /></div>
            <h1><UiText english={"Built for your"} /><span><UiText english={"next climb."} /></span></h1>
            <p className="account-hero-desc"><UiText english={"A ready-to-play League account with a strong ranked history, a versatile champion pool, and room to make it yours."} /></p>
            <div className="account-hero-tags"><span><ShieldCheck size={15} /><UiText english={"Lifetime warranty"} /></span><span><MailCheck size={15} /><UiText english={"Full email access"} /></span><span><Clock3 size={15} /><UiText english={"Instant delivery"} /></span></div>
          </div>
          <div className="account-hero-art" aria-label="League of Legends account overview">
            <div className="account-art-glow" />
            <Image className="account-game-mark" src="/images/logos/league-of-legends-mark.svg" alt="League of Legends" width={160} height={160} priority />
            <div className="account-art-caption"><span><UiText english={"SUMMONER PROFILE"} /></span><strong>League of Legends</strong></div>
            <div className="account-art-chip"><Sparkles size={14} /><UiText english={"Season ready"} /></div>
          </div>
        </section>

        <div className="account-main-grid">
          <div className="account-detail-column">
            <section className="account-section account-ranks-section">
              <div className="account-section-heading"><div><span className="account-section-index"><UiText english={"01 / COMPETITIVE PROFILE"} /></span><h2><UiText english={"Ranked at a glance"} /></h2></div><span className="account-season-chip"><span /><UiText english={"Season verified"} /></span></div>
              <div className="account-rank-grid">
                <RankCard rank="Emerald" label="Last season" image="/images/ranks/league/emerald.png" tone="emerald" />
                <RankCard rank="Diamond" label="Solo · 5v5" image="/images/ranks/league/diamond.png" tone="diamond" />
                <RankCard rank="Unranked" label="Flex · 5v5" image="/images/ranks/league/iron.png" tone="unranked" />
              </div>
            </section>

            <section className="account-section">
              <div className="account-section-heading"><div><span className="account-section-index"><UiText english={"02 / CHAMPION POOL"} /></span><h2><UiText english={"29 champions unlocked"} /></h2></div><span className="account-count-pill"><Gamepad2 size={15} /><UiText english={"29 champions"} /></span></div>
              <div className="account-champion-grid">{champions.map((champion, i) => <div className="account-champion" key={champion}><span className="account-champion-avatar">{champion.split(/\s|&/).filter(Boolean).map((part) => part[0]).slice(0, 2).join("")}</span><span>{champion}</span><small>{String(i + 1).padStart(2, "0")}</small></div>)}</div>
            </section>

            <section className="account-section account-skins-section">
              <div className="account-section-heading"><div><span className="account-section-index"><UiText english={"03 / EXCLUSIVE COSMETICS"} /></span><h2><UiText english={"Victorious collection"} /></h2></div><span className="account-count-pill"><Sparkles size={15} /><UiText english={"3 skins"} /></span></div>
              <div className="account-skin-list">{skins.map((skin, i) => <div className="account-skin" key={skin}><div className={`account-skin-emblem skin-${i + 1}`}><Crown size={18} /></div><div><strong>{skin}</strong><span><UiText english={"Victorious series"} /></span></div><span className="account-skin-check"><Check size={14} /></span></div>)}</div>
            </section>
          </div>

          <aside className="account-purchase-column">
            <section className="account-purchase-card">
              <div className="account-seller"><div className="account-seller-mark"><Sparkles size={20} /></div><div><strong><UiText english={"ASCEND MARKETPLACE"} /></strong><span><UiText english={"Trusted gaming accounts"} /></span></div><span className="account-verified"><Check size={12} /></span></div>
              <div className="account-seller-rating"><strong>4.9</strong><span className="account-stars" aria-label="4.9 out of 5 stars"><Star /><Star /><Star /><Star /><Star /></span><span><UiText english={"from 251 sales"} /></span></div>
              <div className="account-purchase-divider" />
              <div className="account-price-label"><UiText english={"ACCOUNT PRICE"} /><span><UiText english={"ONE-TIME PAYMENT"} /></span></div>
              <div className="account-price"><span>$</span>34<span className="account-price-cents">.99</span></div>
              <p className="account-price-note"><UiText english={"Secure checkout · No hidden fees"} /></p>
              <Link href="/login" className="account-buy-button"><UiText english={"Get this account"} /><ShoppingCart size={17} /></Link>
              <div className="account-instant"><span className="account-instant-dot" /><UiText english={"Ready for instant delivery"} /></div>
              <div className="account-perks"><div><ShieldCheck size={17} /><span><strong><UiText english={"Lifetime warranty"} /></strong><small><UiText english={"Purchase protected from day one"} /></small></span><Check size={14} /></div><div><MailCheck size={17} /><span><strong><UiText english={"Full email access"} /></strong><small><UiText english={"Change credentials after delivery"} /></small></span><Check size={14} /></div><div><Trophy size={17} /><span><strong><UiText english={"Hand-checked listing"} /></strong><small><UiText english={"Details reviewed before listing"} /></small></span><Check size={14} /></div></div>
              <div className="account-safe-checkout"><ShieldCheck size={14} /><UiText english={"Protected, encrypted checkout"} /></div>
            </section>
            <div className="account-help-card"><div className="account-help-icon"><Heart size={17} /></div><div><strong><UiText english={"Need a hand?"} /></strong><span><UiText english={"Our team is here around the clock."} /></span></div><Link href="/contact" aria-label="Contact support"><ArrowUpRight size={16} /></Link></div>
            <div className="account-listing-note"><UiText english={"Listing details are supplied for preview."} /><Link href="/contact"><UiText english={"Ask us anything"} /><ArrowUpRight size={12} /></Link></div>
          </aside>
        </div>
      </div>
    </main>
  );
}
