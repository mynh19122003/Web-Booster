"use client";
import Link from "next/link";
import { useCallback, useState } from "react";
import {
  ArrowLeft,
  Gamepad2,
  MessageSquare,
  TrendingUp,
  LockKeyhole,
} from "lucide-react";
import { useOperations } from "@/lib/admin/operations-store";
import { useServiceLoad } from "@/lib/admin/use-operations";
import { orderService, workload } from "@/services/operations";
import {
  PageHeader,
  StatusBadge,
  Avatar,
  AccessDenied,
  FormModal,
  Field,
} from "../portal/Ui";
import { useNotice } from "../portal/AdminShell";
import {
  OrderActions,
  OrderProgressBar,
  OrderTimeline,
  OfferCountdown,
  usePermission,
  LoadingPanel,
  ErrorPanel,
  money,
  dateTime,
} from "./OrderUi";
function Facts({ items }: { items: [string, string][] }) {
  return (
    <dl className="op-facts">
      {items.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}
export function OrderDetail({ id }: { id: string }) {
  const allowed = usePermission("order.view");
  const edit = usePermission("order.update");
  const chat = usePermission("chat.view");
  const { orders, employees, assignments, messages, conversations } =
    useOperations();
  const load = useServiceLoad(
    useCallback(() => orderService.getOrder(id), [id]),
  );
  const [dialog, setDialog] = useState<"progress" | "notes" | null>(null);
  const notice = useNotice();
  if (!allowed) return <AccessDenied />;
  if (load.loading) return <LoadingPanel />;
  if (load.error) return <ErrorPanel {...load} />;
  const order = orders.find((o) => o.id === id);
  if (!order)
    return (
      <ErrorPanel error="This order could not be found." retry={load.retry} />
    );
  const employee = employees.find((e) => e.id === order.employeeId);
  const history = assignments.filter((a) => a.orderId === id).toReversed();
  const offer = history.find((a) => a.status === "OFFERED");
  const conversation = conversations.find((c) => c.orderId === id);
  const preview = messages
    .filter(
      (m) => m.conversationId === conversation?.id && m.channel === "CUSTOMER",
    )
    .slice(-3);
  const milestoneIndex = Math.min(
    order.milestones.length - 1,
    Math.floor((order.progress / 100) * (order.milestones.length - 1)),
  );
  return (
    <>
      <Link className="op-back" href="/admin/orders">
        <ArrowLeft size={15} />
        All orders
      </Link>
      <PageHeader
        eyebrow={`${order.game.toUpperCase()} · ${order.service.toUpperCase()}`}
        title={`Order #${id}`}
        description={`Created ${dateTime(order.createdAt)} · ${order.customer.name}`}
      >
        <StatusBadge status={order.status} />
      </PageHeader>
      <OrderActions order={order} />
      <div className="op-detail-grid">
        <div className="op-detail-main">
          <section className="ap-panel">
            <div className="ap-panel-heading">
              <h2>
                <TrendingUp size={18} />
                Live progress
              </h2>
              <span className="op-demo-label">Local demo updates</span>
              {edit && order.status === "IN_PROGRESS" && (
                <button
                  className="ap-button"
                  onClick={() => setDialog("progress")}
                >
                  Update progress
                </button>
              )}
            </div>
            <div className="ap-panel-padding">
              <OrderProgressBar value={order.progress} />
              <ol className="op-milestones">
                {order.milestones.map((rank, i) => (
                  <li
                    className={i <= milestoneIndex ? "reached" : ""}
                    key={rank}
                  >
                    <span>
                      {i < milestoneIndex
                        ? "✓"
                        : String(i + 1).padStart(2, "0")}
                    </span>
                    <strong>{rank}</strong>
                    {i === milestoneIndex && <small>Current checkpoint</small>}
                  </li>
                ))}
              </ol>
              <p>
                {order.currentLP} LP · Target: {order.targetRank} · Progress
                updates appear across the workspace.
              </p>
            </div>
          </section>
          <div className="op-two-columns">
            <section className="ap-panel ap-prose">
              <h2>Customer information</h2>
              <div className="ap-person op-spaced">
                <Avatar name={order.customer.name} />
                <div>
                  <strong>{order.customer.name}</strong>
                  <small>Customer · {order.customer.id}</small>
                </div>
              </div>
              <Facts
                items={[
                  ["Email", order.customer.email],
                  ["Country", order.customer.country],
                  ["Timezone", order.customer.timezone],
                ]}
              />
            </section>
            <section className="ap-panel ap-prose">
              <h2>
                <Gamepad2 size={18} />
                Game account
              </h2>
              <Facts
                items={[
                  ["Game", order.game],
                  ["Riot ID", order.riotId],
                  ["Region", order.region],
                  ["Starting rank", order.currentRank],
                  ["Current LP", String(order.currentLP)],
                  ["Target", order.targetRank],
                ]}
              />
              <small className="op-safe">
                <LockKeyhole size={12} />
                Game credentials are never displayed.
              </small>
            </section>
          </div>
          <section className="ap-panel ap-prose">
            <h2>Service details</h2>
            <Facts
              items={[
                ["Service type", order.service],
                ["Queue", order.queue],
                ["Desired rank", order.targetRank],
                ["Priority", order.priority],
                ["Expected completion", dateTime(order.deadline)],
                ["Price", money(order.amount)],
              ]}
            />
            <div className="op-option-tags">
              {order.options.map((option) => (
                <span key={option}>{option}</span>
              ))}
            </div>
            <p className="op-instructions">{order.instructions}</p>
          </section>
          <section className="ap-panel">
            <div className="ap-panel-heading">
              <h2>Order timeline</h2>
              <span className="ap-count">Activity log</span>
            </div>
            <OrderTimeline orderId={id} />
          </section>
          <section className="ap-panel">
            <div className="ap-panel-heading">
              <h2>Notes</h2>
              {edit && (
                <button
                  className="ap-button"
                  onClick={() => setDialog("notes")}
                >
                  Edit admin notes
                </button>
              )}
            </div>
            <div className="op-two-columns ap-panel-padding">
              <div className="op-note">
                <span>
                  <LockKeyhole size={13} />
                  Admin · Internal
                </span>
                <p>{order.adminNotes || "No admin notes yet."}</p>
              </div>
              <div className="op-note employee">
                <span>Employee notes</span>
                <p>{order.employeeNotes || "No employee notes yet."}</p>
              </div>
            </div>
          </section>
        </div>
        <aside className="op-detail-aside">
          <section className="ap-panel ap-prose">
            <h2>Assigned employee</h2>
            {employee ? (
              <>
                <div className="ap-person op-spaced">
                  <Avatar name={employee.name} />
                  <div>
                    <strong>{employee.name}</strong>
                    <small>
                      {employee.id} · {employee.type}
                    </small>
                  </div>
                  <span
                    className={employee.online ? "ap-online" : "op-offline"}
                  />
                </div>
                <Facts
                  items={[
                    [
                      "Workload",
                      `${workload(employee.id)} / ${employee.maxActiveOrders} active orders`,
                    ],
                    ["Success rate", `${employee.successRate}%`],
                    ["Status", employee.online ? "Online" : "Offline"],
                    ["Last activity", dateTime(employee.lastActivity)],
                  ]}
                />
                {offer && (
                  <div className="op-offer-state">
                    <strong>Offer sent · Waiting for response</strong>
                    <OfferCountdown expiresAt={offer.expiresAt} />
                    <Link
                      href={`/employee/orders/${id}?employee=${employee.id}`}
                    >
                      Open employee preview →
                    </Link>
                  </div>
                )}
              </>
            ) : (
              <p>
                This order is waiting for a specialist. Use Assign employee to
                send an offer.
              </p>
            )}
          </section>
          <section className="ap-panel ap-prose">
            <h2>Assignment history</h2>
            <div className="op-assignment-history">
              {history.length ? (
                history.map((a) => (
                  <article key={a.id}>
                    <strong>
                      {employees.find((e) => e.id === a.employeeId)?.name}
                    </strong>
                    <div>
                      <StatusBadge status="OFFERED" />
                      <small>{dateTime(a.offeredAt)}</small>
                    </div>
                    {a.status !== "OFFERED" && (
                      <div>
                        <StatusBadge status={a.status} />
                        <small>{dateTime(a.respondedAt ?? a.offeredAt)}</small>
                      </div>
                    )}
                    {a.reason && <p>Reason: {a.reason}</p>}
                  </article>
                ))
              ) : (
                <p>No offers have been sent yet.</p>
              )}
            </div>
          </section>
          {chat && (
            <section className="ap-panel">
              <div className="ap-panel-heading">
                <h2>
                  <MessageSquare size={17} />
                  Chat preview
                </h2>
              </div>
              <div className="ap-panel-padding op-chat-preview">
                {preview.length ? (
                  preview.map((m) => (
                    <div key={m.id}>
                      <strong>
                        {m.sender.name}{" "}
                        <small>{m.sender.role.toLowerCase()}</small>
                      </strong>
                      <p>{m.body}</p>
                    </div>
                  ))
                ) : (
                  <p>No messages yet. Start the conversation.</p>
                )}
                <Link
                  className="ap-button full"
                  href={`/admin/chat?order=${id}`}
                >
                  Open full chat <MessageSquare size={15} />
                </Link>
              </div>
            </section>
          )}
        </aside>
      </div>
      {dialog && (
        <FormModal
          title={
            dialog === "progress"
              ? "Update live progress"
              : "Edit internal notes"
          }
          description={
            dialog === "progress"
              ? "Simulate a progress update. Use Complete order when the target is reached."
              : "Admin notes stay inside the operations workspace."
          }
          submit="Save update"
          onClose={() => setDialog(null)}
          onSubmit={async (data) => {
            if (dialog === "notes")
              await orderService.saveNotes(id, String(data.get("notes")));
            else
              await orderService.updateProgress(
                id,
                Number(data.get("progress")),
                Number(data.get("lp")),
                String(data.get("note")),
              );
            notice("Order update saved (demo).");
          }}
        >
          {dialog === "notes" ? (
            <Field label="Admin notes">
              <textarea
                name="notes"
                rows={5}
                defaultValue={order.adminNotes}
                maxLength={3000}
              />
            </Field>
          ) : (
            <>
              <Field label="Progress percent">
                <input
                  name="progress"
                  type="number"
                  min={order.progress}
                  max={99}
                  defaultValue={Math.min(99, order.progress + 5)}
                  required
                />
              </Field>
              <Field label="Current LP">
                <input
                  name="lp"
                  type="number"
                  min={0}
                  max={100}
                  defaultValue={order.currentLP}
                  required
                />
              </Field>
              <Field label="Update note">
                <textarea
                  name="note"
                  rows={3}
                  maxLength={1000}
                  placeholder="What changed in this session?"
                />
              </Field>
            </>
          )}
        </FormModal>
      )}
    </>
  );
}
