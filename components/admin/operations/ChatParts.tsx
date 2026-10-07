"use client";

import { adminText } from "@/lib/admin/vi";
import Link from "next/link";
import { useState } from "react";
import {
  Search,
  ArrowUpRight,
  Send,
  Plus,
  FileText,
  Image as ImageIcon,
  LockKeyhole,
  X,
  CheckCheck,
} from "lucide-react";
import type { Conversation, ChatMessage as Message } from "@/types/operations";
import { useOperations } from "@/lib/admin/operations-store";
import { Avatar, StatusBadge, EmptyState, FormModal } from "../portal/Ui";
import { dateTime, OrderProgressBar, money, usePermission } from "./OrderUi";
export function ConversationList({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (id: string) => void;
}) {
  const { conversations, messages } = useOperations();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const filtered = conversations
    .filter(
      (c) =>
        (filter === "Archived" ? c.archived : !c.archived) &&
        (filter !== "Unread" || c.unread > 0) &&
        (filter !== "Customers" || c.participant.role === "CUSTOMER") &&
        (filter !== "Employees" || c.participant.role === "EMPLOYEE") &&
        (filter !== "Orders" || !!c.orderId) &&
        `${c.participant.name} ${c.orderId}`
          .toLowerCase()
          .includes(query.toLowerCase()),
    )
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
  return (
    <aside className="op-conversation-list">
      <header>
        <h2>
          Hộp thư <span className="ap-count">—</span>
        </h2>
        <span className="op-muted">Kết nối mọi người.</span>
      </header>
      <label className="ap-search">
        <Search size={16} />
        <input
          aria-label="Tìm cuộc trò chuyện"
          placeholder="Tìm cuộc trò chuyện…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </label>
      <div
        className="op-chat-filters"
        role="group"
        aria-label="Bộ lọc trò chuyện"
      >
        {["All", "Unread", "Customers", "Employees", "Orders", "Archived"].map(
          (f) => (
            <button
              key={f}
              aria-pressed={filter === f}
              onClick={() => setFilter(f)}
            >
              {adminText(f)}
            </button>
          ),
        )}
      </div>
      <div className="op-conversation-rows">
        {filtered.map((c) => {
          const last = messages
            .filter(
              (m) => m.conversationId === c.id && m.channel === "CUSTOMER",
            )
            .at(-1);
          return (
            <button
              key={c.id}
              className={`op-conversation-row ${selected === c.id ? "active" : ""}`}
              onClick={() => onSelect(c.id)}
              aria-label={`Mở cuộc trò chuyện với ${c.participant.name}`}
              aria-current={selected === c.id ? "true" : undefined}
            >
              <Avatar name={c.participant.name} />
              <span>
                <strong>
                  {c.participant.name}
                  <small>
                    {new Date(c.updatedAt).toLocaleTimeString("vi-VN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </small>
                </strong>
                <span className="op-chat-meta">
                  {adminText(c.participant.role)} · #{c.orderId}
                </span>
                <span className="op-message-snippet">
                  {adminText(last?.body ?? "") || "Chưa có tin nhắn"}
                </span>
              </span>
              {c.unread > 0 && (
                <b
                  className="op-unread"
                  aria-label={`${c.unread} tin nhắn chưa đọc`}
                >
                  {c.unread}
                </b>
              )}
            </button>
          );
        })}
        {!filtered.length && (
          <EmptyState
            title="Chưa có cuộc trò chuyện."
            text="Không có cuộc trò chuyện phù hợp bộ lọc."
          />
        )}
      </div>
    </aside>
  );
}
export function ChatMessage({ message }: { message: Message }) {
  return (
    <article
      className={`op-message ${message.sender.role === "ADMIN" ? "own" : ""} ${message.channel === "INTERNAL" ? "internal" : ""}`}
    >
      <div className="op-message-sender">
        <Avatar name={message.sender.name} />
        <strong>{message.sender.name}</strong>
        <span>{adminText(message.sender.role)}</span>
        {message.channel === "INTERNAL" && (
          <span>
            <LockKeyhole size={11} />
            Chỉ nội bộ{" "}
          </span>
        )}
      </div>
      <div className="op-message-bubble">
        {message.body && <p>{adminText(message.body)}</p>}
        {message.attachment && (
          <div className="op-message-attachment">
            {message.attachment.kind === "image" ? (
              <ImageIcon size={24} />
            ) : (
              <FileText size={24} />
            )}
            <span>
              {message.attachment.name}
              <small>Tệp đính kèm</small>
            </span>
          </div>
        )}
      </div>
      <small className="op-message-time">
        {dateTime(message.at)}
        {message.sender.role === "ADMIN" && (
          <span>
            <CheckCheck size={12} />
            {message.read ? "Đã đọc" : "Đã gửi"}
          </span>
        )}
      </small>
    </article>
  );
}
export function ChatComposer({
  conversation,
  channel,
}: {
  conversation?: Conversation;
  channel: Message["channel"];
}) {
  const allowed = usePermission("chat.send");
  return (
    <form
      className={`op-composer ${channel === "INTERNAL" ? "internal" : ""}`}
      onSubmit={(e) => e.preventDefault()}
    >
      <textarea
        aria-label="Nhập tin nhắn"
        placeholder="Chọn cuộc trò chuyện để bắt đầu nhắn tin."
        disabled
        rows={3}
      />
      <footer>
        <button
          type="button"
          className="ap-icon-button"
          disabled
          aria-label="Thêm tệp đính kèm"
        >
          <Plus size={18} />
        </button>
        <small>
          {!allowed
            ? "Bạn chỉ có quyền xem."
            : !conversation
              ? "Chưa có cuộc trò chuyện."
              : "Dữ liệu chưa khả dụng."}
        </small>
        <button className="ap-button primary" disabled>
          Gửi <Send size={15} />
        </button>
      </footer>
    </form>
  );
}
export function ChatContextPanel({
  conversation,
  onClose,
}: {
  conversation: Conversation;
  onClose: () => void;
}) {
  const { orders, employees } = useOperations();
  const order = orders.find((o) => o.id === conversation.orderId);
  const employee = employees.find((e) => e.id === order?.employeeId);
  const [person, setPerson] = useState<"customer" | "employee" | null>(null);
  const viewOrder = usePermission("order.view");
  if (!order || !viewOrder)
    return (
      <aside className="op-chat-context">
        <button
          className="ap-icon-button"
          aria-label="Đóng thông tin trò chuyện"
          onClick={onClose}
        >
          <X size={16} />
        </button>
        <EmptyState
          title="Thông tin trò chuyện"
          text="Cần quyền xem đơn hàng để mở chi tiết."
        />
      </aside>
    );
  return (
    <aside className="op-chat-context">
      <header>
        <span className="ap-eyebrow">THÔNG TIN ĐƠN HÀNG</span>
        <button
          className="ap-icon-button"
          aria-label="Đóng thông tin trò chuyện"
          onClick={onClose}
        >
          <X size={16} />
        </button>
      </header>
      <div className="op-context-order">
        <span className="op-game-tile">
          {order.game === "Valorant" ? "V" : "L"}
        </span>
        <h2>#{order.id}</h2>
        <p>
          {order.game}
          <br />
          {adminText(order.service)}
        </p>
        <StatusBadge status={order.status} />
      </div>
      <div className="op-rank-path">
        <span>{order.currentRank}</span>→<strong>{order.targetRank}</strong>
      </div>
      <OrderProgressBar value={order.progress} />
      <dl className="op-facts">
        <div>
          <dt>Nhân sự phụ trách</dt>
          <dd>{employee?.name ?? "Chưa phân công"}</dd>
        </div>
        <div>
          <dt>Khách hàng</dt>
          <dd>{order.customer.name}</dd>
        </div>
        <div>
          <dt>Giá trị đơn</dt>
          <dd>{money(order.amount)}</dd>
        </div>
        <div>
          <dt>Dự kiến hoàn thành</dt>
          <dd>{dateTime(order.deadline)}</dd>
        </div>
      </dl>
      <Link href={`/admin/orders/${order.id}`} className="ap-button full">
        Xem đơn hàng <ArrowUpRight size={15} />
      </Link>
      <button className="ap-button full" onClick={() => setPerson("customer")}>
        Xem khách hàng{" "}
      </button>
      {employee && (
        <button
          className="ap-button full"
          onClick={() => setPerson("employee")}
        >
          Xem nhân sự{" "}
        </button>
      )}
      {person && (
        <FormModal
          disabled
          title={person === "customer" ? order.customer.name : employee!.name}
          description={
            person === "customer"
              ? "Hồ sơ khách hàng · Dữ liệu từ máy chủ"
              : "Hồ sơ nhân sự · Dữ liệu từ máy chủ"
          }
          submit="Đóng"
          onClose={() => setPerson(null)}
          onSubmit={async () => {}}
        >
          {person === "customer" ? (
            <dl className="op-facts">
              <div>
                <dt>Email</dt>
                <dd>{order.customer.email}</dd>
              </div>
              <div>
                <dt>Quốc gia</dt>
                <dd>{adminText(order.customer.country)}</dd>
              </div>
              <div>
                <dt>Múi giờ</dt>
                <dd>{order.customer.timezone}</dd>
              </div>
            </dl>
          ) : (
            <dl className="op-facts">
              <div>
                <dt>Mã nhân sự</dt>
                <dd>{employee!.id}</dd>
              </div>
              <div>
                <dt>Loại</dt>
                <dd>{adminText(employee!.type)}</dd>
              </div>
              <div>
                <dt>Khả năng xử lý hạng</dt>
                <dd>{employee!.rank}</dd>
              </div>
              <div>
                <dt>Tỷ lệ thành công</dt>
                <dd>{employee!.successRate}%</dd>
              </div>
            </dl>
          )}
        </FormModal>
      )}
    </aside>
  );
}
