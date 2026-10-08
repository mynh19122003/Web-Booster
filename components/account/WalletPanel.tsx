"use client";
import { translateText } from "@/lib/i18n";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { useLanguage } from "@/components/ui/LanguageProvider";
import { useMoney } from "@/components/ui/Currency";

export function WalletPanel() {
  const { language } = useLanguage();
  const money = useMoney();
  const router = useRouter();
  const [selectedTopUp, setSelectedTopUp] = useState(50);

  return <div className="dashboard-wallet">
    <p className="dashboard-wallet-intro">{translateText(language, "Pay for an order in full with your balance. Top up to earn a bonus.", "Thanh toán đơn hàng bằng số dư ví. Nạp tiền để nhận thưởng.")}</p>
    <div className="dashboard-wallet-available"><small>{translateText(language, "AVAILABLE BALANCE", "SỐ DƯ HIỆN CÓ")}</small><strong>{money.format(0)}</strong><p>{translateText(language, "Top-ups and refunds never expire. Earned cashback expires after 12 months without activity.", "Tiền nạp và hoàn tiền không hết hạn. Tiền thưởng hoàn lại hết hạn sau 12 tháng không hoạt động.")}</p></div>
    <h4>{translateText(language, "Add funds", "Nạp tiền")}</h4>
    <div className="dashboard-topup-grid" data-reveal>
      {[25, 50, 100, 150, 250, 500].map((amount) => {
        const bonusRate = amount === 25 ? 0 : amount === 50 ? 0.02 : amount === 100 ? 0.03 : amount === 150 ? 0.04 : amount === 250 ? 0.05 : 0.06;
        const bonus = amount * bonusRate;
        return <button key={amount} type="button" className="dashboard-topup-option" aria-pressed={selectedTopUp === amount} onClick={() => setSelectedTopUp(amount)}>
          {bonusRate > 0 && <small>+{Math.round(bonusRate * 100)}%</small>}
          <strong>{money.format(amount)}</strong>
          <span>{bonus > 0 ? (translateText(language, "Get {value0}", "Nhận {value0}", {value0: money.format(amount + bonus)})) : (translateText(language, "No bonus", "Không có thưởng"))}</span>
        </button>;
      })}
    </div>
    <p className="dashboard-wallet-note">{translateText(language, "Payment details would appear at the next step. This is a preview; no real payment is processed.", "Thông tin thanh toán sẽ hiển thị ở bước tiếp theo. Đây là bản xem trước; chưa có thanh toán thật.")}</p>
    <button type="button" className="dashboard-cta dashboard-wallet-continue" onClick={() => router.push(`/checkout?type=wallet&amount=${selectedTopUp}`)}>{translateText(language, "Continue · {value0}", "Tiếp tục · {value0}", {value0: money.format(selectedTopUp)})}<ChevronRight size={16} /></button>
    <div className="dashboard-wallet-history"><h4>{translateText(language, "History", "Lịch sử")}</h4><p>{translateText(language, "Your top-ups, cashback and refunds will appear here.", "Giao dịch nạp tiền, hoàn tiền và thưởng sẽ hiển thị tại đây.")}</p></div>
  </div>;
}
