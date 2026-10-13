"use client";
import { publicRequest } from "@/services/public";

import Link from "next/link";
import { motion } from "motion/react";
import { useInteractionMotion } from "@/components/ui/InteractionMotion";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowLeft, CheckCheck, Inbox, MessageCircle, Plus, Search, Send, ShieldCheck } from "lucide-react";
import { useLanguage } from "@/components/ui/LanguageProvider";
import { intlLocales, translateText } from "@/lib/i18n";
import type { AuthUser } from "@/lib/auth-db";
import type { CustomerRequest, RequestStatus, SupportMessage } from "@/lib/chat-types";
import type { OrderRequestDetails } from "@/lib/order-request-types";
import { CustomerOrderPanel } from "@/components/employee/CustomerOrderPanel";

const initials = (name: string) => name.trim().split(/\s+/).filter(Boolean).map(part => Array.from(part)[0]).slice(0, 2).join("").toUpperCase() || "?";

export function SupportInbox({ employee = false, compact = false, direct = false, initialRequestId = "" }: { employee?: boolean; compact?: boolean; direct?: boolean; initialRequestId?: string }) {
  const { language } = useLanguage();
  const { entry } = useInteractionMotion();
  const copy = (english: string, vietnamese: string) => translateText(language, english, vietnamese);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [requests, setRequests] = useState<CustomerRequest[]>([]);
  const [selected, setSelected] = useState(initialRequestId);
  const [current, setCurrent] = useState<CustomerRequest | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [orderDetails, setOrderDetails] = useState<OrderRequestDetails | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [creating, setCreating] = useState(false);
  const [mobileThread, setMobileThread] = useState(Boolean(initialRequestId));
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const bottom = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const employeeMode = user?.role === "employee";
  const directMode = direct && !employeeMode;

  const load = useCallback(async (signal?: AbortSignal) => {
    const response = await publicRequest("/api/requests", { cache: "no-store", signal });
    if (response.status === 401) {
      setUser(null); setRequests([]); setCurrent(null); setMessages([]); setOrderDetails(null); setLoaded(true);
      return;
    }
    if (!response.ok) throw new Error("connection");
    const data = await response.json() as { user: AuthUser; requests: CustomerRequest[] };
    if (signal?.aborted) return;
    setUser(data.user); setRequests(data.requests); setLoaded(true);
    if (!selected) { setSelected(data.requests[0]?.id ?? ""); return; }
    const detailResponse = await publicRequest(`/api/requests/${selected}`, { cache: "no-store", signal });
    if (!detailResponse.ok) {
      setOrderDetails(null);
      if (detailResponse.status === 404) { setSelected(""); setCurrent(null); setMessages([]); setOrderDetails(null); return; }
      throw new Error("connection");
    }
    const detail = await detailResponse.json() as { request: CustomerRequest; messages: SupportMessage[]; orderDetails?: OrderRequestDetails | null };
    if (!signal?.aborted) { setCurrent(detail.request); setMessages(detail.messages); setOrderDetails(data.user.role === "employee" ? detail.orderDetails ?? null : null); }
  }, [selected]);

  useEffect(() => {
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    const poll = async () => {
      try { await load(controller.signal); if (!controller.signal.aborted) setError(value => value === "connection" ? "" : value); }
      catch { if (!controller.signal.aborted) { setError("connection"); setLoaded(true); } }
      if (!controller.signal.aborted) timer = setTimeout(poll, 3000);
    };
    void poll();
    return () => { controller.abort(); clearTimeout(timer); };
  }, [load]);
  useEffect(() => {
    const log = bottom.current?.parentElement;
    if (log) log.scrollTop = log.scrollHeight;
  }, [selected, messages.length, mobileThread, creating, compact]);

  const statusLabel = (status: RequestStatus) => status === "open" ? copy("Waiting for a team member", "Chờ nhân viên tiếp nhận")
    : status === "assigned" ? copy("In progress", "Đang xử lý") : copy("Completed", "Đã hoàn tất");
  const errorMessage = error === "request-changed" || error === "not-assigned"
    ? copy("This request has changed. Refresh the conversation and check its status before replying.", "Yêu cầu đã thay đổi. Vui lòng cập nhật hội thoại và kiểm tra trạng thái trước khi trả lời.")
    : error === "invalid-request" ? copy("Check the request fields and try again.", "Kiểm tra nội dung yêu cầu và thử lại.")
      : error === "unauthorized" ? copy("Your session has expired. Please sign in again.", "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.")
        : copy("Unable to connect. Please try again.", "Chưa thể kết nối. Vui lòng thử lại.");

  async function mutate(url: string, method: string, body: object) {
    const response = await publicRequest(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "connection");
    return result;
  }

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = new FormData(event.currentTarget);
    setBusy(true); setError("");
    try {
      const result = await mutate("/api/requests", "POST", { subject: form.get("subject"), game: form.get("game"), text: form.get("text") });
      setRequests(rows => [result.request, ...rows]); setCurrent(result.request); setMessages([]); setOrderDetails(null);
      setSelected(result.request.id); setCreating(false); setMobileThread(true); setDraft("");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "connection"); }
    finally { setBusy(false); }
  }

  async function send() {
    if (busy || !draft.trim() || !current) return;
    setBusy(true); setError("");
    try {
      await mutate(`/api/requests/${current.id}`, "POST", { text: draft.trim() });
      setDraft(""); await load(); input.current?.focus();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "connection"); }
    finally { setBusy(false); }
  }

  async function act(action: "claim" | "resolve" | "reopen") {
    if (busy || !current) return;
    setBusy(true); setError("");
    try { await mutate(`/api/requests/${current.id}`, "PATCH", { action }); await load(); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "connection"); await load().catch(() => {}); }
    finally { setBusy(false); }
  }

  function choose(id: string) {
    if (id !== selected) { setSelected(id); setCurrent(null); setMessages([]); setOrderDetails(null); setDraft(""); }
    setCreating(false); setMobileThread(true); setError("");
  }
  const filtered = requests.filter(row =>
    `${row.subject} ${row.customerName} ${row.employeeName ?? ""} ${row.game}`.toLowerCase().includes(query.toLowerCase()) &&
    (filter === "all" || (filter === "mine" ? row.employeeId === user?.id : row.status === filter)));
  const canSend = Boolean(current && current.status !== "resolved" && (!employeeMode || current.employeeId === user?.id));

  if (!loaded) return <div className="support-inbox-gate" role="status"><Inbox size={32} /><p>{copy("Loading conversations…", "Đang tải hội thoại…")}</p></div>;
  if (!user) return <div className="support-inbox-gate"><MessageCircle size={36} /><h2>{copy("Talk to our team", "Trò chuyện với đội ngũ hỗ trợ")}</h2><p>{copy("Sign in to send a request and receive replies from our team.", "Đăng nhập để gửi yêu cầu và nhận phản hồi từ nhân viên.")}</p><Link className="button" href={employee ? "/employee/login" : "/login?next=/messages"}>{copy("Sign in", "Đăng nhập")}</Link>{error && <p role="alert">{errorMessage}</p>}</div>;

  return <div className={`support-inbox${compact ? " support-inbox-compact" : ""}${directMode ? " support-inbox-direct" : ""}${employeeMode && !compact ? " support-inbox-employee" : ""}`} data-thread-open={mobileThread || creating}>
    {(!directMode || !compact) && <aside className="support-inbox-sidebar">
      <header><h2>{employeeMode ? copy("Request inbox", "Hộp thư yêu cầu") : copy("Conversations", "Hội thoại")}</h2><span>{requests.length}</span></header>
      {!employeeMode && !directMode && <button type="button" className="button support-new-request" disabled={busy} onClick={() => { setCreating(true); setMobileThread(true); setError(""); }}><Plus size={16} />{copy("New request", "Tạo yêu cầu")}</button>}
      <label className="support-inbox-search"><Search size={16} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder={copy("Search requests…", "Tìm yêu cầu…")} aria-label={copy("Search requests", "Tìm yêu cầu")} /></label>
      <select className="support-inbox-filter" aria-label={copy("Filter requests", "Lọc yêu cầu")} value={filter} onChange={event => setFilter(event.target.value)}>
        <option value="all">{copy("All requests", "Tất cả yêu cầu")}</option>
        {employeeMode && <option value="mine">{copy("Assigned to me", "Tôi đang xử lý")}</option>}
        <option value="open">{copy("Waiting", "Đang chờ")}</option><option value="assigned">{copy("In progress", "Đang xử lý")}</option><option value="resolved">{copy("Completed", "Hoàn tất")}</option>
      </select>
      <nav aria-label={copy("Requests", "Danh sách yêu cầu")}>{filtered.map((row, index) => <motion.button {...entry(index)} type="button" key={row.id} disabled={busy} aria-pressed={selected === row.id && !creating} onClick={() => choose(row.id)}>
        {directMode ? <><div className="support-conversation-person" data-role="employee"><span className="support-chat-avatar" aria-hidden="true">{initials(row.employeeName ?? "ASCEND")}<i data-online={Boolean(row.employeeOnline)} /></span><div><strong>{row.employeeName ?? copy("ASCEND team", "Đội ngũ ASCEND")}</strong><small>Booster · {row.employeeOnline ? copy("Online", "Trực tuyến") : copy("Offline", "Ngoại tuyến")}</small></div></div><small className="support-conversation-customer">{copy("Customer", "Khách hàng")}: {row.customerId === user.id ? user.name : row.customerName}{row.customerId === user.id && ` · ${copy("You", "Bạn")}`}</small><small>{row.subject}</small><p>{row.lastMessage}</p><span className="support-request-status" data-status={row.status}>{statusLabel(row.status)}</span></> : <><span className="support-request-status" data-status={row.status}>{statusLabel(row.status)}</span><strong>{row.subject}</strong><small>{employeeMode ? row.customerName + " · " : ""}{row.game}</small><p>{row.lastMessage}</p></>}
      </motion.button>)}</nav>
      {filtered.length === 0 && <p className="support-inbox-empty">{copy("No requests yet.", "Chưa có yêu cầu.")}</p>}
      <p className="support-inbox-note"><ShieldCheck size={15} />{copy("Conversations with the ASCEND team", "Hội thoại với đội ngũ ASCEND")}</p>
    </aside>}
    <div className="support-inbox-content">
    {employeeMode && !compact && current && <CustomerOrderPanel key={current.id} details={orderDetails} assigned={current.employeeId === user.id} />}
    <section className="support-inbox-thread">
      {(compact && (!directMode || requests.length > 1)) && <div className="support-compact-controls"><select aria-label={copy("Choose a conversation", "Chọn hội thoại")} value={selected} disabled={busy} onChange={event => choose(event.target.value)}>{requests.map(row => <option key={row.id} value={row.id}>{directMode ? `${row.employeeName ?? copy("ASCEND team", "Đội ngũ ASCEND")} · ${row.subject}` : row.subject}</option>)}</select>{!employeeMode && !directMode && <button type="button" className="icon-button" aria-label={copy("New request", "Tạo yêu cầu")} onClick={() => { setCreating(true); setError(""); }}><Plus size={20} /></button>}</div>}
      {error && <div className="support-inbox-error" role="alert">{errorMessage}<button type="button" onClick={() => { setError(""); void load().catch(() => setError("connection")); }}>{copy("Retry", "Thử lại")}</button></div>}
      {creating ? <div className="support-request-form-wrap"><button type="button" className="support-back" onClick={() => { setCreating(false); setMobileThread(false); }}><ArrowLeft size={16} />{copy("Back to requests", "Quay lại danh sách")}</button><h2>{copy("How can we help?", "Bạn cần hỗ trợ gì?")}</h2><p>{copy("Share your goal or question. A team member will take your request.", "Chia sẻ mục tiêu hoặc câu hỏi. Nhân viên sẽ tiếp nhận yêu cầu của bạn.")}</p>
        <form className="support-request-form" onSubmit={create}><label>{copy("Subject", "Tiêu đề")}<input name="subject" required minLength={3} maxLength={120} placeholder={copy("Help with my boost request", "Tư vấn yêu cầu boost của tôi")} /></label><label>{copy("Game", "Trò chơi")}<select name="game">{["League of Legends", "Valorant", "Teamfight Tactics"].map(game => <option key={game}>{game}</option>)}<option value="Other">{copy("Other", "Khác")}</option></select></label><label>{copy("Request details", "Nội dung yêu cầu")}<textarea name="text" rows={5} required maxLength={2000} placeholder={copy("Tell us what you need and your preferred time…", "Mô tả nhu cầu và thời gian mong muốn…")} /></label><button className="button" type="submit" disabled={busy}>{busy ? copy("Sending…", "Đang gửi…") : copy("Send request", "Gửi yêu cầu")}<Send size={16} /></button></form></div>
        : current ? <><header>{!compact && <button className="icon-button support-mobile-back" type="button" onClick={() => setMobileThread(false)} aria-label={copy("Back to requests", "Quay lại danh sách")}><ArrowLeft size={18} /></button>}<div><h2>{directMode ? current.employeeName ?? copy("ASCEND team", "Đội ngũ ASCEND") : current.subject}</h2>{directMode ? <p className="booster-chat-presence" data-online={Boolean(current.employeeOnline)}><i />{current.employeeOnline ? copy("Online", "Trực tuyến") : copy("Offline", "Ngoại tuyến")}</p> : <p>{current.game} · {employeeMode ? current.customerName : current.employeeName ?? copy("ASCEND team", "Đội ngũ ASCEND")}</p>}</div>{!directMode && <span className="support-request-status" data-status={current.status}>{statusLabel(current.status)}</span>}</header>
          {(!directMode || current.status === "resolved") && <div className="support-request-actions">{employeeMode && current.status === "open" && <button className="button" disabled={busy} onClick={() => void act("claim")}>{copy("Accept request", "Nhận yêu cầu")}</button>}{employeeMode && current.employeeId === user.id && current.status === "assigned" && <button type="button" disabled={busy} onClick={() => void act("resolve")}><CheckCheck size={16} />{copy("Mark completed", "Đánh dấu hoàn tất")}</button>}{!employeeMode && current.status === "resolved" && <button type="button" disabled={busy} onClick={() => void act("reopen")}>{copy("Reopen conversation", "Mở lại hội thoại")}</button>}{!directMode && <span>{current.employeeName ? copy("Handled by", "Phụ trách bởi") + " " + current.employeeName : copy("Your request is in the team inbox.", "Yêu cầu đang chờ nhân viên tiếp nhận.")}</span>}</div>}
          <div className="support-chat-identity" aria-label={copy("Conversation participants", "Người tham gia hội thoại")}>
            <div className="support-chat-person" data-role="customer">
              <span className="support-chat-avatar" aria-hidden="true">{initials(current.customerId === user.id ? user.name : current.customerName)}</span>
              <div><small>{copy("Customer", "Khách hàng")}{current.customerId === user.id && ` · ${copy("You", "Bạn")}`}</small><strong>{current.customerId === user.id ? user.name : current.customerName}</strong><span>{copy("Customer ID", "Mã khách hàng")}: {current.customerId}</span></div>
            </div>
            <div className="support-chat-person" data-role="employee">
              <span className="support-chat-avatar" aria-hidden="true">{current.employeeName ? initials(current.employeeName) : <ShieldCheck size={18} />}</span>
              <div><small>Booster{current.employeeId === user.id && ` · ${copy("You", "Bạn")}`}</small><strong>{current.employeeName ?? copy("Awaiting assignment", "Chưa phân công")}</strong><span>{current.subject}</span></div>
            </div>
          </div>
          <div className="support-message-log" role="log" aria-live="polite" aria-relevant="additions" aria-label={copy("Conversation messages", "Tin nhắn hội thoại")}>{messages.map(message => <article className="support-message" key={message.id} data-own={message.senderId === user.id} data-role={message.senderRole}><div className="support-message-sender"><span className="support-chat-avatar" aria-hidden="true">{initials(message.senderId === user.id ? user.name : message.senderName)}</span><strong>{message.senderId === user.id ? user.name : message.senderName}<small>{message.senderRole === "employee" ? "Booster" : copy("Customer", "Khách hàng")}{message.senderId === user.id && ` · ${copy("You", "Bạn")}`}</small></strong></div><p>{message.text}</p><time dateTime={new Date(message.createdAt).toISOString()}>{new Date(message.createdAt).toLocaleString(intlLocales[language], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</time></article>)}<div ref={bottom} /></div>
          <form className="support-message-compose" onSubmit={event => { event.preventDefault(); void send(); }}><label className="sr-only" htmlFor={compact ? "support-message-compact" : "support-message"}>{copy("Message", "Tin nhắn")}</label><textarea id={compact ? "support-message-compact" : "support-message"} ref={input} value={draft} disabled={!canSend || busy} maxLength={2000} rows={2} onChange={event => setDraft(event.target.value)} placeholder={canSend ? copy("Write a message…", "Nhập tin nhắn…") : current.status === "resolved" ? copy("Request completed", "Yêu cầu đã hoàn tất") : copy("Accept this request to reply", "Nhận yêu cầu để trả lời")} onKeyDown={event => { if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); void send(); } }} /><button type="submit" className="support-message-send" aria-label={copy("Send message", "Gửi tin nhắn")} disabled={!canSend || busy || !draft.trim()}><Send size={20} /></button></form>
        </> : <div className="support-inbox-gate"><MessageCircle size={38} /><h2>{copy("Your booster chat", "Trò chuyện với booster")}</h2><p>{copy("Your conversation will appear here after you place an order.", "Hội thoại sẽ xuất hiện tại đây sau khi bạn đặt hàng.")}</p>{!employeeMode && !directMode && <button className="button" onClick={() => { setCreating(true); setMobileThread(true); }}>{copy("New request", "Tạo yêu cầu")}</button>}</div>}
    </section>
    </div>
  </div>;
}
