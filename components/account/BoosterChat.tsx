"use client";
import { UiText } from "@/components/ui/UiText";

import { intlLocales, translateText } from "@/lib/i18n";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, CheckCheck, ChevronRight, MessageCircle, Search, Send, ShieldCheck, Smile, Star, X, Maximize2 } from "lucide-react";
import { useLanguage } from "@/components/ui/LanguageProvider";
import { useBoosterChat } from "@/store/useBoosterChat";
import { coaches } from "@/data/coaches";

const threads = coaches.slice(0, 4);
const greetings: Record<string, [string, string]> = {
  luna: ["Hi! I'm Luna. What would you like to focus on during your next session?", "Chào bạn, mình là Luna. Bạn muốn tập trung cải thiện điều gì trong buổi học tới?"],
  rift: ["Welcome! Tell me about your preferred roles and availability.", "Chào bạn! Hãy chia sẻ vị trí yêu thích và thời gian bạn có thể chơi nhé."],
  nova: ["Hey! We can work on aim, positioning or a VOD review. What's your goal?", "Chào bạn! Mình có thể giúp về aim, vị trí hoặc review VOD. Mục tiêu của bạn là gì?"],
  vex: ["Hi! Let's talk about your TFT goals and favourite play styles.", "Chào bạn! Cùng trao đổi về mục tiêu TFT và lối chơi yêu thích của bạn nhé."],
};

export function BoosterChat({ compact = false }: { compact?: boolean }) {
  const { language } = useLanguage();
  const { messages, unread, send, read } = useBoosterChat();
  const [selected, setSelected] = useState("luna");
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState("");
  const [mobileThread, setMobileThread] = useState(false);
  const [emoji, setEmoji] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const coach = threads.find(coach => coach.slug === selected)!;
  const history = messages[selected] ?? [];
  const selectedUnread = unread[selected] ?? 0;
  useEffect(() => { void useBoosterChat.persist.rehydrate(); }, []);
  useEffect(() => { read(selected); }, [selected, selectedUnread, read]);
  useEffect(() => { bottom.current?.scrollIntoView({ block: "nearest" }); }, [selected, history.length]);
  const choose = (id: string) => { setSelected(id); setDraft(""); setEmoji(false); setMobileThread(true); };
  const submit = () => { if (!draft.trim()) return; send(selected, draft); setDraft(""); setEmoji(false); input.current?.focus(); };
  const mockReply = () => { send(selected, translateText(language, "This is a sample reply. Share your goals and preferred time; a real booster can respond once messaging is connected.", "Đây là phản hồi mẫu. Bạn có thể chia sẻ mục tiêu và thời gian dự kiến; booster thực tế sẽ trao đổi sau khi hệ thống chat được kết nối."), "booster"); };
  const filtered = threads.filter(coach => `${coach.name} ${coach.gameName}`.toLowerCase().includes(query.toLowerCase()));
  return <div className={`booster-chat ${compact ? "booster-chat-compact" : ""}`} data-thread-open={mobileThread}>
    {!compact && <aside className="booster-chat-sidebar"><header><h2>{translateText(language, "Conversations", "Hội thoại")}</h2><span>{threads.length}</span></header><label className="booster-chat-search"><Search size={16} /><input aria-label={translateText(language, "Search conversations", "Tìm hội thoại")} placeholder={translateText(language, "Search booster or game…", "Tìm booster hoặc game…")} value={query} onChange={event => setQuery(event.target.value)} /></label><nav aria-label={translateText(language, "Conversations", "Danh sách hội thoại")}>{filtered.map(person => <button type="button" key={person.slug} aria-pressed={selected === person.slug} onClick={() => choose(person.slug)}><span className="booster-chat-avatar"><Image src={`/images/coaches/${person.slug}.svg`} alt="" width={44} height={44} /><i data-online={person.online} /></span><span><strong>{person.name}<small>{person.gameName}</small></strong><p>{messages[person.slug]?.at(-1)?.text ?? (translateText(language, "Start a sample conversation", "Bắt đầu trò chuyện mẫu"))}</p></span>{Boolean(unread[person.slug]) && <b className="booster-chat-unread">{unread[person.slug]}</b>}</button>)}</nav>{filtered.length === 0 && <p className="booster-chat-empty">{translateText(language, "No conversations found.", "Không tìm thấy hội thoại.")}</p>}<p className="booster-chat-sidebar-note"><ShieldCheck size={16} />{translateText(language, "Demo conversations · Saved in this browser", "Hội thoại mẫu · Lưu trên trình duyệt này")}</p></aside>}
    <section className="booster-chat-thread" aria-label={`${translateText(language, "Chat with", "Trò chuyện với")} ${coach.name}`}><header><button type="button" className="icon-button booster-chat-back" aria-label={translateText(language, "Conversation list", "Danh sách hội thoại")} onClick={() => setMobileThread(false)}><ArrowLeft size={18} /></button><Image src={`/images/coaches/${coach.slug}.svg`} width={42} height={42} alt="" /><div><h2>{coach.name}<ShieldCheck size={15} /></h2><span><i data-online={coach.online} />{coach.online ? (translateText(language, "Online · demo", "Online mẫu")) : (translateText(language, "Offline · demo", "Offline mẫu"))} · {coach.peakRank}</span></div><Link href={`/coaches/${coach.slug}`} className="booster-chat-profile">{translateText(language, "Profile", "Hồ sơ")}<ChevronRight size={15} /></Link></header>
      <div className="booster-chat-demo">{translateText(language, "Demo mode — messages are not sent to a real booster.", "Chế độ mẫu — tin nhắn chưa được gửi đến booster thực tế.")}</div>
      <div className="booster-chat-log" role="log" aria-live="polite" aria-relevant="additions"><div className="booster-chat-day">{translateText(language, "Conversation started", "Bắt đầu hội thoại")}</div><article className="booster-chat-bubble" data-sender="booster"><p>{translateText(language, greetings[selected][0], greetings[selected][1])}</p><small>{coach.name} · {translateText(language, "Sample message", "Tin nhắn mẫu")}</small></article>{history.map(message => <article className="booster-chat-bubble" data-sender={message.sender} key={message.id}><p>{message.text}</p><small>{new Date(message.time).toLocaleTimeString(intlLocales[language], { hour: "2-digit", minute: "2-digit" })}{message.sender === "customer" && <><CheckCheck size={13} />{translateText(language, "Saved", "Đã lưu")}</>}</small></article>)}<div ref={bottom} /></div>
      <div className="booster-chat-quick">{[translateText(language, "When can you start?", "Khi nào bạn có thể bắt đầu?"), translateText(language, "I'd like to improve my skills", "Tôi muốn cải thiện kỹ năng"), translateText(language, "Which roles do you play?", "Bạn chơi vị trí nào?")].map(text => <button type="button" key={text} onClick={() => { setDraft(text); input.current?.focus(); }}>{text}</button>)}</div>
      <form className="booster-chat-compose" onSubmit={event => { event.preventDefault(); submit(); }}><label className="sr-only" htmlFor={compact ? "compact-chat-message" : "chat-message"}>{translateText(language, "Message", "Tin nhắn")}</label><textarea ref={input} id={compact ? "compact-chat-message" : "chat-message"} rows={2} maxLength={2000} placeholder={translateText(language, "Message your booster…", "Nhập tin nhắn cho booster…")} value={draft} onChange={event => setDraft(event.target.value)} onKeyDown={event => { if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); submit(); } }} /><div><button type="button" className="icon-button" aria-label={translateText(language, "Choose emoji", "Chọn emoji")} aria-expanded={emoji} onClick={() => setEmoji(!emoji)}><Smile size={19} /></button><small>{draft.length}/2000</small><button type="submit" className="booster-chat-send" disabled={!draft.trim()} aria-label={translateText(language, "Send demo message", "Gửi tin nhắn mẫu")}><Send size={17} /><span>{translateText(language, "Send", "Gửi")}</span></button></div>{emoji && <div className="booster-chat-emojis">{["👋", "👍", "🎮", "🔥", "😊"].map(value => <button type="button" key={value} aria-label={value} onClick={() => { setDraft(current => (current + value).slice(0, 2000)); setEmoji(false); input.current?.focus(); }}>{value}</button>)}</div>}</form>
      <footer><span>{translateText(language, "Enter to send · Shift+Enter for a new line", "Enter để gửi · Shift+Enter xuống dòng")}</span><button type="button" onClick={mockReply}>{translateText(language, "Simulate a reply", "Thử phản hồi mẫu")}</button></footer>
    </section>
    {!compact && <aside className="booster-chat-info"><span className="eyebrow">{translateText(language, "YOUR BOOSTER", "BOOSTER CỦA BẠN")}</span><Image src={`/images/coaches/${coach.slug}.svg`} width={80} height={80} alt={coach.name} /><h2>{coach.name}</h2><p><Star size={14} /> {coach.rating} · {coach.peakRank}</p><dl><div><dt><UiText english={"Game"} /></dt><dd>{coach.gameName}</dd></div><div><dt>{translateText(language, "Server", "Máy chủ")}</dt><dd>{coach.server}</dd></div><div><dt>{translateText(language, "Roles", "Vị trí")}</dt><dd>{coach.roles.join(" · ")}</dd></div><div><dt>{translateText(language, "Languages", "Ngôn ngữ")}</dt><dd>{coach.languages.join(" · ")}</dd></div></dl><div className="booster-chat-order"><ShieldCheck size={22} /><h3>{translateText(language, "Order details", "Thông tin đơn hàng")}</h3><p>{translateText(language, "No paid order is linked to this demo conversation.", "Chưa có đơn đã thanh toán gắn với hội thoại mẫu này.")}</p><Link href={`/coaches/${coach.slug}`}>{translateText(language, "Explore sessions", "Chọn dịch vụ")}<ChevronRight size={15} /></Link></div><Link href="/support">{translateText(language, "Contact support", "Liên hệ hỗ trợ")}<ChevronRight size={15} /></Link></aside>}
  </div>;
}

export function ChatLauncher() {
  const [open, setOpen] = useState(false);
  const { language } = useLanguage();
  const trigger = useRef<HTMLButtonElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  useEffect(() => { if (!open) return; close.current?.focus(); const escape = (event: KeyboardEvent) => { if (event.key === "Escape") { setOpen(false); trigger.current?.focus(); } }; window.addEventListener("keydown", escape); return () => window.removeEventListener("keydown", escape); }, [open]);
  return <div className="booster-chat-widget">{open && <section className="booster-chat-popup" role="dialog" aria-label={translateText(language, "Booster chat", "Chat với booster")}><header><strong><MessageCircle size={18} />{translateText(language, "Booster chat", "Chat với booster")}</strong><Link href="/messages" onClick={() => setOpen(false)} aria-label={translateText(language, "Open messages", "Mở trang tin nhắn")}><Maximize2 size={17} /></Link><button ref={close} type="button" className="icon-button" aria-label={translateText(language, "Close chat", "Đóng chat")} onClick={() => { setOpen(false); trigger.current?.focus(); }}><X size={18} /></button></header><BoosterChat compact /></section>}<button ref={trigger} className="booster-chat-launcher" type="button" aria-expanded={open} aria-label={translateText(language, "Chat with a booster", "Chat với booster")} onClick={() => setOpen(!open)}>{open ? <X size={22} /> : <MessageCircle size={22} />}</button></div>;
}
