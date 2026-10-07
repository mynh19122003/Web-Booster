"use client";

import { boosters } from "@/data/boosters";
import { useLanguage } from "@/components/ui/LanguageProvider";
import { ArrowUpRight, ShieldCheck } from "lucide-react";
import Link from "next/link";
export function BoosterSection() {
  const { t } = useLanguage();
  return (
    <section className="section" id="pros">
      <div className="site-container">
        <div className="section-heading" data-reveal>
          <div>
            <p className="eyebrow text-[#FF9F3C]">{t("verifiedTalent")}</p>
            <h2>{t("meetPros")}</h2>
          </div>
          <p>
            {t("prosDescription")}
          </p>
        </div>
        <div className="booster-grid">
          {boosters.map((b, i) => (
            <article
              className="player-card"
              style={{ "--player-color": b.color } as React.CSSProperties}
              key={b.name}
            >
              <div className="player-art">
                <span className="player-rank">
                  <ShieldCheck size={13} />
                  {b.rank}
                </span>
                <div className={`player-silhouette player-${i}`}>
                  <div className="player-head" />
                  <div className="player-body" />
                </div>
                <span className="player-watermark">{b.name}</span>
                <span className="player-online">
                  <span className="status-dot" /> {t("onlineAvailable")}
                </span>
              </div>
              <div className="player-info">
                <h3>
                  {b.name}
                  <ShieldCheck size={18} />
                </h3>
                <p>{b.game}</p>
                <div className="player-stats">
                  <div>
                    <strong>{b.win}</strong>
                    <small>{t("winRate")}</small>
                  </div>
                  <div>
                    <strong>{b.orders}</strong>
                    <small>{t("ordersLabel")}</small>
                  </div>
                  <div>
                    <strong>{b.rating}</strong>
                    <small>{t("rating")}</small>
                  </div>
                </div>
                <Link href="/#services" className="text-link">
                  {t("buildAPlan")} <ArrowUpRight size={16} />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
