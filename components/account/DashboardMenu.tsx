"use client";

import Link from "next/link";
import { useState } from "react";
import { ShoppingBag, Wallet, MessagesSquare, Bell, Users, Rocket, ChevronRight, ArrowLeft, Bookmark } from "lucide-react";
import { useLanguage } from "@/components/ui/LanguageProvider";
import { useRequests } from "@/lib/local-records";
import { useStore } from "@/store/useStore";

export function DashboardMenu({ email, close }: { email: string; close: () => void }) {
  const { language } = useLanguage();
  const vi = language === "vi";
  const [section, setSection] = useState<string | null>(null);
  const requests = useRequests().filter((request) => request.email.toLowerCase() === email.toLowerCase());
  const setStore = useStore((state) => state.set);
  const items = [
    { id: "orders", label: vi ? "Đơn hàng" : "Orders", icon: ShoppingBag },
    { id: "wallet", label: vi ? "Ví của tôi" : "Wallet", icon: Wallet },
    { id: "messages", label: vi ? "Tin nhắn" : "Messages", icon: MessagesSquare },
    { id: "notifications", label: vi ? "Thông báo" : "Notifications", icon: Bell },
    { id: "coaches", label: vi ? "Huấn luyện viên" : "Coaches", icon: Users },
    { id: "loyalty", label: vi ? "Ưu đãi thành viên" : "Loyalty", icon: Rocket },
  ];
  const current = items.find((item) => item.id === section);
  const descriptions: Record<string, string> = {
    wallet: vi ? "Chưa có giao dịch." : "No transactions yet.",
    messages: vi ? "Chưa có cuộc trò chuyện. Liên hệ hỗ trợ nếu bạn cần trợ giúp về dịch vụ." : "No conversations yet. Contact support for help with a service.",
    notifications: vi ? "Bạn chưa có thông báo mới." : "You're all caught up. No new notifications.",
    loyalty: vi ? "Chương trình thành viên sẽ được cập nhật tại đây khi có ưu đãi." : "Member rewards will appear here when offers become available.",
  };
  return <div className="dashboard-menu">
    <nav aria-label={vi ? "Dashboard tài khoản" : "Account dashboard"}>
      {items.map(({ id, label, icon: Icon }) => id === "coaches" ?
        <Link key={id} href="/coaches" className="dashboard-menu-row" onClick={close}><Icon size={20} /><span>{label}</span><ChevronRight size={16} /></Link> :
        <button key={id} type="button" className="dashboard-menu-row" aria-expanded={section === id} aria-controls="dashboard-section" onClick={() => setSection(section === id ? null : id)}><Icon size={20} /><span>{label}</span>{id === "orders" && requests.length > 0 && <small>{requests.length}</small>}<ChevronRight size={16} /></button>)}
    </nav>
    {current && <section id="dashboard-section" className="dashboard-section" aria-label={current.label}>
      <button className="dashboard-back" type="button" onClick={() => setSection(null)}><ArrowLeft size={16} />{vi ? "Quay lại" : "Back"}</button>
      <current.icon size={28} className="dashboard-section-icon" /><h3>{current.label}</h3>
      {section === "orders" ? <>
        {requests.length === 0 ? <p>{vi ? "Bạn chưa có yêu cầu dịch vụ." : "No service requests yet."}</p> : requests.map((request) => <article className="dashboard-request" key={request.id}><strong>{request.categoryName || request.service}</strong><span>{request.from} → {request.to}</span><small>{request.id} · {request.status}</small></article>)}
        <Link className="dashboard-cta" href="/services" onClick={close}>{vi ? "Khám phá dịch vụ" : "Explore services"}<ChevronRight size={16} /></Link>
      </> : <><p>{descriptions[section!]}</p>{section === "messages" && <Link className="dashboard-cta" href="/contact" onClick={close}>{vi ? "Liên hệ hỗ trợ" : "Contact support"}<ChevronRight size={16} /></Link>}</>}
    </section>}
    <button type="button" className="dashboard-saved" onClick={() => { close(); setStore({ modal: "account" }); }}><Bookmark size={16} />{vi ? "Kế hoạch đã lưu" : "Saved plans"}<ChevronRight size={16} /></button>
  </div>;
}
