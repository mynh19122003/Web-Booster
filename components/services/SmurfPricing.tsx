"use client";
import { useRouter } from "next/navigation";
import { ArrowRight, Sparkles } from "lucide-react";
import { smurfPackages, serverPrice } from "@/lib/project-pricing";
import { PRICING_VERSION } from "@/lib/rank-pricing";
import { RegionSelector } from "@/components/ui/RegionSelector";
import { CurrencySwitch, useMoney } from "@/components/ui/Currency";
import { GameIdentity } from "@/components/ui/GameIdentity";
import { useLanguage } from "@/components/ui/LanguageProvider";
import { translateText } from "@/lib/i18n";
import { regionsForGame } from "@/data/regions";
import { useStore } from "@/store/useStore";
import { useCart } from "@/store/useCart";

export function SmurfPricing({ game }: { game: string }) {
  const s = useStore(),
    money = useMoney(),
    router = useRouter();
  const { language } = useLanguage();
  const text = (en: string, vi: string) => translateText(language, en, vi);
  const packages = smurfPackages.filter((p) => p.game === game);
  function review(p: (typeof smurfPackages)[number]) {
    const price = serverPrice(p.naUsd, s.region);
    s.set({
      quoteOverride: price,
      quoteAddOns: [],
      coachBooking: null,
      accountPurchase: null,
      checkoutDetails: {
        name: p.name,
        from: "Unranked",
        to: p.spec || p.name,
        quoteRequired: false,
      },
      modal: null,
    });
    const params = new URLSearchParams({
      type: "boost",
      game,
      service: "rank-boost",
      category: "smurfs",
      name: p.name,
      from: "Unranked",
      to: p.name + (p.spec ? ` · ${p.spec}` : ""),
      region: s.region,
      queue: "Account",
      units: "1",
      amount: String(price),
      base: String(price),
      quote: "false",
      pricingVersion: PRICING_VERSION,
    });
    const href = `/checkout?${params}`;
    useCart.getState().add(href);
    router.push(href);
  }
  return (
    <div className="p-6 sm:p-8 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <GameIdentity game={game} />
          <h3 className="text-xl font-heading font-bold text-white mt-3">
            {text("Smurf packages", "Gói tài khoản Smurf")}
          </h3>
        </div>
        <CurrencySwitch />
      </div>
      <div className="max-w-sm">
        <RegionSelector
          value={s.region}
          options={regionsForGame(game)}
          onChange={(region) => s.set({ region })}
        />
      </div>
      <p className="text-sm text-zinc-400">
        {text(
          "Choose a package to review its price and server. Account availability will be confirmed for your order.",
          "Chọn gói để xem giá và server. Tài khoản sẵn có sẽ được xác nhận theo đơn hàng.",
        )}
      </p>
      {packages.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {packages.map((p) => (
            <article
              key={p.id}
              className="rounded-2xl border border-white/10 bg-black/30 p-5 flex flex-col gap-3"
            >
              <Sparkles size={22} className="text-[#FF9F3C]" />
              <h4 className="font-semibold text-white">{p.name}</h4>
              <p className="text-sm text-zinc-400">
                {p.spec ||
                  text("Fresh unranked account", "Tài khoản mới chưa rank")}
              </p>
              <div className="mt-auto">
                <p className="text-2xl font-bold text-white" aria-live="polite">
                  {money.format(serverPrice(p.naUsd, s.region))}
                </p>
                <small className="text-zinc-400">
                  {s.region} · {money.currency}
                </small>
              </div>
              <button
                type="button"
                className="button w-full mt-2"
                disabled={money.amount(serverPrice(p.naUsd, s.region)) === null}
                onClick={() => review(p)}
              >
                {text("Review package", "Xem gói")}
                <ArrowRight size={16} />
              </button>
            </article>
          ))}
        </div>
      ) : (
        <p className="text-zinc-300">
          {text(
            "Contact support for available packages and a quote.",
            "Liên hệ hỗ trợ để xem gói sẵn có và nhận báo giá.",
          )}
        </p>
      )}
    </div>
  );
}
