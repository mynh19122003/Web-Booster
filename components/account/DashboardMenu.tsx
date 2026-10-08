"use client";
import { translateText } from "@/lib/i18n";

import Link from "next/link";
import { useState } from "react";
import { ShoppingBag, Wallet, MessagesSquare, Bell, Users, Rocket, ChevronRight, ArrowLeft, Bookmark } from "lucide-react";
import { useLanguage } from "@/components/ui/LanguageProvider";
import { useMoney } from "@/components/ui/Currency";
import { WalletPanel } from "@/components/account/WalletPanel";
import { useRequests } from "@/lib/local-records";
import { useStore } from "@/store/useStore";
import { useCart } from "@/store/useCart";

export function DashboardMenu({ email, close }: { email: string; close: () => void }) {
  const { language } = useLanguage();
  const money = useMoney();
  const cartCount = useCart(state => state.items.length);
  const [section, setSection] = useState<string | null>(null);
  const requests = useRequests().filter((request) => request.email.toLowerCase() === email.toLowerCase());
  const setStore = useStore((state) => state.set);
  const items = [
    { id: "orders", label: translateText(language, "Orders", "Đơn hàng"), icon: ShoppingBag },
    { id: "wallet", label: translateText(language, "Wallet", "Ví của tôi"), icon: Wallet },
    { id: "messages", label: translateText(language, "Messages", "Tin nhắn"), icon: MessagesSquare },
    { id: "notifications", label: translateText(language, "Notifications", "Thông báo"), icon: Bell },
    { id: "coaches", label: translateText(language, "Coaches", "Huấn luyện viên"), icon: Users },
    { id: "loyalty", label: translateText(language, "Loyalty", "Ưu đãi thành viên"), icon: Rocket },
  ];
  const current = items.find((item) => item.id === section);
  const descriptions: Record<string, string> = {
    wallet: translateText(language, "No transactions yet.", "Chưa có giao dịch."),
    messages: translateText(language, "No conversations yet. Contact support for help with a service.", "Chưa có cuộc trò chuyện. Liên hệ hỗ trợ nếu bạn cần trợ giúp về dịch vụ."),
    notifications: translateText(language, "You're all caught up. No new notifications.", "Bạn chưa có thông báo mới."),
    loyalty: translateText(language, "Member rewards will appear here when offers become available.", "Chương trình thành viên sẽ được cập nhật tại đây khi có ưu đãi."),
  };
  return <div className="dashboard-menu">
    <nav aria-label={translateText(language, "Account dashboard", "Dashboard tài khoản")}>
      <Link href="/cart" className="dashboard-menu-row" onClick={close}><ShoppingBag size={20} /><span>{translateText(language, "Your cart", "Giỏ hàng")}</span><strong>{cartCount}</strong><ChevronRight size={16} /></Link>
      {items.map(({ id, label, icon: Icon }) => id === "wallet" ?
        <Link key={id} href="/wallet" className="dashboard-menu-row" onClick={close}><Icon size={20} /><span>{label}</span><strong className="dashboard-wallet-balance">{money.format(0)}</strong><ChevronRight size={16} /></Link> : id === "coaches" ?
        <Link key={id} href="/coaches" className="dashboard-menu-row" onClick={close}><Icon size={20} /><span>{label}</span><ChevronRight size={16} /></Link> : id === "messages" ?
        <Link key={id} href="/messages" className="dashboard-menu-row" onClick={close}><Icon size={20} /><span>{label}</span><ChevronRight size={16} /></Link> :
        <button key={id} type="button" className="dashboard-menu-row" aria-expanded={section === id} aria-controls="dashboard-section" onClick={() => setSection(section === id ? null : id)}><Icon size={20} /><span>{label}</span>{id === "orders" && requests.length > 0 && <small>{requests.length}</small>}<ChevronRight size={16} /></button>)}
    </nav>
    {current && <section id="dashboard-section" className="dashboard-section" aria-label={current.label}>
      <button className="dashboard-back" type="button" onClick={() => setSection(null)}><ArrowLeft size={16} />{translateText(language, "Back", "Quay lại")}</button>
      <current.icon size={28} className="dashboard-section-icon" /><h3>{current.label}</h3>
      {section === "wallet" ? <WalletPanel /> : section === "orders" ? <>
        {requests.length === 0 ? <p>{translateText(language, "No service requests yet.", "Bạn chưa có yêu cầu dịch vụ.")}</p> : requests.map((request) => <article className="dashboard-request" key={request.id}><strong>{request.categoryName || request.service}</strong><span>{request.from} → {request.to}</span><small>{request.id} · {request.status}</small></article>)}
        <Link className="dashboard-cta" href="/services" onClick={close}>{translateText(language, "Explore services", "Khám phá dịch vụ")}<ChevronRight size={16} /></Link>
      </> : <><p>{descriptions[section!]}</p>{section === "messages" && <Link className="dashboard-cta" href="/contact" onClick={close}>{translateText(language, "Contact support", "Liên hệ hỗ trợ")}<ChevronRight size={16} /></Link>}</>}
    </section>}
    <button type="button" className="dashboard-saved" onClick={() => { close(); setStore({ modal: "account" }); }}><Bookmark size={16} />{translateText(language, "Saved plans", "Kế hoạch đã lưu")}<ChevronRight size={16} /></button>
  </div>;
}
