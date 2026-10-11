"use client";
import { translateText } from "@/lib/i18n";

import Link from "next/link";
import { useState } from "react";
import { MessagesSquare, Bell, Users, Rocket, ChevronRight, ArrowLeft, Bookmark } from "lucide-react";
import { useLanguage } from "@/components/ui/LanguageProvider";
import { useStore } from "@/store/useStore";

export function DashboardMenu({ close, employee = false }: { email: string; close: () => void; employee?: boolean }) {
  const { language } = useLanguage();
  const [section, setSection] = useState<string | null>(null);
  const setStore = useStore((state) => state.set);
  const items = [
    { id: "messages", label: translateText(language, "Messages", "Tin nhắn"), icon: MessagesSquare },
    { id: "notifications", label: translateText(language, "Notifications", "Thông báo"), icon: Bell },
    { id: "coaches", label: translateText(language, "Coaches", "Huấn luyện viên"), icon: Users },
    { id: "loyalty", label: translateText(language, "Loyalty", "Ưu đãi thành viên"), icon: Rocket },
  ];
  const current = items.find((item) => item.id === section);
  const descriptions: Record<string, string> = {
    messages: translateText(language, "No conversations yet. Contact support for help with a service.", "Chưa có cuộc trò chuyện. Liên hệ hỗ trợ nếu bạn cần trợ giúp về dịch vụ."),
    notifications: translateText(language, "You're all caught up. No new notifications.", "Bạn chưa có thông báo mới."),
    loyalty: translateText(language, "Member rewards will appear here when offers become available.", "Chương trình thành viên sẽ được cập nhật tại đây khi có ưu đãi."),
  };
  return <div className="dashboard-menu">
    <nav aria-label={translateText(language, "Account dashboard", "Dashboard tài khoản")}>
      {employee && <Link href="/employee" className="dashboard-menu-row" onClick={close}><MessagesSquare size={20} /><span>{translateText(language, "Employee workspace", "Khu vực nhân viên")}</span><ChevronRight size={16} /></Link>}
      {items.map(({ id, label, icon: Icon }) => id === "coaches" ?
        <Link key={id} href="/coaches" className="dashboard-menu-row" onClick={close}><Icon size={20} /><span>{label}</span><ChevronRight size={16} /></Link> : id === "messages" ?
        <Link key={id} href="/messages" className="dashboard-menu-row" onClick={close}><Icon size={20} /><span>{label}</span><ChevronRight size={16} /></Link> :
        <button key={id} type="button" className="dashboard-menu-row" aria-expanded={section === id} aria-controls="dashboard-section" onClick={() => setSection(section === id ? null : id)}><Icon size={20} /><span>{label}</span><ChevronRight size={16} /></button>)}
    </nav>
    {current && <section id="dashboard-section" className="dashboard-section" aria-label={current.label}>
      <button className="dashboard-back" type="button" onClick={() => setSection(null)}><ArrowLeft size={16} />{translateText(language, "Back", "Quay lại")}</button>
      <current.icon size={28} className="dashboard-section-icon" /><h3>{current.label}</h3>
      {<><p>{descriptions[section!]}</p>{section === "messages" && <Link className="dashboard-cta" href="/contact" onClick={close}>{translateText(language, "Contact support", "Liên hệ hỗ trợ")}<ChevronRight size={16} /></Link>}</>}
    </section>}
    <button type="button" className="dashboard-saved" onClick={() => { close(); setStore({ modal: "account" }); }}><Bookmark size={16} />{translateText(language, "Saved plans", "Kế hoạch đã lưu")}<ChevronRight size={16} /></button>
  </div>;
}
