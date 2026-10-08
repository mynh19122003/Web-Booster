"use client";
import { translateText } from "@/lib/i18n";

import { NumberInput } from "@/components/ui/NumberInput";
import { useRouter } from "next/navigation";
import { useCart } from "@/store/useCart";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowRight, Check, Minus, Plus, Search, ShieldCheck } from "lucide-react";
import { productsByGame, categoryKeys } from "@/lib/product-categories";
import { gameConfigFor } from "@/lib/game-config";
import { ranksFor } from "@/lib/service-options";
import { estimateQuote } from "@/lib/quote";
import { useStore } from "@/store/useStore";
import { useLanguage } from "@/components/ui/LanguageProvider";
import { CurrencySwitch, useMoney } from "@/components/ui/Currency";
import { RegionSelector } from "@/components/ui/RegionSelector";
import { regionsForGame } from "@/data/regions";
import { lolChampions } from "@/data/lol-champions";

const categoryCopy: Record<string, { en: string; vi: string; unit: string; unitVi: string; max: number }> = {
  games: { en: "Choose your duo partner and the number of games you want to play together.", vi: "Chọn hình thức chơi cùng pro và số trận bạn muốn chơi.", unit: "games", unitVi: "trận", max: 20 },
  wins: { en: "Set your current rank and the number of ranked wins you want.", vi: "Chọn rank hiện tại và số trận thắng xếp hạng mong muốn.", unit: "wins", unitVi: "trận thắng", max: 20 },
  "ranked-wins": { en: "Choose your current rank and the number of top-four finishes.", vi: "Chọn rank hiện tại và số trận đạt top 4 mong muốn.", unit: "top-four finishes", unitVi: "trận top 4", max: 20 },
  placements: { en: "Plan your placement matches for the start of the season.", vi: "Lên kế hoạch cho các trận phân hạng đầu mùa.", unit: "placement matches", unitVi: "trận phân hạng", max: 5 },
  normals: { en: "Choose your mode and build a plan for normal matches.", vi: "Chọn chế độ và số trận đấu thường cần hoàn thành.", unit: "matches", unitVi: "trận", max: 30 },
  unrated: { en: "Plan your unrated games with your preferred play style.", vi: "Lên kế hoạch chơi Unrated theo nhu cầu của bạn.", unit: "matches", unitVi: "trận", max: 30 },
  mastery: { en: "Choose a champion and the mastery level you want to reach.", vi: "Chọn tướng và cấp thông thạo bạn muốn đạt.", unit: "levels", unitVi: "cấp", max: 10 },
  challenges: { en: "Choose the challenge you want to work toward.", vi: "Chọn thử thách và mục tiêu bạn muốn hoàn thành.", unit: "goals", unitVi: "mục tiêu", max: 10 },
  "battle-pass": { en: "Set your current pass level and your destination.", vi: "Chọn cấp Battle Pass hiện tại và mục tiêu.", unit: "levels", unitVi: "cấp", max: 100 },
  "set-pass": { en: "Build a progression plan for your TFT Set Pass.", vi: "Lên kế hoạch tiến độ Set Pass của TFT.", unit: "levels", unitVi: "cấp", max: 100 },
  honor: { en: "Choose your current Honor level and your goal.", vi: "Chọn cấp Vinh danh hiện tại và mục tiêu.", unit: "levels", unitVi: "cấp", max: 5 },
  clash: { en: "Choose a tournament plan and tell us about your team.", vi: "Chọn kế hoạch giải đấu và cung cấp thông tin đội của bạn.", unit: "tournaments", unitVi: "giải đấu", max: 5 },
  arena: { en: "Choose an Arena plan and the number of games.", vi: "Chọn kế hoạch Arena và số trận muốn chơi.", unit: "games", unitVi: "trận", max: 20 },
};

export function CategoryConfigurator({ game, productId }: { game: string; productId: string }) {
  const s = useStore();
  const router = useRouter();
  const { language, t } = useLanguage();
  const money = useMoney();
  const text = (en: string, vi: string) => translateText(language, en, vi);
  const config = gameConfigFor(game);
  const product = productsByGame[game]?.find((item) => item.id === productId);
  const title = t((categoryKeys[productId] ?? "categoryDivisions") as Parameters<typeof t>[0]);
  const copy = categoryCopy[productId];
  const account = productId === "accounts" || productId === "smurfs";
  const progression = ["mastery", "battle-pass", "set-pass", "honor"].includes(productId);
  const ranked = ["wins", "ranked-wins", "games", "placements"].includes(productId);
  const ranks = ranksFor(game);
  const [quantity, setQuantity] = useState(productId === "placements" ? 5 : 1);
  const [mode, setMode] = useState(productId === "games" ? "Ranked duo" : productId === "smurfs" ? "Fresh / Unranked" : "Ranked profile");
  const [rank, setRank] = useState(account ? "Unranked" : ranks[Math.min(s.current, ranks.length - 1)]);
  const [detail, setDetail] = useState("");
  const [budget, setBudget] = useState("Any budget");
  const [start, setStart] = useState(0);
  const [goal, setGoal] = useState(productId === "honor" ? 2 : 10);
  const [express, setExpress] = useState(false);
  const [notes, setNotes] = useState("");
  const [tftWinType, setTftWinType] = useState<"top4" | "first">("top4");
  const [clashTier, setClashTier] = useState("Tier IV");
  const [clashBoosters, setClashBoosters] = useState(1);
  const [attempted, setAttempted] = useState(false);
  const [inView, setInView] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const goalRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting));
    if (panelRef.current) observer.observe(panelRef.current);
    return () => observer.disconnect();
  }, []);
  const max = copy?.max ?? 1;
  const quoteRequired = productId !== "placements";
  const base = estimateQuote(0, 1, s.queue, "placements", quantity, game);
  const price = quoteRequired ? 0 : base.price * (express ? 1.2 : 1);
  const from = account ? mode : progression ? `${title}: ${start}` : ranked ? rank : title;
  const unit = translateText(language, copy?.unit ?? "games", copy?.unitVi);
  const to = account ? `${rank} · ${budget}` : progression ? `${title}: ${goal}${detail ? ` · ${detail}` : ""}` : `${quantity} ${unit}${productId === "games" ? ` · ${mode}` : ""}${detail ? ` · ${detail}` : ""}`;
  const options = productId === "games" ? ["Ranked duo", "High-rank duo", "Casual duo"] : account ? ["Ranked profile", "Fresh / Unranked"] : [];
  const optionName = (option: string) => ({ "Ranked duo": text("Ranked duo", "Chơi đôi xếp hạng"), "High-rank duo": text("High-rank duo", "Chơi đôi rank cao"), "Casual duo": text("Casual duo", "Chơi đôi thường"), "Ranked profile": text("Ranked profile", "Tài khoản có rank"), "Fresh / Unranked": text("Fresh / Unranked", "Tài khoản chưa rank") }[option] ?? option);
  const queues = productId === "placements" ? game === "teamfight-tactics" ? ["Ranked", "Double Up"] : game === "valorant" ? ["Competitive"] : config.queues : productId === "games" ? ["Duo"] : productId === "normals" ? ["Normal Draft", "Quickplay", "ARAM"] : productId === "unrated" ? ["Unrated", "Swiftplay"] : productId === "arena" ? ["Arena"] : config.queues;
  const Icon = product?.icon ?? Search;
  const valid = !["mastery", "challenges", "clash"].includes(productId) || Boolean(detail.trim());
  const unavailablePrice = !quoteRequired && money.amount(price) === null;
  const reviewLabel = quoteRequired ? text("Review request", "Xem yêu cầu") : t("reviewPlan");

  function review(addOnly = false) {
    if (!valid) {
      setAttempted(true);
      goalRef.current?.focus();
      goalRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    const extraNotes = [
      productId === "ranked-wins" ? (tftWinType === "first" ? "Target: 1st Place Only" : "Target: Top 4 Finish") : "",
      productId === "clash" ? `Clash: ${clashTier} · ${clashBoosters} Booster(s)` : "",
      detail.trim(),
      notes.trim(),
      express ? "Express priority" : "",
    ].filter(Boolean).join(" · ");

    s.set({
      units: progression ? goal - start : quantity,
      quoteOverride: price,
      quoteAddOns: express ? ["Express priority"] : [],
      modal: null,
      coachBooking: null,
      accountPurchase: null,
      checkoutDetails: { name: title, from, to, quoteRequired },
      champions: productId === "mastery" ? detail.trim() : (extraNotes || s.champions),
    });
    const params = new URLSearchParams({ type:"boost", game, service:s.service, name:title, from, to, region:s.region, queue:s.queue, role:s.role, units:String(progression ? goal - start : quantity), amount:String(price), base:String(price), quote:String(quoteRequired), champions:extraNotes, category:productId });
    if (express) params.append("option", "Express priority");
    const href = `/checkout?${params}`;
    if (!quoteRequired) useCart.getState().add(href, addOnly);
    if (!addOnly) router.push(href);
  }

  return (
    <div className="category-layout" ref={panelRef}>
      <div className="category-fields">
        <header className="category-header">
          <span className="category-icon"><Icon size={24} aria-hidden="true" /></span>
          <div><p>{config.name}</p><h3>{title}</h3></div>
        </header>
        <p className="category-description">{account ? text("Set your preferred account profile, server and budget. We will confirm matching availability before you purchase.", "Chọn hồ sơ tài khoản, máy chủ và ngân sách. Tài khoản phù hợp sẽ được xác nhận trước khi mua.") : translateText(language, copy?.en ?? "", copy?.vi)}</p>

        {options.length > 0 && <div className="category-packages" role="group" aria-label={text("Choose a plan", "Chọn gói")}>
          {options.map((option) => <button key={option} type="button" aria-pressed={mode === option} onClick={() => setMode(option)}>
            <Icon size={20} aria-hidden="true" /><strong>{optionName(option)}</strong>{mode === option && <Check size={16} aria-hidden="true" />}
          </button>)}
        </div>}

        <div className="category-form-grid">
          {(ranked || account) && <label className="category-field">{account ? text("Preferred rank", "Rank mong muốn") : productId === "placements" ? text("Previous season rank", "Rank mùa trước") : t("currentRank")}
            <select value={rank} onChange={(event) => setRank(event.target.value)}>{(account || productId === "placements" ? ["Unranked", ...ranks] : ranks).map((item) => <option key={item}>{item}</option>)}</select>
          </label>}
          <div className="category-field"><RegionSelector value={s.region} options={regionsForGame(game)} onChange={(region) => s.set({ region })} /></div>
          {account ? <label className="category-field">{text("Budget (USD)", "Ngân sách (USD)")}
            <select value={budget} onChange={(event) => setBudget(event.target.value)}>{["Any budget", "Under $50", "$50–$100", "$100–$200", "$200+"].map((item) => <option key={item}>{item}</option>)}</select>
          </label> : <label className="category-field">{t("queue")}
            <select value={s.queue} onChange={(event) => s.set({ queue: event.target.value })}>
              {queues.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>}
          {productId === "ranked-wins" && (
            <div className="category-field category-field-wide">
              <span className="text-xs font-semibold uppercase text-zinc-400 block mb-1">
                {text("Win Condition", "Điều kiện xếp hạng")}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  className={`px-3 py-2 rounded-lg border text-xs font-medium cursor-pointer transition-all ${tftWinType === "top4" ? "border-amber-400/80 bg-amber-500/20 text-white" : "border-white/10 bg-black/30 text-zinc-400 hover:text-white"}`}
                  onClick={() => setTftWinType("top4")}
                >
                  {translateText(language, "Top 4 Finish (Standard)", "Top 4 (Tiêu chuẩn)")}</button>
                <button
                  type="button"
                  className={`px-3 py-2 rounded-lg border text-xs font-medium cursor-pointer transition-all ${tftWinType === "first" ? "border-amber-400/80 bg-amber-500/20 text-white" : "border-white/10 bg-black/30 text-zinc-400 hover:text-white"}`}
                  onClick={() => setTftWinType("first")}
                >
                  {translateText(language, "1st Place Only (First Pick)", "Chỉ hạng nhất")}</button>
              </div>
            </div>
          )}
          {productId === "clash" && (
            <>
              <label className="category-field">
                {text("Clash Tier", "Bậc giải Clash")}
                <select value={clashTier} onChange={(e) => setClashTier(e.target.value)}>
                  {["Tier I", "Tier II", "Tier III", "Tier IV"].map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </label>
              <label className="category-field">
                {text("Boosters Count", "Số lượng booster")}
                <select value={clashBoosters} onChange={(e) => setClashBoosters(Number(e.target.value))}>
                  {[1, 2, 3, 4, 5].map((count) => (
                    <option key={count} value={count}>{count} {count === 1 ? "Booster" : "Boosters"}</option>
                  ))}
                </select>
              </label>
            </>
          )}
          {["wins", "ranked-wins"].includes(productId) && <label className="category-field">{game === "valorant" ? "RR / win" : "LP / win"}
            <select value={detail} onChange={(event) => setDetail(event.target.value)}><option value="">{text("Choose expected gain", "Chọn điểm nhận mỗi trận")}</option>{[14, 17, 19, 22, 25, 28, 30, 33].map((points) => <option key={points}>{points} {game === "valorant" ? "RR" : "LP"} {translateText(language, "/ win", "/ trận thắng")}</option>)}</select>
          </label>}
          {["mastery", "challenges", "clash"].includes(productId) && <label className="category-field category-field-wide">{productId === "mastery" ? text("Champion", "Tướng") : productId === "clash" ? text("Team / tournament", "Đội / giải đấu") : text("Challenge / target", "Thử thách / mục tiêu")} *
            <input ref={goalRef} list={productId === "mastery" ? "lol-champions-list" : undefined} value={detail} onChange={(event) => setDetail(event.target.value)} placeholder={productId === "mastery" ? "e.g. Ahri, Zed..." : text("Enter your goal", "Nhập mục tiêu của bạn")} maxLength={150} required aria-invalid={attempted && !valid} aria-describedby={`goal-help-${productId}`} />
            {productId === "mastery" && (
              <datalist id="lol-champions-list">
                {lolChampions.slice(0, 50).map((c) => (
                  <option key={c.id} value={c.name} />
                ))}
              </datalist>
            )}
            <span id={`goal-help-${productId}`} className={attempted && !valid ? "category-field-error" : "category-field-hint"} role={attempted && !valid ? "alert" : undefined}>{attempted && !valid ? text("Please enter your goal to continue.", "Vui lòng nhập mục tiêu để tiếp tục.") : text("Required to prepare your plan.", "Cần thông tin này để lập kế hoạch cho bạn.")}</span>
          </label>}
          {account && <label className="category-field category-field-wide">{text("Champions, agents or cosmetics", "Tướng, agent hoặc vật phẩm mong muốn")}
            <div className="category-search"><Search size={18} aria-hidden="true" /><input value={detail} onChange={(event) => setDetail(event.target.value)} placeholder={text("Describe your preferred account…", "Mô tả tài khoản mong muốn…")} maxLength={150} /></div>
          </label>}
        </div>

        {progression ? <div className="category-form-grid category-quantity">
          <label className="category-field">{text("Current level", "Cấp hiện tại")}<NumberInput type="number" min={0} max={max - 1} value={start} onChange={(event) => { const value = Math.max(0, Math.min(max - 1, Math.floor(Number(event.target.value) || 0))); setStart(value); setGoal(Math.max(goal, value + 1)); }} /></label>
          <label className="category-field">{text("Target level", "Cấp mục tiêu")}<NumberInput type="number" min={start + 1} max={max} value={goal} onChange={(event) => setGoal(Math.max(start + 1, Math.min(max, Math.floor(Number(event.target.value) || start + 1))))} /></label>
        </div> : !account && <div className="category-quantity">
          <label htmlFor={`quantity-${productId}`}>{text("Number of", "Số lượng")} {unit}</label>
          <div className="category-stepper"><button type="button" aria-label={text("Decrease quantity", "Giảm số lượng")} disabled={quantity <= 1} onClick={() => setQuantity(quantity - 1)}><Minus size={18} /></button>
            <NumberInput id={`quantity-${productId}`} type="number" min={1} max={max} value={quantity} onChange={(event) => setQuantity(Math.max(1, Math.min(max, Math.floor(Number(event.target.value) || 1))))} />
            <button type="button" aria-label={text("Increase quantity", "Tăng số lượng")} disabled={quantity >= max} onClick={() => setQuantity(quantity + 1)}><Plus size={18} /></button>
          </div>
          <input aria-label={text("Quantity slider", "Thanh số lượng")} type="range" min={1} max={max} value={quantity} onChange={(event) => setQuantity(Number(event.target.value))} />
          <div className="category-quantity-scale"><span>1</span><span>{max}</span></div>
          <div className="category-presets" role="group" aria-label={text("Quick quantities", "Chọn số lượng nhanh")}>{[1, 3, 5, 10, 20].filter((value) => value <= max).map((value) => <button key={value} type="button" aria-pressed={quantity === value} onClick={() => setQuantity(value)}>{value}</button>)}</div>
        </div>}

        {account && <div className="category-availability"><ShieldCheck size={22} aria-hidden="true" /><div><strong>{text("Find a matching account", "Tìm tài khoản phù hợp")}</strong><p>{text("Send your preferences to confirm stock, account details and a final price.", "Gửi tiêu chí để xác nhận tài khoản sẵn có, thông tin tài khoản và giá cuối cùng.")}</p></div></div>}
        <details className="category-optional"><summary>{text("Additional preferences", "Yêu cầu bổ sung")}<small>{notes ? text("Added", "Đã thêm") : text("Optional", "Không bắt buộc")}</small></summary>
          <label className="category-field category-notes">{text("Your notes", "Ghi chú của bạn")}<textarea rows={3} value={notes} onChange={(event) => setNotes(event.target.value)} maxLength={500} placeholder={text("Schedule, preferred role or other details…", "Thời gian, vị trí hoặc yêu cầu khác…")} /><span className="category-field-hint">{notes.length}/500</span></label>
        </details>
      </div>

      <aside className="category-summary">
        <div className="category-summary-heading"><h4>{t("orderSummary")}</h4><CurrencySwitch /></div>
        <p className="category-game-name">{config.name}</p><h3>{title}</h3>
        <dl><div><dt>{account ? text("Profile", "Hồ sơ") : progression ? text("Progress", "Tiến độ") : t("currentRank")}</dt><dd>{from}</dd></div><div><dt>{text("Your goal", "Mục tiêu")}</dt><dd>{to}</dd></div><div><dt>{t("region")}</dt><dd>{s.region}</dd></div>{!account && <div><dt>{t("queue")}</dt><dd>{s.queue}</dd></div>}</dl>
        <div className="category-price" aria-live="polite">{quoteRequired ? <><strong>{text("Custom quote", "Báo giá riêng")}</strong><p>{text("Price confirmed after reviewing your preferences.", "Giá được xác nhận theo yêu cầu của bạn.")}</p></> : <><strong>{money.format(price)}</strong><span>{money.currency} · {t("estimatedQuote")}</span></>}</div>
        {!account && <button type="button" className="category-extra" aria-pressed={express} onClick={() => setExpress(!express)}><span><strong>{translateText(language, "Express priority", "Ưu tiên xử lý")}</strong><small>{quoteRequired ? text("Include in quote", "Thêm vào yêu cầu báo giá") : "+20%"}</small></span><span className="category-check">{express && <Check size={16} />}</span></button>}
        {!quoteRequired && <p className="category-delivery">{t("estimatedDelivery")} <strong>{base.minHours}–{base.maxHours} {translateText(language, "hours", "giờ")}</strong></p>}
        {!quoteRequired && <button type="button" className="add-to-cart-button" disabled={unavailablePrice} onClick={() => review(true)}>{text("Add to cart", "Thêm vào giỏ hàng")} ＋</button>}
        <button type="button" className="order-start-boost category-review" disabled={unavailablePrice} onClick={() => review()}>{quoteRequired ? reviewLabel : text("Continue to checkout", "Tiếp tục thanh toán")}<ArrowRight size={18} aria-hidden="true" /></button>
        {unavailablePrice && <p className="category-validation" role="status">{text("Currency rate unavailable. Choose USD to continue.", "Chưa có tỷ giá. Chọn USD để tiếp tục.")}</p>}
        <p className="category-summary-note"><ShieldCheck size={15} aria-hidden="true" />{text("Review your details before submitting", "Kiểm tra thông tin trước khi gửi")}</p>
      </aside>
      {inView && !s.modal && createPortal(<div className="category-mobile-review">
        <div><strong>{quoteRequired ? text("Custom quote", "Báo giá riêng") : money.format(price)}</strong><small>{title} · {account ? rank : progression ? `${start} → ${goal}` : `${quantity} ${unit}`}</small></div>
        <button type="button" className="mobile-start-boost" disabled={unavailablePrice} onClick={() => review()}>{quoteRequired ? reviewLabel : text("Continue to checkout", "Tiếp tục thanh toán")}<ArrowRight size={16} aria-hidden="true" /></button>
      </div>, document.body)}
    </div>
  );
}
