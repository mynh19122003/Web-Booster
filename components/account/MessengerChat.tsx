"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, Check, MessageCircle, Search, Send, ShieldCheck, Smile, X } from "lucide-react";
import type { Socket } from "socket.io-client";
import { createChatSocket } from "@/lib/chat-socket-client";
import { useLanguage } from "@/components/ui/LanguageProvider";
import { intlLocales, translateText } from "@/lib/i18n";
import { publicMockMode } from "@/lib/public-data-source";
import { persistDemoChat, publicRequest } from "@/services/public";
import { mockRequests, mockMessages } from "@/mocks/public";
import type { AuthUser } from "@/lib/auth-db";
import type { CustomerRequest, SupportMessage } from "@/lib/chat-types";
import employeeAccounts from "@/mocks/employee-accounts.json";
import { chatCopy, chatOrderLabel } from "@/lib/chat-presentation";

type ChatUpdate = { request: CustomerRequest; messages: SupportMessage[] };
type ChatReply = Partial<ChatUpdate> & { ok: boolean; error?: string; user?: AuthUser; requests?: CustomerRequest[] };
const coachImages: Record<string, string> = { Luna: "luna", Nova: "nova", Rift: "rift", Mira: "mira" };
function PersonAvatar({ name, online, customer = false }: { name: string; online?: boolean; customer?: boolean }) {
  const image = !customer && coachImages[name];
  return <span className="messenger-avatar" data-customer={customer}>
    {image ? <Image src={`/images/coaches/${image}.svg`} alt="" width={48} height={48} /> : <span>{name.trim().split(/\s+/).map(part => Array.from(part)[0]).slice(0, 2).join("")}</span>}
    {online !== undefined && <i data-online={online} />}
  </span>;
}

export function MessengerChat({ compact = false, initialRequestId = "", employeeUser }: { compact?: boolean; initialRequestId?: string; employeeUser?: AuthUser }) {
  const { language } = useLanguage();
  const copy = (en: string, vi: string) => translateText(language, en, vi);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [requests, setRequests] = useState<CustomerRequest[]>([]);
  const [selected, setSelected] = useState(initialRequestId);
  const [current, setCurrent] = useState<CustomerRequest | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [query, setQuery] = useState("");
  const [mobileThread, setMobileThread] = useState(Boolean(initialRequestId));
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [connected, setConnected] = useState(false);
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState("");
  const [emojis, setEmojis] = useState(false);
  const [unread, setUnread] = useState<Record<string, number>>({});
  const socket = useRef<Socket | null>(null);
  const activeId = useRef(selected);
  const log = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const failedSend = useRef<{ id: string; text: string; clientId: string } | null>(null);
  const userId = user?.id;
  const demoMode = publicMockMode && (!employeeUser || employeeAccounts.some(account => account.id === employeeUser.id));
  const demoEmployee = demoMode && Boolean(employeeUser);
  const lastMessageId = messages.at(-1)?.id;
  const currentRequestId = current?.id;
  const chatRequest = useCallback((path: string, options: RequestInit) => demoMode ? publicRequest(path, options) : fetch(path, options), [demoMode]);
  useEffect(() => { activeId.current = selected; }, [selected]);

  const applyUpdate = useCallback((update: ChatUpdate) => {
    if (demoMode) persistDemoChat(update.request, update.messages);
    setRequests(rows => [...rows.filter(row => row.id !== update.request.id), update.request].sort((a, b) => b.updatedAt - a.updatedAt));
    if (update.request.id === activeId.current) {
      setCurrent(update.request);
      setMessages(update.messages);
    }
  }, [demoMode]);

  const refreshList = useCallback(async (signal?: AbortSignal) => {
    if (demoEmployee && employeeUser) {
      if (signal?.aborted) return;
      setUser(employeeUser);
      setLoaded(true);
      if (socket.current?.connected) {
        const result = await socket.current.timeout(10000).emitWithAck("chat:list", {}) as ChatReply;
        if (signal?.aborted) return;
        if (!result.ok || !result.requests) throw new Error("connection");
        setRequests(result.requests);
        setSelected(value => value || result.requests![0]?.id || "");
      }
      return;
    }
    const response = await chatRequest("/api/requests", { cache: "no-store", signal });
    if (response.status === 401) { setUser(null); setLoaded(true); return; }
    if (!response.ok) throw new Error("connection");
    const data = await response.json() as { user: AuthUser; requests: CustomerRequest[] };
    if (signal?.aborted) return;
    const viewer = demoMode && employeeUser ? employeeUser : data.user;
    setUser(viewer);
    const missing = demoMode ? mockRequests.filter(row => !data.requests.some(existing => existing.id === row.id)) : [];
    missing.forEach(row => persistDemoChat(row, structuredClone(mockMessages[row.id])));
    const rows = [...data.requests, ...missing].filter(row => viewer.role !== "employee" || row.employeeId === viewer.id).sort((a, b) => b.updatedAt - a.updatedAt);
    setRequests(rows);
    setSelected(value => value || rows[0]?.id || "");
    setLoaded(true);
  }, [chatRequest, demoMode, demoEmployee, employeeUser]);

  useEffect(() => {
    const controller = new AbortController();
    void Promise.resolve().then(() => refreshList(controller.signal)).catch(() => { if (!controller.signal.aborted) { setError("connection"); setLoaded(true); } });
    return () => controller.abort();
  }, [refreshList]);

  useEffect(() => {
    if (!userId) return;
    const client = createChatSocket(demoMode, Boolean(employeeUser), employeeUser?.id);
    socket.current = client;
    client.on("connect", () => {
      setConnected(true); setError("");
      client.timeout(10000).emit("chat:unread:get", {}, (timeout: Error | null, result: { ok: boolean; unread: { byRequest: Record<string, number> } }) => {
        if (!timeout && result?.ok) setUnread(result.unread.byRequest);
      });
      client.timeout(10000).emit("chat:list", {}, (timeout: Error | null, result: ChatReply) => {
        if (timeout || !result?.ok || !result.user || !result.requests) { setError("connection"); return; }
        setUser(result.user); setRequests(result.requests);
        setSelected(id => result.requests!.some(row => row.id === id) || /^DEMO-[a-f0-9-]{8,36}$/.test(id) ? id : result.requests![0]?.id ?? "");
      });
    });
    client.on("disconnect", () => { setConnected(false); setJoined(false); });
    client.on("connect_error", () => { setConnected(false); setJoined(false); setError("connection"); });
    client.on("chat:update", applyUpdate);
    client.on("chat:unread", (data: { byRequest: Record<string, number> }) => { if (data?.byRequest) setUnread(data.byRequest); });
    client.on("chat:changed", () => { void refreshList().catch(() => setError("connection")); });
    client.connect();
    return () => { client.disconnect(); socket.current = null; };
  }, [userId, applyUpdate, refreshList, demoMode, employeeUser]);

  useEffect(() => {
    if (!selected || !userId) return;
    const controller = new AbortController();
    async function loadThread() {
      if (demoEmployee) {
        if (!connected || !socket.current?.connected) return;
        const result = await socket.current.timeout(10000).emitWithAck("chat:join", { id: selected }) as ChatReply;
        if (controller.signal.aborted) return;
        if (!result.ok || !result.request || !result.messages) throw new Error(result.error ?? "connection");
        applyUpdate({ request: result.request, messages: result.messages });
        setJoined(true);
        setError("");
        return;
      }
      const response = await chatRequest(`/api/requests/${encodeURIComponent(selected)}`, { cache: "no-store", signal: controller.signal });
      if (!response.ok) throw new Error("connection");
      const data = await response.json() as ChatUpdate;
      if (controller.signal.aborted) return;
      setCurrent(data.request); setMessages(data.messages);
      if (connected && socket.current) {
        socket.current.timeout(10000).emit("chat:join", { id: selected, ...(demoMode ? { seed: data } : {}) }, (timeout: Error | null, result: ChatReply) => {
          if (controller.signal.aborted) return;
          if (timeout || !result?.ok || !result.request || !result.messages) { setError(result?.error ?? "connection"); return; }
          applyUpdate({ request: result.request, messages: result.messages }); setJoined(true); setError("");
        });
      }
    }
    void loadThread().catch(() => { if (!controller.signal.aborted) setError("connection"); });
    return () => controller.abort();
  }, [selected, connected, userId, applyUpdate, chatRequest, demoMode, demoEmployee]);

  useEffect(() => {
    if (log.current) log.current.scrollTop = log.current.scrollHeight;
  }, [messages.length, selected, mobileThread]);
  useEffect(() => {
    if (!connected || !joined || !lastMessageId || currentRequestId !== selected) return;
    const markRead = () => {
      const visible = log.current && log.current.getClientRects().length > 0;
      if (document.visibilityState !== "visible" || !visible || !socket.current?.connected) return;
      socket.current.timeout(10000).emit("chat:read", { id: selected, messageId: lastMessageId }, () => {});
    };
    const frame = requestAnimationFrame(markRead);
    document.addEventListener("visibilitychange", markRead);
    window.addEventListener("focus", markRead);
    return () => { cancelAnimationFrame(frame); document.removeEventListener("visibilitychange", markRead); window.removeEventListener("focus", markRead); };
  }, [connected, joined, lastMessageId, currentRequestId, selected, mobileThread]);
  useEffect(() => {
    if (!input.current) return;
    input.current.style.height = "auto";
    input.current.style.height = `${Math.min(100, input.current.scrollHeight)}px`;
  }, [draft]);

  function choose(id: string) {
    activeId.current = id;
    if (id !== selected) { setCurrent(null); setMessages([]); setDraft(""); setSelected(id); setJoined(false); }
    setMobileThread(true); setEmojis(false); setError("");
  }
  const canSend = Boolean(current && connected && joined && current.status === "assigned" && current.employeeId && (user?.role !== "employee" || current.employeeId === user.id));
  async function send() {
    if (!draft.trim() || pending || !canSend || !current || !socket.current) return;
    const id = current.id;
    const text = draft.trim();
    const clientId = failedSend.current?.id === id && failedSend.current.text === text ? failedSend.current.clientId : crypto.randomUUID();
    failedSend.current = { id, text, clientId };
    setPending(true); setError("");
    try {
      const result = await socket.current.timeout(10000).emitWithAck("chat:send", { id, text, clientId }) as ChatReply;
      if (!result.ok || !result.request || !result.messages) throw new Error(result.error ?? "connection");
      applyUpdate({ request: result.request, messages: result.messages });
      failedSend.current = null;
      if (activeId.current === id) { setDraft(""); input.current?.focus(); }
    } catch { setError("send"); }
    finally { setPending(false); }
  }
  const time = (at: number) => new Date(at).toLocaleTimeString(intlLocales[language], { hour: "2-digit", minute: "2-digit" });
  const filtered = requests.filter(row => `${row.customerName} ${row.employeeName} ${row.subject}`.toLowerCase().includes(query.toLowerCase()));
  const otherName = (row: CustomerRequest) => user?.role === "employee" ? row.customerName : row.employeeName ?? copy("Waiting for a booster", "Chờ booster nhận đơn");

  if (!loaded) return <div className="support-inbox-gate" role="status">{copy("Loading conversations…", "Đang tải hội thoại…")}</div>;
  if (!user) return <div className="support-inbox-gate"><MessageCircle size={32} /><h2>{copy("Your messages", "Tin nhắn của bạn")}</h2><Link className="button" href={employeeUser ? "/employee/login" : "/login?next=/messages"}>{copy("Sign in to chat", "Đăng nhập để trò chuyện")}</Link>{error && <p role="alert">{copy("Unable to load conversations.", "Chưa thể tải hội thoại.")}</p>}</div>;

  return <div className={`messenger-chat${compact ? " messenger-compact" : ""}`} data-thread-open={mobileThread}>
    <aside className="messenger-sidebar">
      <header><h2>{copy("Chats", "Đoạn chat")}</h2><span>{requests.length}</span></header>
      <label className="messenger-search"><Search size={17} /><input aria-label={copy("Search conversations", "Tìm hội thoại")} placeholder={copy("Search messages", "Tìm kiếm tin nhắn")} value={query} onChange={e => setQuery(e.target.value)} /></label>
      <nav aria-label={copy("Conversations", "Hội thoại")}>
        {filtered.map(row => <button type="button" key={row.id} data-unread={Boolean(unread[row.id])} aria-pressed={selected === row.id} onClick={() => choose(row.id)}>
          <PersonAvatar name={otherName(row)} customer={user.role === "employee"} online={user.role === "employee" ? undefined : Boolean(row.employeeOnline)} />
          <span className="messenger-conversation-copy"><strong>{otherName(row)}<small>{user.role === "employee" ? copy("Customer", "Khách hàng") : row.employeeId ? "Booster" : ""}</small></strong><small className="messenger-order">#{chatOrderLabel(row.id)} · {chatCopy(row.subject)}{row.status === "resolved" && ` · ${copy("Completed", "Hoàn tất")}`}</small><span><span>{chatCopy(row.lastMessage || row.subject)}</span><time dateTime={new Date(row.updatedAt).toISOString()}>{time(row.updatedAt)}</time></span></span>
          {unread[row.id] > 0 && <b className="chat-unread-badge" aria-label={`${unread[row.id]} ${copy("unread messages", "tin nhắn chưa đọc")}`}>{unread[row.id] > 99 ? "99+" : unread[row.id]}</b>}
        </button>)}
        {!filtered.length && <p className="messenger-empty">{copy("No conversations found", "Không tìm thấy hội thoại")}</p>}
      </nav>
      <footer><PersonAvatar name={user.name} customer={user.role !== "employee"} /><span><strong>{user.name}</strong><small>{copy("You", "Bạn")}</small></span></footer>
    </aside>
    <section className="messenger-thread">
      {current ? <>
        <header><button type="button" className="messenger-back" onClick={() => setMobileThread(false)} aria-label={copy("Back to conversations", "Quay lại hội thoại")}><ArrowLeft size={20} /></button><PersonAvatar name={otherName(current)} customer={user.role === "employee"} online={user.role === "employee" ? undefined : Boolean(current.employeeOnline)} /><div><h2>{otherName(current)} <span>{user.role === "employee" ? copy("Customer", "Khách hàng") : current.employeeId ? <><ShieldCheck size={14} aria-hidden="true" /><span className="sr-only">Booster</span></> : null}</span></h2><p data-online={user.role === "employee" ? undefined : Boolean(current.employeeOnline)}>{user.role === "employee" ? copy("Customer conversation", "Hội thoại với khách hàng") : !current.employeeId ? copy("Waiting for assignment", "Chờ phân công") : current.employeeOnline ? copy("Active now", "Đang hoạt động") : copy("Offline", "Ngoại tuyến")}</p></div><span className="messenger-connection" data-connected={connected && joined} role="status" title={copy("Chat connection", "Kết nối chat")}><i />{connected && joined ? copy("Connected", "Đã kết nối") : copy("Connecting…", "Đang kết nối…")}</span></header>
        <div className="messenger-order-context">#{chatOrderLabel(current.id)} · {chatCopy(current.subject)} · {current.status === "resolved" ? copy("Completed", "Hoàn tất") : current.status === "assigned" ? copy("Assigned", "Đã có booster") : copy("Waiting for assignment", "Chờ phân công")}</div>
        {error && <p className="messenger-error" role="alert">{error === "send" ? copy("Message could not be sent. Your draft is saved; try again.", "Chưa gửi được tin nhắn. Nội dung vẫn được giữ, hãy thử lại.") : copy("Reconnecting to chat…", "Đang kết nối lại chat…")}</p>}
        <div className="messenger-log" ref={log} role="log" aria-live="polite" aria-relevant="additions" aria-label={copy("Chat messages", "Tin nhắn chat")}>
          <p className="messenger-intro">{chatCopy(current.subject)} · {user.name} ↔ {otherName(current)}</p>
          {messages.map((message, index) => {
            const own = message.senderId === user.id;
            const previous = messages[index - 1];
            const next = messages[index + 1];
            const first = !previous || previous.senderId !== message.senderId || message.createdAt - previous.createdAt > 300000;
            const last = !next || next.senderId !== message.senderId || next.createdAt - message.createdAt > 300000;
            const day = !previous || new Date(previous.createdAt).toDateString() !== new Date(message.createdAt).toDateString();
            return <div className="messenger-message-block" key={message.id}>{day && <time className="messenger-day" dateTime={new Date(message.createdAt).toISOString()}>{new Date(message.createdAt).toLocaleDateString(intlLocales[language], { month: "short", day: "numeric" })}</time>}<article className="messenger-message" data-own={own} data-first={first} data-last={last} aria-label={`${own ? user.name : message.senderName} · ${time(message.createdAt)}`}>
              {!own && <span className="messenger-message-avatar" data-show={last}><PersonAvatar name={message.senderName} customer={message.senderRole === "customer"} /></span>}
              <div className="messenger-message-content"><small className="messenger-sender">{own ? user.name : message.senderName}{message.senderRole === "employee" && <ShieldCheck size={11} aria-hidden="true" />}</small><p title={time(message.createdAt)}>{message.senderRole === "employee" ? chatCopy(message.text) : message.text}</p>{last && <time className="messenger-message-time" dateTime={new Date(message.createdAt).toISOString()}>{time(message.createdAt)}{own && <><Check size={11} />{copy("Sent", "Đã gửi")}</>}</time>}</div>
            </article></div>;
          })}
          {!messages.length && <p className="messenger-empty">{copy("Start your conversation", "Bắt đầu cuộc trò chuyện")}</p>}
        </div>
        <form className="messenger-composer" data-pending={pending} onSubmit={e => { e.preventDefault(); void send(); }}>
          <div className="messenger-input-wrap"><textarea aria-label={copy("Message", "Tin nhắn")} placeholder={current.status === "open" ? copy("Waiting for a booster to accept this order", "Chờ booster nhận đơn để trò chuyện") : current.status === "resolved" ? copy("Conversation completed", "Hội thoại đã hoàn tất") : copy("Write a message…", "Nhập tin nhắn…")} ref={input} value={draft} maxLength={2000} rows={1} disabled={pending || current.status !== "assigned"} onChange={e => setDraft(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); void send(); } }} /><button type="button" className="messenger-emoji-button" disabled={current.status !== "assigned"} aria-label={copy("Choose emoji", "Chọn biểu tượng cảm xúc")} aria-expanded={emojis} onClick={() => setEmojis(value => !value)}>{emojis ? <X size={20} /> : <Smile size={22} />}</button>{emojis && <div className="messenger-emojis" role="group" aria-label={copy("Emoji", "Biểu tượng cảm xúc")}>{["😊", "👍", "❤️", "🎮", "🔥", "🙌"].map(emoji => <button type="button" key={emoji} aria-label={emoji} onClick={() => { setDraft(value => `${value}${emoji}`.slice(0, 2000)); setEmojis(false); input.current?.focus(); }}>{emoji}</button>)}</div>}</div>
          <button type="submit" className="messenger-send" disabled={!draft.trim() || !canSend || pending} aria-label={copy("Send message", "Gửi tin nhắn")}><Send size={23} /></button>
        </form>
      </> : <div className="support-inbox-gate"><MessageCircle size={36} /><h2>{error ? copy("Unable to load conversations", "Chưa thể tải hội thoại") : copy("Choose a conversation", "Chọn một hội thoại")}</h2><p>{error ? copy("Check the chat connection and try again.", "Kiểm tra kết nối chat và thử lại.") : copy("Your booster conversations appear here after placing an order.", "Hội thoại với Booster xuất hiện tại đây sau khi đặt hàng.")}</p></div>}
    </section>
  </div>;
}
