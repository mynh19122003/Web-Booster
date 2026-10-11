"use client";
import { UiText } from "@/components/ui/UiText";

import { intlLocales, translateText } from "@/lib/i18n";
import { categoryKeys } from "@/lib/product-categories";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Check,
  ChevronDown,
  LockKeyhole,
  CircleCheck,
} from "lucide-react";
import { useLanguage } from "@/components/ui/LanguageProvider";
import { useMoney } from "@/components/ui/Currency";
import type { Coach } from "@/data/coaches";
import { coachOffers, coachPricing } from "@/data/coach-profile";
import { useStore } from "@/store/useStore";
import { useCart } from "@/store/useCart";
import { paymentMethods } from "@/data/payment-methods";
import { billingCountryCodes } from "@/data/billing-countries";
import { useOrders, type PaymentMethod } from "@/store/useOrders";
import { games } from "@/data/games";
import { servicesFor } from "@/lib/service-options";
import { serviceCopyFor } from "@/data/service-copy";
import type { ServiceSlug } from "@/lib/service-options";
import RiotAccountForm from "@/components/checkout/RiotAccountForm";
import {
  requiresRiotCredentials,
  type OrderRequestInput,
  type RiotAccountDetails,
} from "@/lib/order-request-types";

function BrandMark() {
  return (
    <span className="wallet-checkout-mark">
      <Image src="/icon.svg" alt="ASCEND" width={42} height={42} />
    </span>
  );
}

export function WalletCheckout() {
  const searchParams = useSearchParams();
  const { language, t } = useLanguage();
  const money = useMoney();
  const coaching = searchParams.get("type") === "coaching";
  const boost = searchParams.get("type") === "boost";
  const boostGame = games.find(
    (game) => game.slug === searchParams.get("game"),
  );
  const boostService = boostGame
    ? servicesFor(boostGame.slug).find(
        (service) => service.slug === searchParams.get("service"),
      )
    : undefined;
  const category = searchParams.get("category");
  const boostTitle = searchParams.get("account")
    ? `${translateText(language, "Account", "Tài khoản")} #${searchParams.get("account")}`
    : category && categoryKeys[category]
      ? t(categoryKeys[category] as Parameters<typeof t>[0])
      : boostService
        ? serviceCopyFor(language, boostService.slug as ServiceSlug).name
        : "";
  const needsQuote = boost && searchParams.get("quote") === "true";
  const fulfillmentOrder = boost && !searchParams.get("account") && !needsQuote;
  const needsRiotAccount =
    fulfillmentOrder &&
    requiresRiotCredentials(
      boostService?.slug ?? "",
      searchParams.get("queue") ?? "",
    );
  const [riotAccount, setRiotAccount] = useState<RiotAccountDetails>({
    riotUsername: "",
    riotPass: "",
    riotIdTag: "",
  });
  const [flashSlot, setFlashSlot] =
    useState<OrderRequestInput["flashSlot"]>("no-preference");
  const [customerNotes, setCustomerNotes] = useState("");
  const [paymentBusy, setPaymentBusy] = useState(false);
  const [checkoutValid, setCheckoutValid] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [requestId, setRequestId] = useState("");
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const submitting = useRef(false);
  const submission = useRef<{ query: string; id: string } | null>(null);
  useEffect(() => {
    if (!fulfillmentOrder) return;
    const abort = new AbortController();
    fetch("/api/auth/me", { cache: "no-store", signal: abort.signal })
      .then((response) => response.json())
      .then((data) => {
        if (!abort.signal.aborted) setSignedIn(Boolean(data.user));
      })
      .catch(() => {});
    return () => abort.abort();
  }, [fulfillmentOrder]);
  const boostOptions = searchParams.getAll("option");
  const coachId = searchParams.get("coach") ?? "";
  const [coachData, setCoachData] = useState<{
    slug: string;
    coach: Coach | null;
  } | null>(null);
  const coach =
    coaching && coachData?.slug === coachId ? coachData.coach : null;
  useEffect(() => {
    if (!coaching) return;
    const abort = new AbortController();
    fetch(`/api/coaches/${encodeURIComponent(coachId)}`, {
      signal: abort.signal,
      cache: "no-store",
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!abort.signal.aborted)
          setCoachData({ slug: coachId, coach: data?.coach ?? null });
      })
      .catch(() => {
        if (!abort.signal.aborted) setCoachData({ slug: coachId, coach: null });
      });
    return () => abort.abort();
  }, [coaching, coachId]);
  const booking = useStore((state) => state.coachBooking);
  const completePayment = useOrders((state) => state.completePayment);
  const latestOrder = useOrders((state) => state.orders[0]);
  const quantityParam = Number(searchParams.get("quantity"));
  const quantity = Number.isFinite(quantityParam)
    ? Math.min(10, Math.max(1, Math.floor(quantityParam)))
    : 1;
  const mode = searchParams.get("mode") === "coaching" ? "coaching" : "duo";
  const offers = coach ? coachOffers(coach) : [];
  const offer =
    offers.find((item) => item.id === searchParams.get("offer")) ?? offers[0];
  const pricing = coach
    ? coachPricing(
        mode === "coaching" ? coach.hourlyRate : offer.price,
        quantity,
      )
    : null;
  const amountParam = Number(searchParams.get("amount"));
  const amount = boost
    ? Number.isFinite(amountParam) && amountParam >= 0
      ? amountParam
      : 0
    : (pricing?.total ?? 0);
  const baseParamValue = searchParams.get("base");
  const baseParam = Number(baseParamValue);
  const boostBase =
    baseParamValue !== null && Number.isFinite(baseParam) && baseParam >= 0
      ? Math.min(baseParam, amount)
      : amount;
  const [method, setMethod] = useState<PaymentMethod>("Apple Pay");
  const [paymentResult, setPaymentResult] = useState<
    "success" | "error" | null
  >(null);
  const [country, setCountry] = useState("VN");
  const regionNames = new Intl.DisplayNames([intlLocales[language]], {
    type: "region",
  });
  const billingCountries = billingCountryCodes
    .map((code) => ({ code, name: regionNames.of(code) ?? code }))
    .sort((a, b) => a.name.localeCompare(b.name, intlLocales[language]));
  const checkoutQuery = searchParams.toString();
  useEffect(() => {
    if (
      (!boost && !coaching) ||
      needsQuote ||
      (boost && (!boostGame || !boostService)) ||
      (coaching && !coach)
    )
      return;
    let active = true;
    void Promise.resolve(useCart.persist.rehydrate()).then(() => {
      if (active) useCart.getState().add(`/checkout?${checkoutQuery}`);
    });
    return () => {
      active = false;
    };
  }, [
    checkoutQuery,
    needsQuote,
    boost,
    boostGame,
    boostService,
    coaching,
    coach,
  ]);

  useEffect(() => {
    void useOrders.persist.rehydrate();
  }, []);

  const orderTitle = boost
    ? `${boostGame?.name} · ${boostTitle}`
    : coach
      ? `${coach.name} · ${mode === "duo" ? "Duo" : "Coaching"}`
      : translateText(language, "Service order", "Đơn dịch vụ");
  const orderDetails = boost
    ? searchParams.get("account")
      ? [
          boostGame?.name ?? "",
          `${translateText(language, "Account", "Tài khoản")} #${searchParams.get("account")}`,
          `${translateText(language, "Rank / listing", "Rank / mô tả")} · ${searchParams.get("to") ?? ""}`,
          `${translateText(language, "Server", "Máy chủ")} · ${searchParams.get("region") ?? ""}`,
        ]
      : [
          boostGame?.name ?? "",
          `${translateText(language, "Service", "Dịch vụ")} · ${boostTitle}`,
          `${searchParams.get("from")} → ${searchParams.get("to")}`,
          `${translateText(language, "Region", "Khu vực")} · ${searchParams.get("region")}`,
          `${translateText(language, "Queue", "Chế độ")} · ${searchParams.get("queue")}`,
          `${translateText(language, "Role", "Vị trí")} · ${searchParams.get("role")}`,
          ...(boostOptions.length
            ? [
                `${translateText(language, "Options", "Tùy chọn")} · ${boostOptions.join(", ")}`,
              ]
            : []),
        ]
    : coach
      ? [
          `${translateText(language, "Coach", "Huấn luyện viên")} · ${coach.name}`,
          `${translateText(language, "Game", "Trò chơi")} · ${coach.gameName}`,
          `${quantity} ${mode === "duo" ? translateText(language, "games", "trận") : translateText(language, "hours", "giờ")}`,
          ...(searchParams.get("date")
            ? [
                `${searchParams.get("date")} · ${searchParams.get("time") ?? ""} · ${searchParams.get("timezone") ?? ""}`,
              ]
            : []),
        ]
      : [];
  const cleanOrderDetails = orderDetails.filter(Boolean);
  const paymentMethodName = method;
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting.current) return;
    setPaymentResult(null);
    setCheckoutError("");
    if (!Number.isFinite(amount) || amount <= 0 || needsQuote) {
      setPaymentResult("error");
      return;
    }
    submitting.current = true;
    setPaymentBusy(true);
    let orderNumber: string | undefined;
    try {
      if (fulfillmentOrder) {
        if (!submission.current || submission.current.query !== checkoutQuery)
          submission.current = {
            query: checkoutQuery,
            id: crypto.randomUUID(),
          };
        const order: OrderRequestInput = {
          submissionId: submission.current.id,
          service: boostService!.slug,
          currentRank: searchParams.get("from") ?? "",
          targetRank: searchParams.get("to") ?? "",
          region: searchParams.get("region") ?? "",
          queue: searchParams.get("queue") ?? "",
          role: searchParams.get("role") ?? "",
          championPool: searchParams.get("champions") ?? "",
          flashSlot:
            boostGame?.slug === "league-of-legends"
              ? flashSlot
              : "no-preference",
          customerNotes,
          riotAccount: needsRiotAccount ? riotAccount : null,
        };
        const response = await fetch("/api/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ game: boostGame!.slug, order }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error ?? "connection");
        orderNumber = result.orderNumber;
        setRequestId(result.request.id);
      }
      const order = completePayment(
        amount,
        orderTitle,
        method,
        cleanOrderDetails,
        orderNumber,
      );
      setPaymentResult(order ? "success" : "error");
      if (order) {
        setRiotAccount({ riotUsername: "", riotPass: "", riotIdTag: "" });
        const cartParams = new URLSearchParams(checkoutQuery);
        cartParams.sort();
        const href = `/checkout?${cartParams}`;
        const item = useCart
          .getState()
          .items.find((entry) => entry.href === href);
        if (item) useCart.getState().remove(item.id);
      }
    } catch (error) {
      setCheckoutError(error instanceof Error ? error.message : "connection");
      setPaymentResult("error");
    } finally {
      submitting.current = false;
      setPaymentBusy(false);
    }
  };

  if (!boost && !coaching)
    return (
      <div className="wallet-checkout-page">
        <h1>
          {translateText(
            language,
            "Choose a service to continue",
            "Chọn dịch vụ để tiếp tục",
          )}
        </h1>
        <Link className="button" href="/services">
          {translateText(language, "Explore services", "Khám phá dịch vụ")}
        </Link>
      </div>
    );
  if (coaching && coachData?.slug !== coachId)
    return (
      <div className="wallet-checkout-page" aria-busy="true">
        <UiText english="Loading coach…" vietnamese="Đang tải coach…" />
      </div>
    );
  if (coaching && !coach)
    return (
      <div className="wallet-checkout-page">
        <h1>
          {translateText(language, "Coach not found", "Không tìm thấy coach")}
        </h1>
        <Link href="/coaches">
          {translateText(language, "Browse coaches", "Chọn coach")}
        </Link>
      </div>
    );
  if (
    boost &&
    (!boostGame ||
      !boostService ||
      !searchParams.get("from") ||
      !searchParams.get("to"))
  )
    return (
      <div className="wallet-checkout-page">
        <h1>
          {translateText(language, "No plan selected", "Chưa có gói được chọn")}
        </h1>
        <Link href="/#configure">
          {translateText(language, "Choose your plan", "Chọn gói dịch vụ")}
        </Link>
      </div>
    );

  if (paymentResult === "success")
    return (
      <div className="wallet-checkout-page">
        <header className="wallet-checkout-header">
          <BrandMark />
          <div>
            <span className="wallet-checkout-eyebrow">
              {translateText(
                language,
                "ORDER CONFIRMED",
                "ĐƠN HÀNG ĐÃ XÁC NHẬN",
              )}
            </span>
            <h1>
              {translateText(
                language,
                "Payment successful",
                "Thanh toán thành công",
              )}
            </h1>
          </div>
        </header>
        <section className="wallet-success-card" role="status">
          <span className="wallet-success-icon">
            <CircleCheck size={38} />
          </span>
          <small>
            {translateText(
              language,
              "MOCK PAYMENT COMPLETE",
              "THANH TOÁN MÔ PHỎNG HOÀN TẤT",
            )}
          </small>
          <h2>
            {translateText(
              language,
              "Your order is confirmed",
              "Đơn hàng của bạn đã được xác nhận",
            )}
          </h2>
          <p>
            {translateText(
              language,
              "{value0} was paid via {value1} for {value2}.",
              "Đã thanh toán {value0} qua {value1} cho đơn hàng {value2}.",
              {
                value0: money.format(amount),
                value1: paymentMethodName,
                value2: orderTitle,
              },
            )}
          </p>
          <div className="wallet-success-meta">
            <span>
              {translateText(language, "ORDER NUMBER", "MÃ ĐƠN HÀNG")}
            </span>
            <strong>{latestOrder?.id ?? "—"}</strong>
            <span>
              {translateText(
                language,
                "PAYMENT METHOD",
                "PHƯƠNG THỨC THANH TOÁN",
              )}
            </span>
            <strong>{method}</strong>
          </div>
          <div className="wallet-success-history">
            <h3>
              {translateText(language, "Order contents", "Nội dung đơn hàng")}
            </h3>
            {latestOrder && (
              <>
                <article>
                  <span>
                    <strong>{latestOrder.title}</strong>
                    <small>
                      {latestOrder.id} ·{" "}
                      {new Date(latestOrder.date).toLocaleString(
                        intlLocales[language],
                      )}{" "}
                      · {latestOrder.method}
                    </small>
                  </span>
                  <b>
                    {money.format(latestOrder.amount)}{" "}
                    <em>{translateText(language, "Paid", "Đã thanh toán")}</em>
                  </b>
                </article>
                <ul>
                  {latestOrder.details?.map((detail, index) => (
                    <li key={`${latestOrder.id}-${index}`}>{detail}</li>
                  ))}
                </ul>
              </>
            )}
          </div>
          <div className="wallet-success-actions">
          {requestId && <Link href={`/messages?request=${encodeURIComponent(requestId)}`}>
            {translateText(language, "Chat with your booster", "Chat với booster của bạn")}
          </Link>}
            <Link href="/cart">
              {translateText(language, "View cart", "Xem giỏ hàng")}
            </Link>
            <Link href="/services">
              {translateText(language, "Continue shopping", "Tiếp tục mua sắm")}
            </Link>
          </div>
        </section>
      </div>
    );

  return (
    <div className="wallet-checkout-page">
      <header className="wallet-checkout-header">
        <BrandMark />
        <div>
          <span className="wallet-checkout-eyebrow">
            {translateText(language, "SECURE ORDER", "ĐƠN HÀNG AN TOÀN")}
          </span>
          <h1>{translateText(language, "Checkout", "Thanh toán")}</h1>
        </div>
      </header>
      <ol
        className="wallet-checkout-steps"
        aria-label={translateText(
          language,
          "Order progress",
          "Tiến trình đặt hàng",
        )}
      >
        <li className="is-complete">
          <span>1</span>
          {translateText(language, "Your plan", "Gói dịch vụ")}
        </li>
        <li className="is-current" aria-current="step">
          <span>2</span>
          {translateText(language, "Checkout", "Thanh toán")}
        </li>
        <li>
          <span>3</span>
          {translateText(language, "Confirmation", "Xác nhận")}
        </li>
      </ol>
      <div className="wallet-checkout-layout">
        <div className="wallet-checkout-main">
          <div className="wallet-demo-banner">
            <Check size={15} />{" "}
            {translateText(
              language,
              "Checkout preview · No real payment will be taken",
              "Bản xem trước thanh toán · Không thu tiền thật",
            )}
          </div>
          <section className="wallet-checkout-card">
            <div className="wallet-checkout-section-title">
              <div>
                <small>
                  {translateText(
                    language,
                    "PAYMENT METHOD",
                    "PHƯƠNG THỨC THANH TOÁN",
                  )}
                </small>
                <h2>
                  {translateText(
                    language,
                    "Choose how to pay",
                    "Chọn cách thanh toán",
                  )}
                </h2>
              </div>
            </div>
            <div
              className="checkout-card-payment"
              role="group"
              aria-label={translateText(
                language,
                "Credit card",
                "Thẻ tín dụng",
              )}
            >
              <strong>
                {translateText(language, "Credit card", "Thẻ tín dụng")}
              </strong>
              <p>
                {translateText(
                  language,
                  "Choose your preferred payment method.",
                  "Chọn phương thức thanh toán bạn muốn sử dụng.",
                )}
              </p>
              <div className="checkout-card-providers">
                {paymentMethods.map(({ name, file: logo, width }) => (
                  <button
                    key={name}
                    type="button"
                    aria-label={name}
                    aria-pressed={method === name}
                    onClick={() => {
                      setMethod(name);
                      setPaymentResult(null);
                    }}
                  >
                    <Image
                      src={"/images/payments/" + logo}
                      alt=""
                      width={width}
                      height={24}
                    />
                  </button>
                ))}
              </div>
            </div>
          </section>
        <form id="checkout-contact-form" onSubmit={handleSubmit} onChange={event => {
          const fields = Array.from(event.currentTarget.elements);
          setCheckoutValid(fields.every(field => !(field instanceof HTMLInputElement || field instanceof HTMLSelectElement || field instanceof HTMLTextAreaElement) || field.validity.valid));
        }}>
            <section className="wallet-checkout-card wallet-billing-card">
              <div className="wallet-checkout-section-title">
                <div>
                  <small>
                    {translateText(
                      language,
                      "CONTACT & BILLING",
                      "LIÊN HỆ & HÓA ĐƠN",
                    )}
                  </small>
                  <h2>
                    {translateText(
                      language,
                      "Your details",
                      "Thông tin của bạn",
                    )}
                  </h2>
                  <p>
                    {translateText(
                      language,
                      "We’ll use these details for your order receipt and support.",
                      "Thông tin này dùng cho biên nhận đơn hàng và hỗ trợ.",
                    )}
                  </p>
                </div>
                <span>
                  {translateText(
                    language,
                    "Required fields marked *",
                    "Trường có dấu * là bắt buộc",
                  )}
                </span>
              </div>
              <div className="wallet-billing-grid">
                <label>
                  <span>
                    {translateText(language, "Full name", "Họ và tên")} *
                  </span>
                  <input
                    autoComplete="name"
                    name="name"
                    required
                    maxLength={120}
                    placeholder={translateText(
                      language,
                      "Enter your full name",
                      "Nhập họ và tên",
                    )}
                  />
                </label>
                <label>
                  <span>
                    {translateText(language, "Email address", "Địa chỉ email")}{" "}
                    *
                  </span>
                  <input
                    autoComplete="email"
                    name="email"
                    type="email"
                    required
                    maxLength={254}
                    placeholder={translateText(
                      language,
                      "you@example.com",
                      "ban@example.com",
                    )}
                  />
                </label>
                <label>
                  <span>
                    {translateText(
                      language,
                      "Country / region",
                      "Quốc gia / khu vực",
                    )}
                  </span>
                  <div className="wallet-select-wrap">
                    <select
                      name="country"
                      autoComplete="country"
                      value={country}
                      onChange={(event) => setCountry(event.target.value)}
                    >
                      {billingCountries.map(({ name, code }) => (
                        <option key={code} value={code}>
                          {name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={15} />
                  </div>
                  <small>
                    {translateText(
                      language,
                      "Select the country of your billing address.",
                      "Chọn quốc gia của địa chỉ thanh toán.",
                    )}
                  </small>
                </label>
                <label className="wallet-billing-wide">
                  <span>{translateText(language, "Address", "Địa chỉ")}</span>
                  <input
                    autoComplete="street-address"
                    placeholder={translateText(
                      language,
                      "Street address",
                      "Số nhà và tên đường",
                    )}
                  />
                </label>
                <label>
                  <span>{translateText(language, "City", "Thành phố")}</span>
                  <input
                    autoComplete="address-level2"
                    placeholder={translateText(language, "City", "Thành phố")}
                  />
                </label>
                <label>
                  <span>
                    {translateText(language, "Postal code", "Mã bưu chính")}
                  </span>
                  <input
                    autoComplete="postal-code"
                    placeholder={translateText(
                      language,
                      "Postal code",
                      "Mã bưu chính",
                    )}
                  />
                </label>
              </div>
            </section>
            {fulfillmentOrder && (
              <>
                {needsRiotAccount && (
                  <RiotAccountForm
                    onChange={setRiotAccount}
                    disabled={paymentBusy}
                  />
                )}
                <fieldset
                  className="riot-checkout-preferences"
                  disabled={paymentBusy}
                >
                  <legend>
                    {translateText(
                      language,
                      "Order preferences",
                      "Tùy chọn đơn hàng",
                    )}
                  </legend>
                  {boostGame?.slug === "league-of-legends" && (
                    <label>
                      <span>
                        {translateText(language, "Flash slot", "Phím Tốc biến")}
                      </span>
                      <select
                        name="flashSlot"
                        value={flashSlot}
                        onChange={(event) =>
                          setFlashSlot(
                            event.target
                              .value as OrderRequestInput["flashSlot"],
                          )
                        }
                      >
                        <option value="no-preference">
                          {translateText(
                            language,
                            "No preference",
                            "Không có tùy chọn",
                          )}
                        </option>
                        <option value="D">D</option>
                        <option value="F">F</option>
                      </select>
                    </label>
                  )}
                  <label>
                    <span>
                      {translateText(
                        language,
                        "Customer notes",
                        "Ghi chú khách hàng",
                      )}
                    </span>
                    <textarea
                      name="customerNotes"
                      rows={3}
                      maxLength={2000}
                      value={customerNotes}
                      onChange={(event) => setCustomerNotes(event.target.value)}
                      placeholder={translateText(
                        language,
                        "Playstyle, schedule, or other preferences…",
                        "Lối chơi, lịch chơi hoặc tùy chọn khác…",
                      )}
                    />
                  </label>
                  <p>
                    {translateText(
                      language,
                      "Preferences are shared privately with your assigned booster.",
                      "Tùy chọn được chia sẻ riêng với booster được phân công.",
                    )}
                  </p>
                  {signedIn === false && (
                    <p>
                      <Link
                        href={`/login?next=${encodeURIComponent(`/checkout?${checkoutQuery}`)}`}
                      >
                        {translateText(
                          language,
                          "Sign in to submit your order",
                          "Đăng nhập để gửi đơn hàng",
                        )}
                      </Link>
                    </p>
                  )}
                </fieldset>
              </>
            )}
          </form>
        </div>

        <aside className="wallet-checkout-summary">
          <div className="wallet-checkout-product">
            {boostGame && boost ? (
              <Image
                src={boostGame.logo}
                alt={boostGame.name}
                width={42}
                height={42}
              />
            ) : coach ? (
              <Image
                src={`/images/coaches/${coach.slug}.svg`}
                alt={coach.name}
                width={42}
                height={42}
              />
            ) : (
              <BrandMark />
            )}
            <strong>
              {boost
                ? `${boostGame?.name} · ${boostTitle}`
                : coach
                  ? `${coach.name} · ${mode === "duo" ? "Duo" : "Coaching"}`
                  : translateText(language, "Service order", "Đơn dịch vụ")}
            </strong>
          </div>
          {boost && searchParams.get("account") && (
            <div className="boost-checkout-details">
              <p>{searchParams.get("to")}</p>
              <dl>
                <div>
                  <dt>{translateText(language, "Account", "Tài khoản")}</dt>
                  <dd>#{searchParams.get("account")}</dd>
                </div>
                <div>
                  <dt>{translateText(language, "Server", "Máy chủ")}</dt>
                  <dd>{searchParams.get("region")}</dd>
                </div>
              </dl>
              <Link href={`/games/${boostGame?.slug}#configure`}>
                {translateText(
                  language,
                  "Continue shopping",
                  "Tiếp tục mua sắm",
                )}{" "}
                →
              </Link>
            </div>
          )}
          {boost && !searchParams.get("account") && (
            <div className="boost-checkout-details">
              <div className="boost-checkout-ranks">
                <div>
                  <small>
                    {translateText(language, "Current rank", "Rank hiện tại")}
                  </small>
                  <strong>{searchParams.get("from")}</strong>
                </div>
                <span aria-hidden="true">→</span>
                <div>
                  <small>
                    {translateText(language, "Desired rank", "Rank mong muốn")}
                  </small>
                  <strong>{searchParams.get("to")}</strong>
                </div>
              </div>
              <dl>
                <div>
                  <dt>{translateText(language, "Region", "Khu vực")}</dt>
                  <dd>{searchParams.get("region")}</dd>
                </div>
                <div>
                  <dt>{translateText(language, "Queue", "Chế độ")}</dt>
                  <dd>{searchParams.get("queue")}</dd>
                </div>
                <div>
                  <dt>{translateText(language, "Role", "Vị trí")}</dt>
                  <dd>{searchParams.get("role")}</dd>
                </div>
                <div>
                  <dt>
                    <UiText english={"LP / win"} />
                  </dt>
                  <dd>{searchParams.get("lpGain")}</dd>
                </div>
                {Number(searchParams.get("units")) > 1 && (
                  <div>
                    <dt>{translateText(language, "Quantity", "Số lượng")}</dt>
                    <dd>{searchParams.get("units")}</dd>
                  </div>
                )}
                {searchParams.get("champions") && (
                  <div>
                    <dt>
                      {translateText(
                        language,
                        "Preferred champions",
                        "Tướng ưu tiên",
                      )}
                    </dt>
                    <dd>{searchParams.get("champions")}</dd>
                  </div>
                )}
                {searchParams.get("delivery") && (
                  <div>
                    <dt>
                      {translateText(
                        language,
                        "Estimated delivery",
                        "Dự kiến hoàn thành",
                      )}
                    </dt>
                    <dd>
                      {searchParams.get("delivery")}{" "}
                      {translateText(language, "hours", "giờ")}
                    </dd>
                  </div>
                )}
              </dl>
              {boostOptions.length > 0 && (
                <div className="boost-checkout-options">
                  <small>
                    {translateText(
                      language,
                      "Selected options",
                      "Tùy chọn đã chọn",
                    )}
                  </small>
                  {boostOptions.map((option, index) => (
                    <span key={`${option}-${index}`}>
                      <Check size={13} />
                      {translateText(language, option)}
                    </span>
                  ))}
                </div>
              )}
              <Link href={`/games/${boostGame?.slug}#configure`}>
                {translateText(language, "Edit your plan", "Chỉnh sửa gói")} →
              </Link>
            </div>
          )}
          {coach && (
            <div className="coach-checkout-details">
              <p>
                {coach.gameName} · {coach.server}
              </p>
              <p>
                {quantity}{" "}
                {mode === "duo"
                  ? translateText(language, "games", "trận")
                  : translateText(language, "hours", "giờ")}
                {mode === "duo"
                  ? ` · ${offer.startRank} → ${offer.targetRank}`
                  : ` · ${coach.sessionFormats.includes(searchParams.get("format") as "live" | "vod") ? searchParams.get("format") : coach.sessionFormats[0]}`}
              </p>
              {searchParams.get("date") && (
                <p>
                  {searchParams.get("date")} · {searchParams.get("time")} ·{" "}
                  {searchParams.get("timezone")}
                </p>
              )}
              {booking?.coachId === coach.slug && booking.goals && (
                <p>
                  {translateText(language, "Goals", "Mục tiêu")}:{" "}
                  {booking.goals}
                </p>
              )}
              {booking?.coachId === coach.slug &&
                mode === "coaching" &&
                booking.sessionFormat === "vod" &&
                booking.replayUrl && (
                  <p>
                    {translateText(language, "Replay", "Replay")}:{" "}
                    {booking.replayUrl}
                  </p>
                )}
              <Link href={`/coaches/${coach.slug}`}>
                {translateText(language, "Edit session", "Chỉnh sửa buổi học")}
              </Link>
              <small>
                {translateText(
                  language,
                  "Coach and availability use demo data; this is not a confirmed booking.",
                  "Coach và lịch học dùng dữ liệu mẫu; chưa xác nhận đặt lịch.",
                )}
              </small>
            </div>
          )}
          <div className="wallet-checkout-line">
            <span>{translateText(language, "Base price", "Giá gói")}</span>
            <strong>
              {needsQuote
                ? translateText(language, "Quote required", "Chờ báo giá")
                : money.format(
                    boost ? boostBase : (pricing?.subtotal ?? amount),
                  )}
            </strong>
          </div>
          {boost && !needsQuote && amount > boostBase && (
            <div className="wallet-checkout-line">
              <span>
                {translateText(language, "Order options", "Phí tùy chọn")}
              </span>
              <strong>{money.format(amount - boostBase)}</strong>
            </div>
          )}
          {pricing && pricing.discount > 0 && (
            <div className="wallet-checkout-line wallet-checkout-bonus">
              <span>
                {translateText(
                  language,
                  "Volume discount",
                  "Giảm giá số lượng",
                )}{" "}
                ({Math.round(pricing.discountRate * 100)}%)
              </span>
              <strong>−{money.format(pricing.discount)}</strong>
            </div>
          )}
          <div className="wallet-checkout-total">
            <div>
              <small>
                {translateText(language, "TOTAL DUE TODAY", "TỔNG HÔM NAY")}
              </small>
              <span>
                {translateText(
                  language,
                  "Local taxes may apply",
                  "Chưa bao gồm thuế địa phương nếu có",
                )}
              </span>
            </div>
            <strong>{needsQuote ? "—" : money.format(amount)}</strong>
          </div>
          {needsQuote ? (
            <Link className="wallet-pay-now" href="/support">
              {translateText(language, "Request a quote", "Yêu cầu báo giá")}
            </Link>
          ) : (
            <button
              type="submit"
              form="checkout-contact-form"
              className="wallet-pay-now"
              disabled={paymentBusy || !checkoutValid}
              aria-busy={paymentBusy}
            >
              <LockKeyhole size={16} />{" "}
              {paymentBusy
                ? translateText(
                    language,
                    "Submitting order…",
                    "Đang gửi đơn hàng…",
                  )
                : translateText(
                    language,
                    "Continue with {value0}",
                    "Tiếp tục với {value0}",
                    { value0: method },
                  )}
            </button>
          )}
          {paymentResult === "error" && (
            <p role="alert" className="wallet-payment-notice">
              {checkoutError === "unauthorized"
                ? translateText(
                    language,
                    "Please sign in before submitting your order.",
                    "Vui lòng đăng nhập trước khi gửi đơn hàng.",
                  )
                : checkoutError === "customer-only"
                  ? translateText(
                      language,
                      "Use a customer account to place an order.",
                      "Sử dụng tài khoản khách hàng để đặt đơn.",
                    )
                  : checkoutError === "credentials-unavailable"
                    ? translateText(
                        language,
                        "Secure account storage is unavailable. Your order has not been completed. Please try again later.",
                        "Lưu trữ tài khoản an toàn hiện không khả dụng. Đơn hàng chưa hoàn tất. Vui lòng thử lại sau.",
                      )
                    : translateText(
                        language,
                        "Unable to complete this payment. Please review your order.",
                        "Không thể hoàn tất thanh toán. Vui lòng kiểm tra đơn hàng.",
                      )}
              {checkoutError === "unauthorized" && (
                <Link
                  href={`/login?next=${encodeURIComponent(`/checkout?${checkoutQuery}`)}`}
                >
                  {translateText(language, "Sign in", "Đăng nhập")}
                </Link>
              )}
            </p>
          )}
          <div className="wallet-checkout-trust">
            <span>
              ●{" "}
              {translateText(language, "Secure checkout", "Thanh toán an toàn")}
            </span>
            <span>
              ● {translateText(language, "24/7 support", "Hỗ trợ 24/7")}
            </span>
          </div>
          <p className="wallet-checkout-terms">
            {translateText(
              language,
              "By proceeding, you agree to our ",
              "Bằng cách tiếp tục, bạn đồng ý với ",
            )}
            <Link href="/legal/terms">
              {translateText(
                language,
                "Terms of Service",
                "Điều khoản dịch vụ",
              )}
            </Link>
            .
          </p>
        </aside>
      </div>
    </div>
  );
}
