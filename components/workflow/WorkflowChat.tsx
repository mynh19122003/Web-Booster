"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Send, MessageSquare, LockKeyhole } from "lucide-react";
import { useWorkflow } from "@/lib/workflow/store";
import { chatService } from "@/services/workflow-adapter";
import { PageHeader, EmptyState } from "@/components/admin/portal/Ui";
import { useAllowed, Badge, Facts, date } from "./Shared";
export function WorkflowChat({
  mode,
  fixedConversation,
  initialConversation,
}: {
  mode: "admin" | "employee";
  fixedConversation?: string;
  initialConversation?: string;
}) {
  const s = useWorkflow();
  const adminView = useAllowed("chat.view");
  const adminSend = useAllowed("chat.send");
  const employeeView = useAllowed("employee.view");
  const [selected, setSelected] = useState(
    fixedConversation || initialConversation || "",
  );
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [channel, setChannel] = useState<"CUSTOMER" | "INTERNAL">("CUSTOMER");
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const log = useRef<HTMLDivElement>(null);
  const allowed = mode === "employee" || adminView;
  const all = !allowed
    ? []
    : mode === "admin"
      ? s.conversations
      : chatService.getEmployeeConversations();
  const filtered = all.filter((c) => {
    const o = s.orders.find((o) => o.id === c.orderId)!;
    const employee = s.employees.find((e) => e.id === o.employeeId);
    return (
      `${o.id} ${c.participant.name} ${employee?.name || ""}`
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (filter === "ALL" ||
        (filter === "ACTIVE" && !c.archived) ||
        (filter === "CLOSED" && c.archived) ||
        (filter === "COMPLAINT" &&
          ["OPEN", "UNDER_REVIEW"].includes(o.complaintStatus || "")))
    );
  });
  const conversation =
    all.find((c) => c.id === (fixedConversation || selected)) ||
    (!selected && !fixedConversation ? filtered[0] : undefined);
  const order = s.orders.find((o) => o.id === conversation?.orderId);
  const employee = s.employees.find((e) => e.id === order?.employeeId);
  const visible = conversation
    ? mode === "employee"
      ? chatService.getEmployeeMessages(conversation.id)
      : s.messages.filter(
          (m) => m.conversationId === conversation.id && m.channel === channel,
        )
    : [];
  const writable =
    conversation &&
    !conversation.archived &&
    (mode === "admin"
      ? adminSend
      : order?.employeeId === s.employeeId && order?.status === "IN_PROGRESS");
  useEffect(() => {
    log.current?.scrollTo({ top: log.current.scrollHeight });
  }, [visible.length, conversation?.id, channel]);
  if (!allowed) return <EmptyState title="Không có quyền xem tin nhắn" />;
  return (
    <>
      {!fixedConversation && (
        <PageHeader
          eyebrow="LIÊN LẠC"
          title="Tin nhắn"
          description={
            mode === "admin"
              ? "Theo dõi mọi trao đổi giữa khách hàng và nhân viên."
              : "Chỉ các cuộc trò chuyện của đơn bạn đã nhận."
          }
        />
      )}
      <div className={`wf-chat ${fixedConversation ? "wf-chat-embedded" : ""}`}>
        {!fixedConversation && (
          <aside className="wf-chat-list">
            <label className="ap-search">
              <input
                aria-label="Tìm cuộc trò chuyện"
                placeholder="Khách hàng, nhân viên, mã đơn…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
            {mode === "admin" && (
              <select
                aria-label="Lọc cuộc trò chuyện"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="ALL">Tất cả</option>
                <option value="ACTIVE">Đang hoạt động</option>
                <option value="COMPLAINT">Có khiếu nại</option>
                <option value="CLOSED">Đã đóng</option>
              </select>
            )}
            {filtered.map((c) => (
              <button
                className={`wf-conversation ${conversation?.id === c.id ? "active" : ""}`}
                key={c.id}
                onClick={() => {
                  setSelected(c.id);
                  setBody("");
                  setError("");
                }}
              >
                <MessageSquare size={18} />
                <span>
                  <strong>{c.participant.name}</strong>
                  <small>
                    #{c.orderId} · {date(c.updatedAt)}
                  </small>
                </span>
              </button>
            ))}
            {!filtered.length && <p>Không có cuộc trò chuyện phù hợp.</p>}
          </aside>
        )}
        <section className="wf-chat-main">
          {conversation && order ? (
            <>
              <header className="wf-chat-header">
                <div>
                  <strong>{conversation.participant.name}</strong>
                  <small>
                    #{order.id} · {order.game}
                    {mode === "admin" &&
                      ` · ${employee?.name || "Chưa phân công"}`}
                  </small>
                </div>
                <Badge status={order.status} />
              </header>
              {mode === "admin" && (
                <div className="wf-chat-tabs">
                  <button
                    className={channel === "CUSTOMER" ? "active" : ""}
                    onClick={() => setChannel("CUSTOMER")}
                  >
                    Khách hàng ↔ Nhân viên
                  </button>
                  <button
                    className={channel === "INTERNAL" ? "active" : ""}
                    onClick={() => setChannel("INTERNAL")}
                  >
                    <LockKeyhole size={14} /> Ghi chú nội bộ
                  </button>
                </div>
              )}
              {mode === "admin" && channel === "INTERNAL" && (
                <p className="wf-banner">
                  Ghi chú nội bộ — chỉ Admin/Staff có thể xem.
                </p>
              )}
              <div
                className="wf-message-log"
                ref={log}
                role="log"
                aria-label="Tin nhắn"
              >
                {visible.map((m) => (
                  <article
                    className={`wf-message ${m.channel === "INTERNAL" ? "internal" : ""} ${m.sender.role === "CUSTOMER" ? "customer" : "team"}`}
                    key={m.id}
                  >
                    <header>
                      <strong>{m.sender.name}</strong>
                      <span>{date(m.at)}</span>
                    </header>
                    <p>{m.body}</p>
                    {m.attachment && (
                      <small>Đính kèm: {m.attachment.name}</small>
                    )}
                  </article>
                ))}
                {!visible.length && (
                  <EmptyState
                    title="Bắt đầu cuộc trò chuyện"
                    text="Trao đổi rõ ràng để xử lý đơn tốt hơn."
                  />
                )}
              </div>
              {writable ? (
                <form
                  className="wf-composer"
                  onSubmit={async (event) => {
                    event.preventDefault();
                    if (pending) return;
                    setPending(true);
                    setError("");
                    try {
                      await chatService.send(
                        conversation.id,
                        body,
                        mode === "employee" ? "CUSTOMER" : channel,
                        mode,
                      );
                      setBody("");
                    } catch (e) {
                      setError((e as Error).message);
                    } finally {
                      setPending(false);
                    }
                  }}
                >
                  <textarea
                    aria-label={
                      channel === "INTERNAL"
                        ? "Ghi chú nội bộ"
                        : "Nội dung tin nhắn"
                    }
                    placeholder="Nhập tin nhắn…"
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    rows={3}
                    maxLength={4000}
                    disabled={pending}
                  />
                  <footer>
                    {error && (
                      <p role="alert" className="ap-error">
                        {error}
                      </p>
                    )}
                    <button
                      className="ap-button primary"
                      disabled={pending || !body.trim()}
                    >
                      {pending
                        ? "Đang gửi…"
                        : channel === "INTERNAL"
                          ? "Thêm ghi chú"
                          : "Gửi"}
                      <Send size={16} />
                    </button>
                  </footer>
                </form>
              ) : (
                <p className="wf-banner">
                  {mode === "employee"
                    ? "Bạn không còn quyền gửi tin nhắn trong cuộc trò chuyện này."
                    : "Cuộc trò chuyện chỉ cho phép xem."}
                </p>
              )}
            </>
          ) : (
            <EmptyState
              title="Chọn cuộc trò chuyện"
              text="Chọn một cuộc trò chuyện trong danh sách."
            />
          )}
        </section>
        {!fixedConversation && order && conversation && (
          <aside className="wf-chat-context">
            <span className="ap-eyebrow">THÔNG TIN ĐƠN HÀNG</span>
            <h2>#{order.id}</h2>
            <Facts
              items={[
                ["Khách hàng", order.customer.name],
                ["Nhân viên", employee?.name || "Chưa phân công"],
                ["Trò chơi", order.game],
                ["Trạng thái", <Badge key="status" status={order.status} />],
                ["Tạo cuộc trò chuyện", date(order.createdAt)],
                ["Hoạt động mới nhất", date(conversation.updatedAt)],
                ...(mode === "admin" && employeeView && employee
                  ? ([
                      ["IP hiện tại", employee.currentIp],
                      ["Thiết bị", employee.device],
                      ["Hoạt động nhân viên", date(employee.lastActivity)],
                      [
                        "Phiên hoạt động",
                        String(
                          s.sessions.filter(
                            (x) =>
                              x.employeeId === employee.id &&
                              x.status === "ACTIVE",
                          ).length,
                        ),
                      ],
                    ] as [string, string][])
                  : []),
              ]}
            />
            {(mode === "admin" || order.employeeId === s.employeeId) && (
              <Link
                className="ap-button full"
                href={`/${mode}/orders/${order.id}`}
              >
                Mở đơn hàng ↗
              </Link>
            )}
            {mode === "admin" && employeeView && employee && (
              <Link
                className="ap-button full"
                href={`/admin/employees/${employee.id}`}
              >
                Xem nhân viên ↗
              </Link>
            )}
          </aside>
        )}
      </div>
    </>
  );
}
