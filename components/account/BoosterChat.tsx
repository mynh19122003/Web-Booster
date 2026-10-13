"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Maximize2, MessageCircle, X } from "lucide-react";
import { useLanguage } from "@/components/ui/LanguageProvider";
import { translateText } from "@/lib/i18n";
import { UserBoosterChat } from "@/components/user/UserBoosterChat";
import { UserChatBadge } from "@/components/user/UserChatNotifications";

export function BoosterChat({ compact = false, initialRequestId = "" }: { compact?: boolean; initialRequestId?: string }) {
  return <UserBoosterChat compact={compact} initialRequestId={initialRequestId} />;
}

export function ChatLauncher() {
  const [open, setOpen] = useState(false);
  const { language } = useLanguage();
  const trigger = useRef<HTMLButtonElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  const copy = (english: string, vietnamese: string) => translateText(language, english, vietnamese);
  useEffect(() => {
    if (!open) return;
    close.current?.focus();
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setOpen(false); trigger.current?.focus(); }
    };
    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, [open]);
  return <div className="booster-chat-widget">
    {open && <section className="booster-chat-popup" role="dialog" aria-label={copy("Support chat", "Chat hỗ trợ")}>
      <header><strong><MessageCircle size={18} />{copy("Support chat", "Chat hỗ trợ")}</strong>
        <Link href="/messages" onClick={() => setOpen(false)} aria-label={copy("Open messages", "Mở trang tin nhắn")}><Maximize2 size={17} /></Link>
        <button ref={close} type="button" className="icon-button" aria-label={copy("Close chat", "Đóng chat")} onClick={() => { setOpen(false); trigger.current?.focus(); }}><X size={18} /></button>
      </header><BoosterChat compact />
    </section>}
    <button ref={trigger} className="booster-chat-launcher" type="button" aria-expanded={open} aria-label={copy("Chat with our team", "Chat với đội ngũ hỗ trợ")} onClick={() => setOpen(!open)}>{open ? <X size={22} /> : <MessageCircle size={22} />}<UserChatBadge /></button>
  </div>;
}
