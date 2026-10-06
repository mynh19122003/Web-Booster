"use client";

import { adminText, adminError } from "@/lib/admin/vi";
import Link from "next/link";
import { useEffect, useState, useRef, useCallback } from "react";
import {
  ArrowLeft,
  PanelRight,
  Archive,
  LockKeyhole,
  MessageSquare,
} from "lucide-react";
import { useOperations } from "@/lib/admin/operations-store";
import { useServiceLoad } from "@/lib/admin/use-operations";
import { chatService } from "@/services/operations";
import {
  PageHeader,
  Avatar,
  AccessDenied,
  EmptyState,
  FormModal,
  StatusBadge,
} from "../portal/Ui";
import { usePermission, LoadingPanel, ErrorPanel } from "./OrderUi";
import {
  ConversationList,
  ChatMessage,
  ChatComposer,
  ChatContextPanel,
} from "./ChatParts";
export function ChatPage({ orderId = "" }: { orderId?: string }) {
  const allowed = usePermission("chat.view");
  const send = usePermission("chat.send");
  const orderView = usePermission("order.view");
  const { conversations, messages, orders } = useOperations();
  const [selected, setSelected] = useState(orderId ? `chat-${orderId}` : "");
  const [channel, setChannel] = useState<"CUSTOMER" | "INTERNAL">("CUSTOMER");
  const [context, setContext] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(min-width: 1451px)").matches,
  );
  const [archive, setArchive] = useState(false);
  const [customerOpen, setCustomerOpen] = useState(false);
  const [error, setError] = useState("");
  const [typing, setTyping] = useState(false);
  const log = useRef<HTMLDivElement>(null);
  const load = useServiceLoad(
    useCallback(async () => {
      await chatService.getConversations();
      if (orderId) await chatService.ensureOrderConversation(orderId);
    }, [orderId]),
  );
  const messageLoad = useServiceLoad(
    useCallback(async () => {
      if (selected)
        await chatService.getConversationMessages(selected, channel);
    }, [selected, channel]),
  );
  const conversation = conversations.find((c) => c.id === selected);
  const conversationId = conversation?.id;
  const order = orders.find((o) => o.id === conversation?.orderId);
  const visible = messages.filter(
    (m) => m.conversationId === selected && m.channel === channel,
  );
  useEffect(() => {
    if (selected && allowed && conversationId)
      void chatService
        .markAsRead(selected)
        .catch((e: unknown) =>
          setError(
            e instanceof Error
              ? e.message
              : "Không thể cập nhật trạng thái đã đọc.",
          ),
        );
  }, [selected, allowed, conversationId]);
  useEffect(() => {
    if (log.current) log.current.scrollTop = log.current.scrollHeight;
  }, [selected, channel, visible.length, messageLoad.loading]);
  useEffect(() => {
    if (!typing) return;
    const timer = setTimeout(() => setTyping(false), 3000);
    return () => clearTimeout(timer);
  }, [typing]);
  if (!allowed) return <AccessDenied />;
  if (load.loading) return <LoadingPanel />;
  if (load.error) return <ErrorPanel {...load} />;
  return (
    <>
      <PageHeader
        eyebrow="LIÊN LẠC"
        title="Tin nhắn"
        description="Tập trung mọi cuộc trò chuyện để đội ngũ luôn nắm thông tin."
      >
        <span className="ap-date">
          <MessageSquare size={16} />
          {conversations
            .filter((c) => !c.archived)
            .reduce((sum, c) => sum + c.unread, 0)}{" "}
          tin nhắn chưa đọc{" "}
        </span>
      </PageHeader>
      {error && (
        <p className="ap-error" role="alert">
          {adminError(error)}
        </p>
      )}
      <div
        className={`op-chat-layout ${selected ? "has-conversation" : ""} ${context && conversation ? "with-context" : ""}`}
      >
        <ConversationList
          selected={selected}
          onSelect={(id) => {
            setSelected(id);
            setChannel("CUSTOMER");
            setTyping(false);
          }}
        />
        <section className="op-chat-main">
          {conversation ? (
            <>
              <header className="op-chat-header">
                <button
                  className="ap-icon-button op-inbox-back"
                  aria-label="Quay lại danh sách trò chuyện"
                  onClick={() => setSelected("")}
                >
                  <ArrowLeft size={18} />
                </button>
                <Avatar name={conversation.participant.name} />
                <div>
                  <h2>{conversation.participant.name}</h2>
                  <small>
                    {adminText(conversation.participant.role)} · #
                    {conversation.orderId}
                  </small>
                </div>
                {order && orderView && <StatusBadge status={order.status} />}
                <div className="op-chat-header-actions">
                  {orderView && (
                    <Link
                      className="ap-button"
                      href={`/admin/orders/${conversation.orderId}`}
                    >
                      Xem đơn hàng{" "}
                    </Link>
                  )}
                  {orderView && order && (
                    <button
                      className="ap-button"
                      onClick={() => setCustomerOpen(true)}
                    >
                      Xem khách hàng{" "}
                    </button>
                  )}
                  {send && (
                    <button
                      className="ap-icon-button"
                      aria-label={
                        conversation.archived
                          ? "Mở lại cuộc trò chuyện"
                          : "Lưu trữ cuộc trò chuyện"
                      }
                      onClick={() => setArchive(true)}
                    >
                      <Archive size={17} />
                    </button>
                  )}
                  <button
                    className="ap-icon-button"
                    aria-label="Mở hoặc đóng thông tin trò chuyện"
                    aria-expanded={context}
                    onClick={() => setContext(!context)}
                  >
                    <PanelRight size={18} />
                  </button>
                </div>
              </header>
              <div
                className="op-chat-tabs"
                role="tablist"
                aria-label="Kênh trò chuyện"
              >
                <button
                  role="tab"
                  id="customer-chat-tab"
                  aria-selected={channel === "CUSTOMER"}
                  aria-controls="message-log"
                  onClick={() => setChannel("CUSTOMER")}
                >
                  <MessageSquare size={14} />
                  Trao đổi với khách hàng{" "}
                </button>
                <button
                  role="tab"
                  id="internal-notes-tab"
                  aria-selected={channel === "INTERNAL"}
                  aria-controls="message-log"
                  onClick={() => setChannel("INTERNAL")}
                >
                  <LockKeyhole size={14} />
                  Ghi chú nội bộ{" "}
                </button>
              </div>
              {channel === "INTERNAL" && (
                <div className="op-internal-banner">
                  <LockKeyhole size={13} />
                  Chỉ nhân sự quản trị thấy ghi chú này. Không hiển thị cho
                  khách hàng.{" "}
                </div>
              )}
              <div
                className="op-message-log"
                ref={log}
                id="message-log"
                role="tabpanel"
                aria-labelledby={
                  channel === "INTERNAL"
                    ? "internal-notes-tab"
                    : "customer-chat-tab"
                }
              >
                {messageLoad.loading ? (
                  <LoadingPanel />
                ) : messageLoad.error ? (
                  <ErrorPanel {...messageLoad} />
                ) : visible.length ? (
                  visible.map((m) => <ChatMessage key={m.id} message={m} />)
                ) : (
                  <EmptyState
                    title={
                      channel === "INTERNAL"
                        ? "Cập nhật thông tin cho đội ngũ"
                        : "Bắt đầu trò chuyện"
                    }
                    text={
                      channel === "INTERNAL"
                        ? "Thêm ghi chú nội bộ đầu tiên cho đội ngũ."
                        : "Gửi tin nhắn đầu tiên bên dưới."
                    }
                  />
                )}
              </div>
              {channel === "CUSTOMER" && (
                <div className="op-typing-row">
                  {typing ? (
                    <span className="op-typing">
                      <i />
                      <i />
                      <i />
                      {conversation.participant.name} đang nhập…{" "}
                      <small>dùng thử</small>
                    </span>
                  ) : (
                    <button onClick={() => setTyping(true)}>
                      Xem thử trạng thái đang nhập{" "}
                    </button>
                  )}
                </div>
              )}
              <ChatComposer
                key={`${selected}-${channel}`}
                conversation={conversation}
                channel={channel}
              />
            </>
          ) : (
            <EmptyState
              title="Chọn cuộc trò chuyện để bắt đầu nhắn tin."
              text="Câu hỏi của khách hàng, cập nhật của nhân viên và ghi chú nội bộ ở cùng một nơi."
            />
          )}
        </section>
        {context && conversation && (
          <ChatContextPanel
            conversation={conversation}
            onClose={() => setContext(false)}
          />
        )}
      </div>
      {customerOpen && order && orderView && (
        <FormModal
          title={order.customer.name}
          description="Hồ sơ khách hàng · Dữ liệu dùng thử"
          submit="Đóng"
          onClose={() => setCustomerOpen(false)}
          onSubmit={async () => {}}
        >
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
        </FormModal>
      )}
      {archive && conversation && (
        <FormModal
          title={
            conversation.archived
              ? "Mở lại cuộc trò chuyện?"
              : "Lưu trữ cuộc trò chuyện?"
          }
          description={
            conversation.archived
              ? "Đưa cuộc trò chuyện trở lại hộp thư đang hoạt động."
              : "Cuộc trò chuyện sẽ được lưu trữ. Bạn có thể mở lại sau."
          }
          submit={
            conversation.archived
              ? "Mở lại cuộc trò chuyện"
              : "Lưu trữ cuộc trò chuyện"
          }
          onClose={() => setArchive(false)}
          onSubmit={async () => {
            await chatService.archiveConversation(
              conversation.id,
              !conversation.archived,
            );
          }}
        />
      )}
    </>
  );
}
