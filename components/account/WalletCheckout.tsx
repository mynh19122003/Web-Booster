"use client";
import { UiText } from "@/components/ui/UiText";

import { intlLocales, translateText } from "@/lib/i18n";
import { categoryKeys } from "@/lib/product-categories";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Check, ChevronDown, LockKeyhole, ShieldCheck } from "lucide-react";
import { useLanguage } from "@/components/ui/LanguageProvider";
import { useMoney } from "@/components/ui/Currency";
import { coachFor } from "@/data/coaches";
import { coachOffers, coachPricing } from "@/data/coach-profile";
import { useStore } from "@/store/useStore";
import { useCart } from "@/store/useCart";
import { games } from "@/data/games";
import { servicesFor } from "@/lib/service-options";
import { serviceCopyFor } from "@/data/service-copy";
import type { ServiceSlug } from "@/lib/service-options";

const topUpAmounts = [25, 50, 100, 150, 250, 500];

function BrandMark() {
  return <span className="wallet-checkout-mark"><Image src="/icon.svg" alt="ASCEND" width={42} height={42} /></span>;
}

function PaymentLogos({ simple = false }: { simple?: boolean }) {
  const marks = simple
    ? [["Visa", "visa.svg", 42], ["Mastercard", "mastercard.svg", 24], ["Apple Pay", "applepay.svg", 34], ["Google Pay", "googlepay.svg", 40]]
    : [["Visa", "visa.svg", 42], ["Mastercard", "mastercard.svg", 24], ["American Express", "americanexpress.svg", 30], ["Apple Pay", "applepay.svg", 34], ["Google Pay", "googlepay.svg", 40]];
  return <span className="wallet-payment-brands">{marks.map(([name, file, width]) => <span className="wallet-payment-brand" key={name as string} title={name as string}><Image src={`/images/payments/${file}`} alt={name as string} width={width as number} height={20} /></span>)}</span>;
}

export function WalletCheckout() {
  const searchParams = useSearchParams();
  const { language, t } = useLanguage();
  const money = useMoney();
  const coaching = searchParams.get("type") === "coaching";
  const boost = searchParams.get("type") === "boost";
  const boostGame = games.find(game => game.slug === searchParams.get("game"));
  const boostService = boostGame ? servicesFor(boostGame.slug).find(service => service.slug === searchParams.get("service")) : undefined;
  const category = searchParams.get("category");
  const boostTitle = searchParams.get("account") ? `${translateText(language, "Account", "Tài khoản")} #${searchParams.get("account")}` : category && categoryKeys[category] ? t(categoryKeys[category] as Parameters<typeof t>[0]) : boostService ? serviceCopyFor(language, boostService.slug as ServiceSlug).name : "";
  const needsQuote = boost && searchParams.get("quote") === "true";
  const boostOptions = searchParams.getAll("option");
  const coach = coaching ? coachFor(searchParams.get("coach") ?? "") : undefined;
  const booking = useStore(state => state.coachBooking);
  const quantityParam = Number(searchParams.get("quantity"));
  const quantity = Number.isFinite(quantityParam) ? Math.min(10, Math.max(1, Math.floor(quantityParam))) : 1;
  const mode = searchParams.get("mode") === "coaching" ? "coaching" : "duo";
  const offers = coach ? coachOffers(coach) : [];
  const offer = offers.find(item => item.id === searchParams.get("offer")) ?? offers[0];
  const pricing = coach ? coachPricing(mode === "coaching" ? coach.hourlyRate : offer.price, quantity) : null;
  const amountParam = Number(searchParams.get("amount"));
  const amount = boost ? (Number.isFinite(amountParam) && amountParam >= 0 ? amountParam : 0) : pricing?.total ?? (topUpAmounts.includes(amountParam) ? amountParam : 50);
  const baseParam = Number(searchParams.get("base"));
  const boostBase = Number.isFinite(baseParam) && baseParam >= 0 ? Math.min(baseParam, amount) : amount;
  const bonusRate = coaching || boost ? 0 : amount === 25 ? 0 : amount === 50 ? 0.02 : amount === 100 ? 0.03 : amount === 150 ? 0.04 : amount === 250 ? 0.05 : 0.06;
  const [method, setMethod] = useState("card");
  const [showPaymentNotice, setShowPaymentNotice] = useState(false);
  const [country, setCountry] = useState("Vietnam");
  const regionNames = new Intl.DisplayNames([intlLocales[language]], { type: "region" });
  const checkoutQuery = searchParams.toString();
  useEffect(() => {
    if (needsQuote || (boost && (!boostGame || !boostService)) || (coaching && !coach)) return;
    let active = true;
    void Promise.resolve(useCart.persist.rehydrate()).then(() => { if (active) useCart.getState().add(`/checkout?${checkoutQuery}`); });
    return () => { active = false; };
  }, [checkoutQuery, needsQuote, boost, boostGame, boostService, coaching, coach]);

  if (coaching && !coach) return <main className="wallet-checkout-page" id="main"><h1>{translateText(language, "Coach not found", "Không tìm thấy coach")}</h1><Link href="/coaches">{translateText(language, "Browse coaches", "Chọn coach")}</Link></main>;
  if (boost && (!boostGame || !boostService || !searchParams.get("from") || !searchParams.get("to"))) return <main className="wallet-checkout-page"><h1>{translateText(language, "No plan selected", "Chưa có gói được chọn")}</h1><Link href="/#configure">{translateText(language, "Choose your plan", "Chọn gói dịch vụ")}</Link></main>;

  return <main className="wallet-checkout-page" id="main">
    <header className="wallet-checkout-header"><BrandMark /><h1>{translateText(language, "Checkout", "Thanh toán")}</h1></header>
    <div className="wallet-checkout-layout">
      <div className="wallet-checkout-main">
        <div className="wallet-demo-banner"><Check size={15} /> {translateText(language, "Checkout preview · No real payment will be taken", "Bản xem trước thanh toán · Không thu tiền thật")}</div>
        <section className="wallet-checkout-card">
          <div className="wallet-checkout-section-title"><div><small>{translateText(language, "PAYMENT METHOD", "PHƯƠNG THỨC THANH TOÁN")}</small><h2>{translateText(language, "Choose how to pay", "Chọn cách thanh toán")}</h2></div><span>2 {translateText(language, "options", "tùy chọn")}</span></div>
          <button type="button" className="wallet-payment-method" aria-pressed={method === "card"} onClick={() => setMethod("card")}>
            <span className="wallet-payment-radio">{method === "card" && <Check size={13} />}</span><strong>{translateText(language, "Credit or debit card", "Thẻ tín dụng hoặc ghi nợ")}</strong><small><UiText english={"Visa, Mastercard, Amex & wallets"} /></small><PaymentLogos />
          </button>
          <button type="button" className="wallet-payment-method wallet-payment-simple" aria-pressed={method === "simplepay"} onClick={() => setMethod("simplepay")}>
            <span className="wallet-payment-radio">{method === "simplepay" && <Check size={13} />}</span><strong>SimplePay</strong><small>{translateText(language, "Cards, Apple Pay & Google Pay", "Thẻ, Apple Pay và Google Pay")}</small><PaymentLogos simple />
          </button>
          <details className="wallet-more-methods"><summary><span>＋ &nbsp;{translateText(language, "More payment options", "Thêm phương thức thanh toán")} <small>(3)</small></span><span className="wallet-payment-brands"><span className="wallet-payment-brand"><Image src="/images/payments/paypal.svg" alt="PayPal" width={36} height={20} /></span><span className="wallet-payment-brand"><Image src="/images/payments/bancontact.svg" alt="Bancontact" width={34} height={20} /></span><span className="wallet-payment-brand"><Image src="/images/payments/bitcoin.svg" alt="Bitcoin" width={20} height={20} /></span></span><ChevronDown size={15} /></summary><div><span>PayPal</span><span>{translateText(language, "Bank transfer", "Chuyển khoản")}</span><span><UiText english={"Crypto"} /></span></div></details>
        </section>
        <section className="wallet-checkout-card wallet-billing-card">
          <div className="wallet-checkout-section-title"><div><small>{translateText(language, "BILLING", "HÓA ĐƠN")}</small><h2>{translateText(language, "Billing details", "Thông tin hóa đơn")}</h2><p>{translateText(language, "Required where tax compliance applies.", "Cần thiết khi áp dụng thuế.")}</p></div></div>
          <div className="wallet-billing-grid">
            <label><span>{translateText(language, "Country / region", "Quốc gia / khu vực")}</span><div className="wallet-select-wrap"><select value={country} onChange={(event) => setCountry(event.target.value)}>{[["Vietnam", "VN"], ["United States", "US"], ["United Kingdom", "GB"], ["France", "FR"], ["Germany", "DE"], ["Canada", "CA"], ["Australia", "AU"]].map(([name, code]) => <option key={code} value={name}>{regionNames.of(code)}</option>)}</select><ChevronDown size={15} /></div><small>{country === "Vietnam" ? "TAX 0%" : (translateText(language, "Tax calculated by billing address", "Thuế được tính theo địa chỉ"))}</small></label>
            <label><span>{translateText(language, "Full name", "Họ và tên")}</span><input autoComplete="name" placeholder={translateText(language, "Enter your full name", "Nhập họ và tên")} /></label>
            <label className="wallet-billing-wide"><span>{translateText(language, "Address", "Địa chỉ")}</span><input autoComplete="street-address" placeholder={translateText(language, "Street address", "Số nhà và tên đường")} /></label>
            <label><span>{translateText(language, "City", "Thành phố")}</span><input autoComplete="address-level2" placeholder={translateText(language, "City", "Thành phố")} /></label>
            <label><span>{translateText(language, "Postal code", "Mã bưu chính")}</span><input autoComplete="postal-code" placeholder={translateText(language, "Postal code", "Mã bưu chính")} /></label>
          </div>
        </section>
      </div>

      <aside className="wallet-checkout-summary">
        <div className="wallet-checkout-product">{boostGame && boost ? <Image src={boostGame.logo} alt={boostGame.name} width={42} height={42} /> : coach ? <Image src={`/images/coaches/${coach.slug}.svg`} alt={coach.name} width={42} height={42} /> : <BrandMark />}<strong>{boost ? `${boostGame?.name} · ${boostTitle}` : coach ? `${coach.name} · ${mode === "duo" ? "Duo" : "Coaching"}` : translateText(language, "Wallet top-up {value0}", "Nạp tiền Wallet {value0}", {value0: money.format(amount)})}</strong></div>
        {boost && searchParams.get("account") && <div className="boost-checkout-details"><p>{searchParams.get("to")}</p><dl><div><dt>{translateText(language, "Account", "Tài khoản")}</dt><dd>#{searchParams.get("account")}</dd></div><div><dt>{translateText(language, "Server", "Máy chủ")}</dt><dd>{searchParams.get("region")}</dd></div></dl><Link href={`/games/${boostGame?.slug}#configure`}>{translateText(language, "Continue shopping", "Tiếp tục mua sắm")} →</Link></div>}
        {boost && !searchParams.get("account") && <div className="boost-checkout-details">
          <div className="boost-checkout-ranks"><div><small>{translateText(language, "Current rank", "Rank hiện tại")}</small><strong>{searchParams.get("from")}</strong></div><span aria-hidden="true">→</span><div><small>{translateText(language, "Desired rank", "Rank mong muốn")}</small><strong>{searchParams.get("to")}</strong></div></div>
          <dl><div><dt>{translateText(language, "Region", "Khu vực")}</dt><dd>{searchParams.get("region")}</dd></div><div><dt>{translateText(language, "Queue", "Chế độ")}</dt><dd>{searchParams.get("queue")}</dd></div><div><dt>{translateText(language, "Role", "Vị trí")}</dt><dd>{searchParams.get("role")}</dd></div><div><dt><UiText english={"LP / win"} /></dt><dd>{searchParams.get("lpGain")}</dd></div>{Number(searchParams.get("units")) > 1 && <div><dt>{translateText(language, "Quantity", "Số lượng")}</dt><dd>{searchParams.get("units")}</dd></div>}{searchParams.get("champions") && <div><dt>{translateText(language, "Preferred champions", "Tướng ưu tiên")}</dt><dd>{searchParams.get("champions")}</dd></div>}{searchParams.get("delivery") && <div><dt>{translateText(language, "Estimated delivery", "Dự kiến hoàn thành")}</dt><dd>{searchParams.get("delivery")} {translateText(language, "hours", "giờ")}</dd></div>}</dl>
          {boostOptions.length > 0 && <div className="boost-checkout-options"><small>{translateText(language, "Selected options", "Tùy chọn đã chọn")}</small>{boostOptions.map((option, index) => <span key={`${option}-${index}`}><Check size={13} />{translateText(language, option)}</span>)}</div>}
          <Link href={`/games/${boostGame?.slug}#configure`}>{translateText(language, "Edit your plan", "Chỉnh sửa gói")} →</Link>
        </div>}
        {coach && <div className="coach-checkout-details"><p>{coach.gameName} · {coach.server}</p><p>{quantity} {mode === "duo" ? (translateText(language, "games", "trận")) : (translateText(language, "hours", "giờ"))}{mode === "duo" ? ` · ${offer.startRank} → ${offer.targetRank}` : ` · ${coach.sessionFormats.includes(searchParams.get("format") as "live" | "vod") ? searchParams.get("format") : coach.sessionFormats[0]}`}</p><p>{searchParams.get("date")} · {searchParams.get("time")} · {searchParams.get("timezone")}</p>{booking?.coachId === coach.slug && booking.goals && <p>{translateText(language, "Goals", "Mục tiêu")}: {booking.goals}</p>}{booking?.coachId === coach.slug && mode === "coaching" && booking.sessionFormat === "vod" && booking.replayUrl && <p>{translateText(language, "Replay", "Replay")}: {booking.replayUrl}</p>}<Link href={`/coaches/${coach.slug}`}>{translateText(language, "Edit session", "Chỉnh sửa buổi học")}</Link><small>{translateText(language, "Coach and availability use demo data; this is not a confirmed booking.", "Coach và lịch học dùng dữ liệu mẫu; chưa xác nhận đặt lịch.")}</small></div>}
        <div className="wallet-checkout-line"><span>{translateText(language, "Base price", "Giá gói")}</span><strong>{needsQuote ? (translateText(language, "Quote required", "Chờ báo giá")) : money.format(boost ? boostBase : pricing?.subtotal ?? amount)}</strong></div>
        {boost && !needsQuote && amount > boostBase && <div className="wallet-checkout-line"><span>{translateText(language, "Order options", "Phí tùy chọn")}</span><strong>{money.format(amount - boostBase)}</strong></div>}
        {pricing && pricing.discount > 0 && <div className="wallet-checkout-line wallet-checkout-bonus"><span>{translateText(language, "Volume discount", "Giảm giá số lượng")} ({Math.round(pricing.discountRate * 100)}%)</span><strong>−{money.format(pricing.discount)}</strong></div>}
        {bonusRate > 0 && <div className="wallet-checkout-line wallet-checkout-bonus"><span><ShieldCheck size={15} /> {translateText(language, "Wallet top-up bonus +{value0}%", "Thưởng nạp tiền +{value0}%", {value0: Math.round(bonusRate * 100)})}</span><strong>{money.format(amount * bonusRate)}</strong></div>}
        <div className="wallet-checkout-total"><div><small>{translateText(language, "TOTAL DUE TODAY", "TỔNG HÔM NAY")}</small><span>{translateText(language, "Local taxes may apply", "Chưa bao gồm thuế địa phương nếu có")}</span></div><strong>{needsQuote ? "—" : money.format(amount)}</strong></div>
        {needsQuote ? <Link className="wallet-pay-now" href="/support">{translateText(language, "Request a quote", "Yêu cầu báo giá")}</Link> : <button type="button" className="wallet-pay-now" onClick={() => setShowPaymentNotice(true)}><LockKeyhole size={16} /> {translateText(language, "Pay now", "Thanh toán")}</button>}
        {showPaymentNotice && <p className="wallet-payment-notice" role="status">{translateText(language, "Payment processing is not connected. No payment was made.", "Cổng thanh toán chưa được kết nối. Không có khoản thanh toán nào được thực hiện.")}</p>}
        <div className="wallet-checkout-trust"><span>● {translateText(language, "Secure checkout", "Thanh toán an toàn")}</span><span>● {translateText(language, "24/7 support", "Hỗ trợ 24/7")}</span></div>
        <p className="wallet-checkout-terms">{translateText(language, "By proceeding, you agree to our ", "Bằng cách tiếp tục, bạn đồng ý với ")}<Link href="/legal/terms">{translateText(language, "Terms of Service", "Điều khoản dịch vụ")}</Link>.</p>
      </aside>
    </div>
  </main>;
}
