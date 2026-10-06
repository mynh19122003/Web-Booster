"use client";
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
            e instanceof Error ? e.message : "Unable to update read status.",
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
        eyebrow="COMMUNICATION"
        title="Chat center"
        description="One place for every conversation. Keep everyone in the loop."
      >
        <span className="ap-date">
          <MessageSquare size={16} />
          {conversations
            .filter((c) => !c.archived)
            .reduce((sum, c) => sum + c.unread, 0)}{" "}
          unread messages
        </span>
      </PageHeader>
      {error && (
        <p className="ap-error" role="alert">
          {error}
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
                  aria-label="Back to conversations"
                  onClick={() => setSelected("")}
                >
                  <ArrowLeft size={18} />
                </button>
                <Avatar name={conversation.participant.name} />
                <div>
                  <h2>{conversation.participant.name}</h2>
                  <small>
                    {conversation.participant.role.toLowerCase()} · #
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
                      View order
                    </Link>
                  )}
                  {orderView && order && (
                    <button
                      className="ap-button"
                      onClick={() => setCustomerOpen(true)}
                    >
                      View customer
                    </button>
                  )}
                  {send && (
                    <button
                      className="ap-icon-button"
                      aria-label={
                        conversation.archived
                          ? "Reopen conversation"
                          : "Archive conversation"
                      }
                      onClick={() => setArchive(true)}
                    >
                      <Archive size={17} />
                    </button>
                  )}
                  <button
                    className="ap-icon-button"
                    aria-label="Toggle conversation context"
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
                aria-label="Conversation channel"
              >
                <button
                  role="tab"
                  id="customer-chat-tab"
                  aria-selected={channel === "CUSTOMER"}
                  aria-controls="message-log"
                  onClick={() => setChannel("CUSTOMER")}
                >
                  <MessageSquare size={14} />
                  Customer chat
                </button>
                <button
                  role="tab"
                  id="internal-notes-tab"
                  aria-selected={channel === "INTERNAL"}
                  aria-controls="message-log"
                  onClick={() => setChannel("INTERNAL")}
                >
                  <LockKeyhole size={14} />
                  Internal notes
                </button>
              </div>
              {channel === "INTERNAL" && (
                <div className="op-internal-banner">
                  <LockKeyhole size={13} />
                  Only staff can see these notes. Never shared in customer chat.
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
                        ? "Keep your team in the loop"
                        : "Start the conversation"
                    }
                    text={
                      channel === "INTERNAL"
                        ? "Add the first private note for your team."
                        : "Send a helpful first message below."
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
                      {conversation.participant.name} is typing…{" "}
                      <small>demo</small>
                    </span>
                  ) : (
                    <button onClick={() => setTyping(true)}>
                      Preview typing indicator
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
              title="Select a conversation to start messaging."
              text="Customer questions, employee updates, and your team’s private notes — all in one place."
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
          description="Customer profile · Demo data"
          submit="Done"
          onClose={() => setCustomerOpen(false)}
          onSubmit={async () => {}}
        >
          <dl className="op-facts">
            <div>
              <dt>Email</dt>
              <dd>{order.customer.email}</dd>
            </div>
            <div>
              <dt>Country</dt>
              <dd>{order.customer.country}</dd>
            </div>
            <div>
              <dt>Timezone</dt>
              <dd>{order.customer.timezone}</dd>
            </div>
          </dl>
        </FormModal>
      )}
      {archive && conversation && (
        <FormModal
          title={
            conversation.archived
              ? "Reopen conversation?"
              : "Archive conversation?"
          }
          description={
            conversation.archived
              ? "Move this conversation back to the active inbox."
              : "This conversation will move to Archived. You can reopen it later."
          }
          submit={
            conversation.archived
              ? "Reopen conversation"
              : "Archive conversation"
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
