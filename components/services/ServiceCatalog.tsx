"use client";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  Trophy,
  Users,
  GraduationCap,
  Target,
} from "lucide-react";
import { games } from "@/data/games";
import { useStore } from "@/store/useStore";
import { servicesFor } from "@/lib/service-options";
import type { ServiceSlug } from "@/lib/service-options";
import { serviceCopyFor } from "@/data/service-copy";
import { useLanguage } from "@/components/ui/LanguageProvider";
const icons = {
  "rank-boost": Trophy,
  "duo-boost": Users,
  coaching: GraduationCap,
  placements: Target,
};
export function ServiceCatalog() {
  const { language, t } = useLanguage();
  const game = useStore((s) => s.game);
  const set = useStore((s) => s.set);
  const selected = games.find((g) => g.slug === game) ?? games[0];
  return (
    <section className="section catalog-section">
      <div className="container">
        <div
          className="catalog-tabs"
          role="group"
          aria-label={t("chooseYourGame")}
        >
          {games.map((g) => (
            <button
              key={g.slug}
              aria-pressed={game === g.slug}
              onClick={() => set({ game: g.slug, product: null, checkoutDetails: null, quoteOverride: null })}
            >
              {g.name}
            </button>
          ))}
        </div>
        <div className="catalog-banner">
          <Image
            src={selected.image}
            alt={`${selected.name} artwork`}
            width={1920}
            height={1080}
            unoptimized
            sizes="100vw"
          />
          <h2>{selected.name}</h2>
        </div>
        <div className="catalog-grid">
          {servicesFor(game).map((s) => {
            const Icon = icons[s.slug as keyof typeof icons];
            const copy = serviceCopyFor(language, s.slug as ServiceSlug);
            return (
              <article className="catalog-item" key={s.slug}>
                <Icon size={25} />
                <h3>{copy.name}</h3>
                <p>{copy.description}</p>
                <Link
                  className="text-link"
                  href={`/services/${s.slug}?game=${game}#configure`}
                >
                  {t("configureService")} <ArrowUpRight size={17} />
                </Link>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
