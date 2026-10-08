"use client";
import { translateText } from "@/lib/i18n";

import { NumberInput } from "@/components/ui/NumberInput";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/store/useCart";
import { Suspense, useEffect, useId, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  ChevronDown,
  ShieldCheck,
  Zap,
  Video,
  Trophy,
  UserRound,
  EyeOff,
  Swords,
  Heart,
  Gauge,
  Check,
} from "lucide-react";
import { useStore } from "@/store/useStore";
import { games } from "@/data/games";
import { ranksFor, servicesFor } from "@/lib/service-options";
import { RankPicker } from "@/components/services/RankPicker";
import { estimateQuote } from "@/lib/quote";
import { CurrencySwitch, useMoney } from "@/components/ui/Currency";
import { RegionSelector } from "@/components/ui/RegionSelector";
import { regions, regionsForGame } from "@/data/regions";
import { GameSelector } from "@/components/home/GameSelector";
import { gameConfigFor } from "@/lib/game-config";
import { useLanguage } from "@/components/ui/LanguageProvider";
import { GameProductNav } from "@/components/games/GameProductNav";
import { serviceCopyFor } from "@/data/service-copy";
import type { ServiceSlug } from "@/lib/service-options";
import { CoachDirectory } from "@/components/coaches/CoachDirectory";
import { apexConfig, apexRankAtLp, apexStartLp, isApexRank, rankDescription } from "@/lib/apex-ranks";
import { CategoryConfigurator } from "@/components/services/CategoryConfigurator";
import { ShopPrice } from "@/components/services/ShopPrice";
import { RankGainPicker } from "./RankGainPicker";

const extraCopy: Record<string, { vi: string; enDetail: string }> = {
  "Express priority": { vi: "Ưu tiên xử lý", enDetail: "Prioritize your order." },
  "Premium coaching": { vi: "Huấn luyện nâng cao", enDetail: "Discuss strategy with your player." },
  "+1 Bonus win": { vi: "Thêm 1 trận thắng", enDetail: "One additional win after reaching your goal." },
  "+1 Bonus top 4": { vi: "Thêm 1 trận top 4", enDetail: "One additional top-four finish." },
  "Solo only": { vi: "Chỉ chơi đơn", enDetail: "One player handles your order." },
  "Dedicated player": { vi: "Người chơi riêng", enDetail: "One dedicated player for your order." },
  "Appear offline on chat": { vi: "Ẩn trạng thái online", enDetail: "Keep your chat presence private." },
  "Appear offline": { vi: "Ẩn trạng thái online", enDetail: "Keep your chat presence private." },
  "Champions / roles": { vi: "Tướng / vị trí ưu tiên", enDetail: "Prioritize your selected champions and roles." },
  "Preferred comps": { vi: "Đội hình ưu tiên", enDetail: "Prioritize your preferred compositions." },
  "Preferred agents": { vi: "Agent ưu tiên", enDetail: "Prioritize your selected agents." },
  "Natural winrate": { vi: "Tỷ lệ thắng tự nhiên", enDetail: "A more natural win progression." },
  "Natural placement": { vi: "Tiến trình tự nhiên", enDetail: "A more natural rank progression." },
  "Moderate KDA": { vi: "KDA vừa phải", enDetail: "Keep KDA at a moderate level." },
};
import { AccountShop } from "@/components/services/AccountShop";

const roleIcons: Record<string, Record<string, string>> = {
  "league-of-legends": {
    Top: "/images/roles/lol/top.svg",
    Jungle: "/images/roles/lol/jungle.svg",
    Mid: "/images/roles/lol/mid.svg",
    ADC: "/images/roles/lol/adc.svg",
    Support: "/images/roles/lol/support.svg",
  },
  valorant: {
    Duelist: "/images/roles/valorant/duelist.png",
    Initiator: "/images/roles/valorant/initiator.png",
    Controller: "/images/roles/valorant/controller.png",
    Sentinel: "/images/roles/valorant/sentinel.png",
  },
};

export function ServiceConfigurator() {
  const router = useRouter();
  const { language, t } = useLanguage();
  const s = useStore();
  const sectionRef = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);
  const [extraSelection, setExtraSelection] = useState({ key: "", ids: [] as string[] });
  const optionId = useId();

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) =>
      setInView(entry.isIntersecting),
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const money = useMoney();
  const gameConfig = gameConfigFor(s.game);
  const ranks = ranksFor(s.game);
  const choices = servicesFor(s.game);
  const service =
    choices.find((option) => option.slug === s.service) ?? choices[0];
  const maxApexLp = apexConfig(s.game)?.maxLp ?? 1500;
  const current = Math.min(s.current, ranks.length - (apexConfig(s.game) ? 1 : 2));
  const currentLp = isApexRank(s.game, current) ? Math.max(0, Math.min(maxApexLp - 10, s.currentLp)) : 0;
  const targetLp = isApexRank(s.game, current) || isApexRank(s.game, s.target)
    ? Math.min(maxApexLp, Math.max(s.targetLp, isApexRank(s.game, current) ? currentLp + 10 : apexStartLp(s.game, s.target))) : 0;
  const target = isApexRank(s.game, current) || isApexRank(s.game, s.target)
    ? apexRankAtLp(s.game, targetLp) : Math.min(Math.max(s.target, current + 1), ranks.length - 1);
  const rankSummary = `${rankDescription(s.game, current, currentLp)} → ${rankDescription(s.game, target, targetLp)}`;
  const queue = service.slug === "duo-boost" ? "Duo" : s.queue;
  const queueOptions = service.slug === "duo-boost" ? ["Duo"] : gameConfig.queues;
  const { price, minHours, maxHours, quoteRequired } = estimateQuote(
    current,
    target,
    queue,
    service.slug,
    s.units,
    s.game,
    currentLp,
    targetLp,
    s.region,
    s.lpGain,
  );
  const unitService =
    service.slug === "coaching" || service.slug === "placements";
  const categoryProduct = s.product ?? (service.slug === "placements" ? "placements" : service.slug === "duo-boost" ? "games" : null);
  const hasCategoryForm = Boolean(categoryProduct && !["divisions", "ranks", "double-up", "coaching"].includes(categoryProduct));

  const selectionKey = `${s.game}:${service.slug}`;

  const extrasForGame: Record<string, { id: string; title: string; detail: string; price: string; icon: typeof Zap }[]> = {
    "league-of-legends": [
      { id: "express", title: "Express priority", detail: "Ưu tiên xử lý đơn nhanh hơn", price: "+20%", icon: Zap },
      { id: "coaching", title: "Premium coaching", detail: "Trao đổi chiến thuật cùng booster", price: "+30%", icon: Video },
      { id: "bonus", title: "+1 Bonus win", detail: "Thêm một trận thắng sau khi đạt rank", price: "+$6.99", icon: Trophy },
      { id: "solo", title: "Solo only", detail: "Chỉ một booster chơi đơn hàng", price: "+35%", icon: UserRound },
      { id: "offline", title: "Appear offline on chat", detail: "Giữ trạng thái riêng tư khi chơi", price: "FREE", icon: EyeOff },
      { id: "champions", title: "Champions / roles", detail: "Ưu tiên tướng và vị trí bạn chọn", price: "RECOMMENDED", icon: Swords },
      { id: "winrate", title: "Natural winrate", detail: "Nhịp thắng tự nhiên hơn", price: "+40%", icon: Heart },
      { id: "kda", title: "Moderate KDA", detail: "Giữ chỉ số KDA ở mức vừa phải", price: "+30%", icon: Gauge },
    ],
    "teamfight-tactics": [
      { id: "express", title: "Express priority", detail: "Ưu tiên xử lý đơn nhanh hơn", price: "+20%", icon: Zap },
      { id: "coaching", title: "Premium coaching", detail: "Trao đổi đội hình và chiến thuật", price: "+30%", icon: Video },
      { id: "bonus", title: "+1 Bonus top 4", detail: "Thêm một trận top 4", price: "+$6.99", icon: Trophy },
      { id: "solo", title: "Dedicated player", detail: "Một người chơi phụ trách đơn hàng", price: "+20%", icon: UserRound },
      { id: "offline", title: "Appear offline", detail: "Giữ trạng thái riêng tư khi chơi", price: "FREE", icon: EyeOff },
      { id: "comps", title: "Preferred comps", detail: "Ưu tiên đội hình bạn muốn chơi", price: "RECOMMENDED", icon: Swords },
      { id: "natural", title: "Natural placement", detail: "Lộ trình rank tự nhiên hơn", price: "+25%", icon: Heart },
    ],
    valorant: [
      { id: "express", title: "Express priority", detail: "Ưu tiên xử lý đơn nhanh hơn", price: "+20%", icon: Zap },
      { id: "coaching", title: "Premium coaching", detail: "Trao đổi chiến thuật và aim", price: "+30%", icon: Video },
      { id: "bonus", title: "+1 Bonus win", detail: "Thêm một trận thắng sau khi đạt rank", price: "+$6.99", icon: Trophy },
      { id: "solo", title: "Dedicated player", detail: "Một booster phụ trách đơn hàng", price: "+20%", icon: UserRound },
      { id: "offline", title: "Appear offline", detail: "Giữ trạng thái riêng tư khi chơi", price: "FREE", icon: EyeOff },
      { id: "agents", title: "Preferred agents", detail: "Ưu tiên agent bạn chọn", price: "RECOMMENDED", icon: Swords },
      { id: "natural", title: "Natural winrate", detail: "Nhịp thắng tự nhiên hơn", price: "+25%", icon: Heart },
    ],
  };
  const gameExtras = extrasForGame[s.game] ?? extrasForGame["league-of-legends"];
  const extras = extraSelection.key === selectionKey ? extraSelection.ids
    : extraSelection.key === "" && s.quoteOverride !== null
      ? gameExtras.filter(extra => s.quoteAddOns.includes(extra.title)).map(extra => extra.id)
      : [];
  const extraFees = extras.reduce((fees, id) => {
    const extra = gameExtras.find((item) => item.id === id);
    if (!extra || extra.price === "FREE" || extra.price === "RECOMMENDED") return fees;
    if (extra.price.endsWith("%")) fees.percent += Number(extra.price.slice(1, -1));
    else fees.flat += Number(extra.price.replace(/[^0-9.]/g, ""));
    return fees;
  }, {percent:0, flat:0});
  const adjustedPrice = quoteRequired ? 0 : Number((price * (1 + extraFees.percent / 100) + extraFees.flat).toFixed(2));
  const pendingQuote = translateText(language, "Request a quote", "Yêu cầu báo giá");

  function reviewPlan(addOnly = false) {
    s.set({ current, target, currentLp, targetLp, service: service.slug, queue, modal: null, coachBooking: null, accountPurchase: null, quoteOverride: adjustedPrice,
      quoteAddOns: extras.map(id => gameExtras.find(extra => extra.id === id)?.title ?? id),
      checkoutDetails: quoteRequired ? {name:serviceCopyFor(language, service.slug as ServiceSlug).name, from:rankDescription(s.game,current,currentLp), to:rankDescription(s.game,target,targetLp), quoteRequired:true} : null });
    const params = new URLSearchParams({
      type: "boost", game: s.game, service: service.slug, name: serviceCopyFor(language, service.slug as ServiceSlug).name,
      from: rankDescription(s.game, current, currentLp), to: rankDescription(s.game, target, targetLp),
      region: s.region, queue, role: s.role, champions: s.champions,
      lpGain: s.lpGain, units: String(s.units), amount: String(adjustedPrice),
      base: String(price), delivery: `${minHours}–${maxHours}`,
      quote: String(quoteRequired),
    });
    extras.forEach(id => params.append("option", gameExtras.find(extra => extra.id === id)?.title ?? id));
    const href = `/checkout?${params.toString()}`;
    if (!quoteRequired) useCart.getState().add(href, addOnly);
    if (!addOnly) router.push(href);
  }

  return (
    <section
      ref={sectionRef}
      className="section compact-config relative py-16"
      id="configure"
    >
      {/* 1. AMBIENT BACKGROUND GLOW (Burnt Orange & Prime Gold diffusion) */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-32 left-1/4 h-[500px] w-[500px] rounded-full bg-[#FF9F3C] opacity-15 blur-[160px]" />
        <div className="absolute -bottom-32 right-1/4 h-[500px] w-[500px] rounded-full bg-[#D97706] opacity-15 blur-[160px]" />
      </div>

      <div className="site-container relative z-10">
        <div className="section-heading mb-8" data-reveal>
          <div>
            <p className="eyebrow text-[#FF9F3C]">{t("rankConfigurator")}</p>
            <h2>
              {t("planFor")} <span className="muted">{t("yourClimb")}</span>
            </h2>
          </div>
          <Link href="/services" className="text-link">
            {t("allServices")} <ArrowUpRight size={17} />
          </Link>
        </div>

        {/* 2. MAIN CONTAINER */}
        <div className="glass-panel relative overflow-visible bg-gradient-to-b from-white/[0.05] via-white/[0.02] to-transparent backdrop-blur-2xl border border-white/10 rounded-3xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),0_20px_60px_rgba(0,0,0,0.7)]">
          <div className="relative z-30 rounded-t-3xl">
          {/* Top Bar: Game Selector */}
          <div className="flex flex-wrap items-center justify-start gap-4 rounded-t-3xl p-4 sm:px-8 border-b border-white/[0.06] bg-white/[0.01]">
            <span className="shrink-0 text-sm font-semibold text-zinc-300 uppercase tracking-wide">
              {t("selectedGame")}
            </span>
            <GameSelector />
          </div>
          <Suspense fallback={null}>
            <GameProductNav
              key={s.game}
              gameSlug={s.game}
              gameName={s.game === "league-of-legends" ? "LoL" : s.game === "teamfight-tactics" ? "TFT" : "Valorant"}
            />
          </Suspense>
          </div>

          {/* Coaching opens the coach discovery flow; other services keep the configurator. */}
          <div id="category-content" role="tabpanel" aria-label={t("services")} tabIndex={0}>
          {categoryProduct === "accounts" || categoryProduct === "smurfs" ? (
            <AccountShop key={`${s.game}:${categoryProduct}`} game={s.game} smurfs={categoryProduct === "smurfs"} />
          ) : hasCategoryForm ? (
            <CategoryConfigurator key={`${s.game}:${categoryProduct}`} game={s.game} productId={categoryProduct!} />
          ) : service.slug === "coaching" ? (
            <CoachDirectory key={s.game} gameSlug={s.game} />
          ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 p-6 sm:p-8">
            {/* Left Column: Controls & Ranks */}
            <div className="lg:col-span-7 xl:col-span-8 flex flex-col justify-between space-y-6">
              <div>
                {unitService ? (
                  <div className="bg-black/40 backdrop-blur-md border border-white/[0.06] rounded-xl p-5 mb-6 space-y-3">
                    <label
                      htmlFor="service-units"
                      className="block text-xs font-semibold tracking-wider uppercase text-zinc-400"
                    >
                      {service.slug === "coaching"
                        ? t("coachingHours")
                        : t("placementMatches")}
                    </label>
                    <NumberInput
                      id="service-units"
                      type="number"
                      min={1}
                      max={10}
                      value={s.units}
                      onChange={(e) =>
                        s.set({
                          units: Math.max(
                            1,
                            Math.min(10, Number(e.target.value) || 1),
                          ),
                        })
                      }
                      className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white text-base focus:outline-none focus:border-[#FF9F3C]/50 transition-all"
                    />
                    <p className="text-xs text-zinc-400">
                      {service.slug === "coaching"
                        ? t("coachingHint")
                        : t("placementHint")}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-stretch gap-4 lg:gap-6 mb-6">
                    <RankPicker
                      game={s.game}
                      label={t("currentRank")}
                      value={current}
                      lp={currentLp}
                      maxLp={maxApexLp - 10}
                      max={ranks.length - (apexConfig(s.game) ? 1 : 2)}
                      onChange={(value, points = 0) => {
                        const nextTargetLp = Math.min(maxApexLp, Math.max(targetLp, points + 10));
                        s.set({
                          current: value,
                          currentLp: points,
                          target: isApexRank(s.game, value) ? apexRankAtLp(s.game, nextTargetLp) : Math.max(target, value + 1),
                          targetLp: isApexRank(s.game, value) ? nextTargetLp : targetLp,
                        });
                      }}
                    />

                    {/* Centered Forward Transition Arrow */}
                    <div className="flex items-center justify-center -my-2 md:my-0 md:h-[330px] self-start select-none">
                      <div className="w-11 h-11 rounded-full bg-white/[0.03] backdrop-blur-md border border-white/[0.08] shadow-[0_0_20px_rgba(255,159,60,0.15)] flex items-center justify-center text-[#FF9F3C] shrink-0 rotate-90 md:rotate-0 transition-transform">
                        <ArrowRight size={20} />
                      </div>
                    </div>

                    <RankPicker
                      game={s.game}
                      label={t("desiredRank")}
                      value={target}
                      lp={targetLp}
                      minLp={isApexRank(s.game, current) ? currentLp + 10 : 0}
                      maxLp={maxApexLp}
                      min={current + (isApexRank(s.game, current) ? 0 : 1)}
                      max={ranks.length - 1}
                      onChange={(value, points = 0) => s.set({ target: value, targetLp: points })}
                    />
                  </div>
                )}

                {!unitService && s.game === "league-of-legends" && !isApexRank(s.game,current) && (
                  <div className="rank-gain-field">
                    <span>{translateText(language, "Expected LP per win", "LP nhận mỗi trận thắng")}</span>
                    <RankGainPicker value={s.lpGain} onChange={(lpGain) => s.set({ lpGain })} label={translateText(language, "Expected LP per win", "LP nhận mỗi trận thắng")} />
                  </div>
                )}

                {/* Sub-options: Region, Role, Queue */}
                <div className="grid grid-cols-1 items-stretch gap-4 pt-2 sm:grid-cols-3">
                  <div className="journey-field min-h-[104px] rounded-xl border border-white/[0.06] bg-black/40 p-3.5 backdrop-blur-md transition-all hover:border-[#FF9F3C]/50 hover:bg-black/50">
                    <RegionSelector
                      options={regionsForGame(s.game)}
                      value={regionsForGame(s.game).some(r => r.code === s.region) ? s.region : regionsForGame(s.game)[0].code}
                      onChange={(region) => s.set({ region })}
                    />
                  </div>

                  {gameConfig.roles ? (
                    <div className="journey-field relative z-20 min-h-[104px] overflow-visible rounded-xl border border-white/[0.06] bg-black/40 p-3.5 backdrop-blur-md transition-all hover:border-[#FF9F3C]/50 hover:bg-black/50">
                      <span className="text-sm font-semibold tracking-wide uppercase text-zinc-300 block">
                        {s.game === "valorant" ? t("playerRole") : t("role")}
                      </span>
                      <details className="role-picker group relative">
                        <summary
                          aria-label={`${s.game === "valorant" ? t("playerRole") : t("role")}: ${s.role}`}
                          className="mt-[10px] flex h-12 w-full cursor-pointer list-none items-center gap-2 rounded-lg border border-white/10 bg-black/30 px-3 text-left text-sm font-medium text-white outline-none transition-colors hover:border-white/20 focus-visible:ring-2 focus-visible:ring-[#FF9F3C]/70 [&::-webkit-details-marker]:hidden"
                        >
                          <img
                            src={roleIcons[s.game]?.[s.role] ?? "/images/roles/lol/mid.svg"}
                            alt=""
                            aria-hidden="true"
                            className="h-[18px] w-[18px] shrink-0 object-contain"
                          />
                          <span className="flex-1">{s.role}</span>
                          <span aria-hidden="true" className="text-xs text-zinc-500 transition-transform group-open:rotate-180">⌄</span>
                        </summary>
                        <div role="listbox" aria-label={`${s.game === "valorant" ? "Player role" : "Role"} options`} className="absolute left-0 right-0 top-[calc(100%+12px)] z-50 max-h-56 overflow-y-auto rounded-xl border border-white/10 bg-[#141416] p-1.5 shadow-[0_16px_36px_rgba(0,0,0,0.55)]">
                          {gameConfig.roles.map((role) => {
                            return (
                              <button
                                key={role}
                                type="button"
                                role="option"
                                aria-selected={s.role === role}
                                onClick={(event) => {
                                  s.set({ role });
                                  const details = event.currentTarget.closest("details");
                                  if (details) details.open = false;
                                }}
                                className="flex w-full items-center gap-2.5 rounded-lg border border-transparent px-2.5 py-2 text-left text-sm text-zinc-200 transition-all hover:border-[#FF9F3C]/60 hover:bg-[#FF9F3C]/10 hover:shadow-[0_0_18px_rgba(255,159,60,0.22),inset_0_0_12px_rgba(255,159,60,0.07)] focus-visible:border-[#FF9F3C]/60 focus-visible:bg-[#FF9F3C]/10 focus-visible:outline-none focus-visible:shadow-[0_0_18px_rgba(255,159,60,0.22)] aria-selected:border-[#FF9F3C]/60 aria-selected:bg-[#FF9F3C]/10 aria-selected:text-white aria-selected:shadow-[0_0_16px_rgba(255,159,60,0.2)]"
                              >
                                <img
                                  src={roleIcons[s.game]?.[role] ?? "/images/roles/lol/mid.svg"}
                                  alt=""
                                  aria-hidden="true"
                                  className="h-[18px] w-[18px] shrink-0 object-contain"
                                />
                                <span>{role}</span>
                              </button>
                            );
                          })}
                        </div>
                      </details>
                    </div>
                  ) : (
                    <div className="journey-field min-h-[104px] rounded-xl border border-white/[0.06] bg-black/40 p-3.5 backdrop-blur-md">
                      <span className="text-sm font-semibold tracking-wide uppercase text-zinc-300 block">
                        {t("server")}
                      </span>
                      <strong className="text-sm font-medium text-white mt-1">
                        {t("official")}
                      </strong>
                    </div>
                  )}

                  <div className="journey-field relative z-20 min-h-[104px] rounded-xl border border-white/[0.06] bg-black/40 p-3.5 backdrop-blur-md transition-all hover:border-[#FF9F3C]/50 hover:bg-black/50">
                    <span className="text-sm font-semibold tracking-wide uppercase text-zinc-300 block">
                      {t("queue")}
                    </span>
                    {service.slug === "duo-boost" ? (
                      <div className="mt-[10px] flex h-12 w-full items-center justify-between rounded-lg border border-white/10 bg-black/30 px-3 text-sm font-medium text-zinc-400">
                        <span>{queue}</span>
                        <ChevronDown size={16} aria-hidden="true" className="opacity-50" />
                      </div>
                    ) : (
                      <details className="queue-picker group relative">
                        <summary
                          aria-label={`${t("queue")}: ${queue}`}
                          className="mt-[10px] flex h-12 w-full cursor-pointer list-none items-center justify-between rounded-lg border border-white/10 bg-black/30 px-3 text-left text-sm font-medium text-white transition-all hover:border-[#FF9F3C]/60 hover:bg-[#FF9F3C]/[0.06] hover:shadow-[0_0_16px_rgba(255,159,60,0.18)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF9F3C]/70 [&::-webkit-details-marker]:hidden"
                        >
                          <span>{queue}</span>
                          <ChevronDown size={16} aria-hidden="true" className="text-zinc-400 transition-transform group-open:rotate-180" />
                        </summary>
                        <div role="listbox" aria-label={t("queueOptions")} className="absolute left-0 right-0 top-[calc(100%+12px)] z-50 max-h-56 overflow-y-auto rounded-xl border border-white/10 bg-[#141416] p-1.5 shadow-[0_16px_36px_rgba(0,0,0,0.55)]">
                          {queueOptions.map((option) => (
                            <button
                              key={option}
                              type="button"
                              role="option"
                              aria-selected={queue === option}
                              onClick={(event) => {
                                s.set({ queue: option });
                                const details = event.currentTarget.closest("details");
                                if (details) details.open = false;
                              }}
                              className="flex w-full items-center rounded-lg border border-transparent px-2.5 py-2 text-left text-sm text-zinc-200 transition-all hover:border-[#FF9F3C]/60 hover:bg-[#FF9F3C]/10 hover:shadow-[0_0_18px_rgba(255,159,60,0.22),inset_0_0_12px_rgba(255,159,60,0.07)] focus-visible:border-[#FF9F3C]/60 focus-visible:bg-[#FF9F3C]/10 focus-visible:outline-none focus-visible:shadow-[0_0_18px_rgba(255,159,60,0.22)] aria-selected:border-[#FF9F3C]/60 aria-selected:bg-[#FF9F3C]/10 aria-selected:text-white aria-selected:shadow-[0_0_16px_rgba(255,159,60,0.2)]"
                            >
                              {option}
                            </button>
                          ))}
                        </div>
                      </details>
                    )}
                  </div>
                </div>

                {/* Optional Preferences Accordion */}
                <details className="journey-preferences mt-6 bg-black/30 border border-white/[0.06] rounded-xl p-4 transition-all group">
                  <summary className="text-sm font-semibold text-zinc-300 uppercase tracking-wide cursor-pointer list-none flex items-center justify-between select-none">
                    <span>
                      {t("optionalPreferences")}{s.champions ? ` · ${t("added")}` : ""}
                    </span>
                    <span className="text-xs text-zinc-400 font-normal">
                      {t("clickExpand")}
                    </span>
                  </summary>
                  <div className="pt-3 mt-3 border-t border-white/5">
                    <label className="block text-xs font-medium text-zinc-400 mb-2">
                      {s.game === "valorant"
                        ? t("preferredAgents")
                        : s.game === "teamfight-tactics"
                          ? t("preferredComps")
                          : t("preferredChampions")}
                    </label>
                    <input
                      value={s.champions}
                      onChange={(e) => s.set({ champions: e.target.value })}
                      placeholder={t("preferencesHint")}
                      maxLength={120}
                      className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-[#FF9F3C]/50 transition-all placeholder:text-zinc-600"
                    />
                  </div>
                </details>
              </div>
            </div>

            {/* 4. RIGHT-SIDE ORDER SUMMARY */}
            <div className="journey-summary order-panel lg:col-span-5 xl:col-span-4 lg:col-start-8 xl:col-start-9 lg:row-start-1 lg:row-span-2 bg-white/[0.025] backdrop-blur-xl border border-white/[0.07] rounded-xl p-6 sm:p-7 flex flex-col justify-between shadow-[inset_0_1px_1px_rgba(255,255,255,0.08),0_10px_30px_rgba(0,0,0,0.4)]">
              <div>
                <div className="flex items-center justify-between gap-2 mb-4">
                  <span className="text-sm font-sans font-semibold tracking-wide text-zinc-300 uppercase">
                    {t("orderSummary")}
                  </span>
                  <CurrencySwitch />
                </div>

                {/* Plan Selection Details */}
                <p className="text-sm font-medium text-zinc-300 leading-relaxed py-2">
                  <strong className="text-white block font-heading font-bold uppercase tracking-wide text-base mb-1">
                    {games.find((game) => game.slug === s.game)?.name}
                  </strong>
                  {unitService
                    ? `${s.units} ${service.slug === "coaching" ? "hours" : "matches"}`
                    : rankSummary}
                  <br />
                  <span className="text-sm text-zinc-300 mt-1 block">
                    {s.region} · {queue}
                    {gameConfig.roles ? ` · ${s.role}` : ""}
                  </span>
                  {!unitService && s.game === "valorant" && <span className="rank-pricing-policy">PC · 22 RR / {translateText(language, "win", "trận thắng")}</span>}
                </p>

                <div className="order-summary-price" aria-live="polite" aria-atomic="true">
                  {quoteRequired ? <strong className="quote-pending">{pendingQuote}</strong> : <ShopPrice usd={adjustedPrice} />}
                </div>
                <section className="order-options" aria-labelledby={optionId + "-heading"}>
                  <h3 id={optionId + "-heading"}>{translateText(language, "Order options", "Tùy chọn đơn hàng")}</h3>
                  <div className="order-options-list">
                    {gameExtras.map((extra) => {
                      const Icon = extra.icon;
                      const enabled = extras.includes(extra.id);
                      const copy = extraCopy[extra.title];
                      const title = translateText(language, extra.title, copy?.vi);
                      const recommended = extra.price === "RECOMMENDED";
                      const fee = extra.price === "FREE" || recommended
                        ? (translateText(language, "Free", "Miễn phí"))
                        : extra.price.startsWith("+$")
                          ? "+" + money.format(Number(extra.price.slice(2)))
                          : extra.price;
                      return (
                        <button key={extra.id} type="button" role="switch" aria-checked={enabled} aria-label={title}
                          onClick={() => setExtraSelection((selection) => {
                            const selected = selection.key === selectionKey ? selection.ids : [];
                            return {
                              key: selectionKey,
                              ids: enabled ? selected.filter((id) => id !== extra.id) : [...selected, extra.id],
                            };
                          })}
                          className="order-option-row">
                          <Icon size={16} className="order-option-icon" aria-hidden="true" />
                          <span className="order-option-copy">
                            <span className="order-option-heading">{title}</span>
                            <span className="order-option-fee" id={optionId + "-" + extra.id + "-fee"}>{fee}</span>
                          </span>
                          <span aria-hidden="true" className="order-option-switch"><span>{enabled && <Check size={11} strokeWidth={3} />}</span></span>
                        </button>
                      );
                    })}
                  </div>
                </section>

                {/* Summary rows */}
                <div className="space-y-3 pt-4 border-t border-white/[0.06] text-sm">
                  <div className="flex items-center justify-between text-zinc-400">
                    <span>{t("estimatedDelivery")}</span>
                    <strong className="text-white font-medium tabular-nums">
                      {quoteRequired ? (translateText(language, "To be confirmed", "Cần xác nhận")) : `${minHours}–${maxHours} ${translateText(language, "hours", "giờ")}`}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between text-zinc-400">
                    <span>{t("services")}</span>
                    <strong className="text-white font-medium">
                      {serviceCopyFor(language, service.slug as ServiceSlug).name}
                    </strong>
                  </div>
                </div>
              </div>

              {/* CTA Button and Security Notice */}
              <div className="mt-8">
                {!quoteRequired && <button type="button" className="add-to-cart-button" disabled={money.amount(adjustedPrice) === null} onClick={() => reviewPlan(true)}>{translateText(language, "Add to cart", "Thêm vào giỏ hàng")} ＋</button>}
                <button
                  type="button"
                  className="order-start-boost w-full px-6 font-sans font-bold flex items-center justify-center gap-2 cursor-pointer"
                  disabled={!quoteRequired && money.amount(adjustedPrice) === null}
                  onClick={() => reviewPlan()}
                >
                  <span>{quoteRequired ? pendingQuote : translateText(language, "Continue to checkout", "Tiếp tục thanh toán")}</span>
                  <ArrowRight size={17} aria-hidden="true" />
                </button>
                <small className="flex items-center justify-center gap-1.5 text-xs leading-relaxed text-zinc-400 text-center mt-3.5">
                  <ShieldCheck size={14} className="text-[#FF9F3C]" /> {t("instantAssignment")}
                </small>
              </div>
            </div>

          </div>
          )}
          </div>
        </div>
      </div>

      {/* Mobile Floating Plan Bar */}
      {inView && !s.modal && !hasCategoryForm && service.slug !== "coaching" && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0e1014]/90 backdrop-blur-xl border-t border-white/10 p-3.5 px-5 flex items-center justify-between shadow-2xl">
          <div>
            <strong className="text-lg font-bold text-white block">
              {quoteRequired ? pendingQuote : money.format(adjustedPrice)}
            </strong>
            <span className="text-xs text-zinc-400">
              {s.region} ·{" "}
              {unitService
                ? serviceCopyFor(language, service.slug as ServiceSlug).name
                : rankSummary}
            </span>
          </div>
          <button
            type="button"
            className="mobile-start-boost px-4 font-semibold flex items-center gap-1.5"
            disabled={!quoteRequired && money.amount(adjustedPrice) === null}
            onClick={() => reviewPlan()}
          >
            {quoteRequired ? pendingQuote : translateText(language, "Continue to checkout", "Tiếp tục thanh toán")} <ArrowRight size={15} aria-hidden="true" />
          </button>
        </div>
      )}
    </section>
  );
}
