"use client";

import { NumberInput } from "@/components/ui/NumberInput";

import Link from "next/link";
import Image from "next/image";
import { useMemo, useState } from "react";
import { ArrowUpRight, Heart, Search, ShieldCheck, Star, X } from "lucide-react";
import { coachGameLogoPath, coachRankCardIconPath, coaches } from "@/data/coaches";
import { useLanguage } from "@/components/ui/LanguageProvider";
import { useMoney } from "@/components/ui/Currency";

const games = [
  { slug: "all", label: "filterAllGames" },
  { slug: "league-of-legends", label: "League of Legends" },
  { slug: "valorant", label: "Valorant" },
  { slug: "teamfight-tactics", label: "Teamfight Tactics" },
] as const;

export function CoachDirectory({ gameSlug }: { gameSlug?: string }) {
  const { t } = useLanguage();
  const money = useMoney();
  const [search, setSearch] = useState("");
  const [selectedGame, setSelectedGame] = useState(gameSlug ?? "all");
  const [onlineOnly, setOnlineOnly] = useState(false);
  const [hundredReviewsOnly, setHundredReviewsOnly] = useState(false);
  const [mvpOnly, setMvpOnly] = useState(false);
  const [topRatedOnly, setTopRatedOnly] = useState(false);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [priceBand, setPriceBand] = useState("all");
  const [minRate, setMinRate] = useState("");
  const [maxRate, setMaxRate] = useState("");
  const [language, setLanguage] = useState("all");
  const [role, setRole] = useState("all");
  const [peakRanks, setPeakRanks] = useState<string[]>([]);
  const [server, setServer] = useState("all");
  const [sessionFormat, setSessionFormat] = useState("all");
  const [sortBy, setSortBy] = useState("top");

  const gameCoaches = useMemo(() => selectedGame === "all" ? coaches : coaches.filter((coach) => coach.game === selectedGame), [selectedGame]);
  const languages = useMemo(() => [...new Set(gameCoaches.flatMap((coach) => coach.languages))].sort(), [gameCoaches]);
  const roles = useMemo(() => [...new Set(gameCoaches.flatMap((coach) => coach.roles))].sort(), [gameCoaches]);
  const ranks = useMemo(() => [...new Set(gameCoaches.map((coach) => coach.peakRank))].sort().map((rank) => ({ rank, count: gameCoaches.filter((coach) => coach.peakRank === rank).length })), [gameCoaches]);
  const servers = useMemo(() => [...new Set(gameCoaches.map((coach) => coach.server))].sort(), [gameCoaches]);

  function chooseGame(game: string) {
    setSelectedGame(game);
    setPeakRanks([]);
    setRole("all");
    setLanguage("all");
    setServer("all");
  }

  const filtered = useMemo(() => coaches.filter((coach) => {
    const searchText = (coach.name + " " + coach.gameName + " " + coach.roles.join(" ") + " " + coach.languages.join(" ")).toLowerCase();
    const inPriceBand = priceBand === "all" ||
      (priceBand === "under20" && coach.hourlyRate < 20) ||
      (priceBand === "20to29" && coach.hourlyRate >= 20 && coach.hourlyRate < 30) ||
      (priceBand === "30to49" && coach.hourlyRate >= 30 && coach.hourlyRate < 50) ||
      (priceBand === "50plus" && coach.hourlyRate >= 50);
    return (selectedGame === "all" || coach.game === selectedGame) &&
      (!onlineOnly || coach.online) &&
      (!hundredReviewsOnly || coach.reviewCount >= 100) &&
      (!mvpOnly || coach.isMvp) &&
      (!topRatedOnly || coach.rating >= 4.9) &&
      (!favoritesOnly || favorites.includes(coach.slug)) &&
      inPriceBand &&
      (minRate === "" || coach.hourlyRate >= Number(minRate)) &&
      (maxRate === "" || coach.hourlyRate <= Number(maxRate)) &&
      (language === "all" || coach.languages.includes(language)) &&
      (role === "all" || coach.roles.includes(role)) &&
      (!peakRanks.length || peakRanks.includes(coach.peakRank)) &&
      (server === "all" || coach.server === server) &&
      (sessionFormat === "all" || coach.sessionFormats.includes(sessionFormat as "live" | "vod")) &&
      searchText.includes(search.trim().toLowerCase());
  }).sort((a, b) => {
    if (sortBy === "rating") return b.rating - a.rating;
    if (sortBy === "reviews") return b.reviewCount - a.reviewCount;
    if (sortBy === "priceLow") return a.hourlyRate - b.hourlyRate;
    if (sortBy === "priceHigh") return b.hourlyRate - a.hourlyRate;
    return 0;
  }), [favorites, favoritesOnly, hundredReviewsOnly, language, maxRate, minRate, mvpOnly, onlineOnly, peakRanks, priceBand, role, search, selectedGame, server, sessionFormat, sortBy, topRatedOnly]);

  function toggleFavorite(slug: string) {
    setFavorites((current) => current.includes(slug) ? current.filter((item) => item !== slug) : [...current, slug]);
  }

  function clearFilters() {
    setSearch("");
    setSelectedGame(gameSlug ?? "all");
    setOnlineOnly(false);
    setHundredReviewsOnly(false);
    setMvpOnly(false);
    setTopRatedOnly(false);
    setFavoritesOnly(false);
    setPriceBand("all");
    setMinRate("");
    setMaxRate("");
    setLanguage("all");
    setRole("all");
    setPeakRanks([]);
    setServer("all");
    setSessionFormat("all");
    setSortBy("top");
  }

  return (
    <section className="coach-directory" aria-labelledby="coach-directory-title">
      <div className="coach-directory-heading">
        <div>
          <p className="eyebrow">{t("coachesEyebrow")}</p>
          <h2 id="coach-directory-title">{t("coachesTitle")}</h2>
          <p>{t("coachesSubtitle")}</p>
        </div>
        <span className="coach-result-count">{t("coachesShowing", { count: filtered.length })}</span>
      </div>

      <div className="coach-toolbar">
        <label className="coach-search">
          <Search size={17} aria-hidden="true" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t("searchCoachPlaceholder")} />
        </label>
        <div className="coach-filter-row" aria-label={t("filterAllGames")}>
          {games.map((game) => {
            const selected = selectedGame === game.slug;
            const label = game.slug === "all" ? t("filterAllGames") : game.label;
            return (
              <button key={game.slug} type="button" aria-pressed={selected} className="coach-filter-chip" onClick={() => chooseGame(selected && game.slug !== "all" ? "all" : game.slug)}>
                {label}{selected && game.slug !== "all" && <X size={12} aria-hidden="true" />}
              </button>
            );
          })}
          <button type="button" aria-pressed={onlineOnly} className="coach-filter-chip" onClick={() => setOnlineOnly((value) => !value)}>{t("filterOnline")}{onlineOnly && <X size={12} aria-hidden="true" />}</button>
          <button type="button" aria-pressed={priceBand === "under20"} className="coach-filter-chip" onClick={() => setPriceBand((value) => value === "under20" ? "all" : "under20")}>{t("filterUnderTwenty")}{priceBand === "under20" && <X size={12} aria-hidden="true" />}</button>
          <button type="button" aria-pressed={hundredReviewsOnly} className="coach-filter-chip" onClick={() => setHundredReviewsOnly((value) => !value)}>{t("filterHundredReviews")}{hundredReviewsOnly && <X size={12} aria-hidden="true" />}</button>
          <button type="button" aria-pressed={mvpOnly} className="coach-filter-chip" onClick={() => setMvpOnly((value) => !value)}>{t("filterMvp")}{mvpOnly && <X size={12} aria-hidden="true" />}</button>
          <button type="button" aria-pressed={topRatedOnly} className="coach-filter-chip" onClick={() => setTopRatedOnly((value) => !value)}>{t("filterTopRated")}{topRatedOnly && <X size={12} aria-hidden="true" />}</button>
          <button type="button" aria-pressed={favoritesOnly} className="coach-filter-chip" onClick={() => setFavoritesOnly((value) => !value)}><Heart size={14} />{t("filterFavorites")}{favoritesOnly && <X size={12} aria-hidden="true" />}</button>
        </div>
        <details className="coach-advanced-filters">
          <summary>{t("coachFilters")}</summary>
          <div className="coach-advanced-grid">
            <label><span>{t("coachHourlyBands")}</span><select value={priceBand} onChange={(event) => setPriceBand(event.target.value)}>
              <option value="all">{t("coachAny")}</option><option value="under20">{t("filterUnderTwenty")}</option><option value="20to29">{t("coachPrice20to29")}</option><option value="30to49">{t("coachPrice30to49")}</option><option value="50plus">{t("coachPrice50Plus")}</option>
            </select></label>
            <label><span>{t("coachMinPrice")}</span><NumberInput type="number" min="0" value={minRate} onChange={(event) => setMinRate(event.target.value)} placeholder="0" /></label>
            <label><span>{t("coachMaxPrice")}</span><NumberInput type="number" min="0" value={maxRate} onChange={(event) => setMaxRate(event.target.value)} placeholder="—" /></label>
            <label><span>{t("coachLanguageFilter")}</span><select value={language} onChange={(event) => setLanguage(event.target.value)}><option value="all">{t("coachAny")}</option>{languages.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label><span>{t("coachRoleFilter")}</span><select value={role} onChange={(event) => setRole(event.target.value)}><option value="all">{t("coachAny")}</option>{roles.map((item) => <option key={item}>{item}</option>)}</select></label>
            <fieldset className="coach-rank-options"><legend>{t("coachRankFilter")}</legend>{ranks.map(({ rank, count }) => <label key={rank}><input type="checkbox" checked={peakRanks.includes(rank)} onChange={() => setPeakRanks((current) => current.includes(rank) ? current.filter((item) => item !== rank) : [...current, rank])} /><span>{rank}</span><small>{count}</small></label>)}</fieldset>
            <label><span>{t("coachServerFilter")}</span><select value={server} onChange={(event) => setServer(event.target.value)}><option value="all">{t("coachAny")}</option>{servers.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label><span>{t("coachSessionFormat")}</span><select value={sessionFormat} onChange={(event) => setSessionFormat(event.target.value)}><option value="all">{t("coachAny")}</option><option value="live">{t("coachLiveSession")}</option><option value="vod">{t("coachVodReview")}</option></select></label>
            <label><span>{t("coachSortFilter")}</span><select value={sortBy} onChange={(event) => setSortBy(event.target.value)}><option value="top">{t("coachSortTopPicks")}</option><option value="rating">{t("coachSortRating")}</option><option value="reviews">{t("coachSortReviews")}</option><option value="priceLow">{t("coachSortPriceLow")}</option><option value="priceHigh">{t("coachSortPriceHigh")}</option></select></label>
          </div>
        </details>
      </div>

      {filtered.length ? (
        <div className="coach-grid">
          {filtered.map((coach) => (
            <article className="coach-card" key={coach.slug} style={{ "--coach-accent": coach.accent } as React.CSSProperties}>
              <Link className="coach-card-main" href={"/coaches/" + coach.slug + "?game=" + coach.game} aria-label={t("viewCoachProfile") + ": " + coach.name}>
                <div className="coach-card-cover">
                  <span className="coach-card-game"><Image src={coachGameLogoPath(coach.game)} alt="" width={26} height={26} />{coach.gameName}</span>
                  <Image className="coach-card-avatar" src={"/images/coaches/" + coach.slug + ".svg"} alt="" width={92} height={92} />
                  <span className={"coach-presence " + (coach.online ? "is-online" : "is-offline")}><i className={coach.online ? "is-online" : ""} />{coach.online ? t("coachOnline") : t("coachOffline")}</span>
                </div>
                <div className="coach-card-content">
                  <div className="coach-card-title">
                    <div><h3>{coach.name}</h3><span className="coach-verified"><ShieldCheck size={14} />{t("verifiedCoach")}</span>{coach.isMvp && <span className="coach-mvp-badge">{t("mvpCoach")}</span>}</div>
                    <span className="coach-rating"><Star size={15} fill="currentColor" />{coach.rating.toFixed(2)} <small>({coach.reviewCount} {t("coachReviews")})</small></span>
                  </div>
                  <p className="coach-card-bio">{t(coach.bioKey)}</p>
                  <div className="coach-card-achievement" data-game={coach.game}>
                    <Image src={coachRankCardIconPath(coach.game, coach.peakRank)} alt="" width={52} height={52} />
                    <div><span>{t("coachPeakRank")}</span><strong>{coach.peakRank}</strong></div>
                  </div>
                  <div className="coach-card-specialties">
                    <span>{t("coachRoles")}</span>
                    <div>{coach.roles.map((item) => <span className="coach-role-tag" key={item}>{roleIcon(coach.game, item) && <Image src={roleIcon(coach.game, item)!} alt="" width={16} height={16} />}{item}</span>)}</div>
                  </div>
                  <div className="coach-card-footer">
                    <span className="coach-rate">{money.format(coach.hourlyRate)} <small>{t("coachHourlyRate")}</small></span>
                    <span className="coach-profile-link">{t("viewCoachProfile")} <ArrowUpRight size={15} /></span>
                  </div>
                </div>
              </Link>
              <button type="button" className={"coach-favorite " + (favorites.includes(coach.slug) ? "is-favorite" : "")} aria-label={t("filterFavorites")} aria-pressed={favorites.includes(coach.slug)} onClick={() => toggleFavorite(coach.slug)}>
                <Heart size={17} fill={favorites.includes(coach.slug) ? "currentColor" : "none"} />
              </button>
            </article>
          ))}
        </div>
      ) : (
        <div className="coach-empty">
          <p>{t("noCoachesMatch")}</p>
          <button type="button" className="text-link" onClick={clearFilters}>{t("clearCoachFilters")}</button>
        </div>
      )}
    </section>
  );
}

function roleIcon(game: string, role: string) {
  const slug = role.toLowerCase();
  if (game === "league-of-legends" && ["top", "jungle", "mid", "adc", "support"].includes(slug)) return `/images/roles/lol/${slug}.svg`;
  if (game === "valorant" && ["duelist", "initiator", "controller", "sentinel"].includes(slug)) return `/images/roles/valorant/${slug}.png`;
  return null;
}
