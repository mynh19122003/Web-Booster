"use client";

import Link from "next/link";
import { useLanguage } from "@/components/ui/LanguageProvider";
import { translateText } from "@/lib/i18n";

export function WalletCheckout() {
  const { language } = useLanguage();
  return (
    <main className="wallet-checkout-page site-container">
      <h1>{translateText(language, "Checkout is unavailable", "Chưa thể thanh toán")}</h1>
      <p>{translateText(language,
        "Payment and order APIs have not been connected. Your account has not been charged and no order was created.",
        "API thanh toán và đơn hàng chưa được kết nối. Tài khoản của bạn chưa bị trừ tiền và chưa có đơn hàng nào được tạo.")}</p>
      <Link className="button" href="/services">{translateText(language, "Back to services", "Quay lại dịch vụ")}</Link>
    </main>
  );
}
