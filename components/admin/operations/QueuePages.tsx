"use client";
import Link from "next/link";
import { Inbox, ArrowRight, Clock3 } from "lucide-react";
import { useOperations } from "@/lib/admin/operations-store";
import { useServiceLoad } from "@/lib/admin/use-operations";
import {
  orderService,
  assignmentService,
  incomingStatuses,
} from "@/services/operations";
import {
  PageHeader,
  AccessDenied,
  EmptyState,
  StatusBadge,
} from "../portal/Ui";
import {
  OrderCard,
  OrderActions,
  OrderProgressBar,
  OfferCountdown,
  LoadingPanel,
  ErrorPanel,
  usePermission,
  money,
  dateTime,
} from "./OrderUi";
export function IncomingOrdersPage() {
  const allowed = usePermission("order.view");
  const orders = useOperations((s) => s.orders);
  const load = useServiceLoad(orderService.getIncomingOrders);
  if (!allowed) return <AccessDenied />;
  if (load.loading) return <LoadingPanel />;
  if (load.error) return <ErrorPanel {...load} />;
  const sections = [
    {
      title: "New orders",
      status: "PENDING",
      description: "Fresh requests, ready for a first look.",
    },
    {
      title: "Needs review",
      status: "CONFIRMED",
      description: "Payment confirmed. Check the details.",
    },
    {
      title: "Waiting assignment",
      status: "WAITING_ASSIGNMENT",
      description: "Reviewed and ready for the right employee.",
    },
  ];
  return (
    <>
      <PageHeader
        eyebrow="THE ORDER INBOX"
        title="Incoming orders"
        description="A clear queue. A great first impression."
      >
        <span className="ap-date">
          <Inbox size={16} />
          {
            orders.filter((o) => incomingStatuses.includes(o.status)).length
          }{" "}
          waiting
        </span>
        <Link className="ap-button" href="/admin/orders">
          All orders <ArrowRight size={16} />
        </Link>
      </PageHeader>
      <div className="op-info-banner">
        <Clock3 size={18} />
        <span>
          Every great experience starts here.
          <small>
            Review new orders and offer them to an available specialist.
          </small>
        </span>
        <span className="ap-demo-tag">DEMO QUEUE</span>
      </div>
      <div className="op-queue-grid">
        {sections.map((section) => {
          const queue = orders.filter((o) => o.status === section.status);
          return (
            <section key={section.status}>
              <div className="op-lane-heading">
                <h2>
                  {section.title}{" "}
                  <span className="ap-count">{queue.length}</span>
                </h2>
                <p>{section.description}</p>
              </div>
              {queue.map((o) => (
                <OrderCard order={o} key={o.id}>
                  <div className="op-queue-facts">
                    <span>
                      Preferred region<strong>{o.region}</strong>
                    </span>
                    <span>
                      Current LP<strong>{o.currentLP} LP</strong>
                    </span>
                    <span>
                      Price<strong>{money(o.amount)}</strong>
                    </span>
                  </div>
                  <div className="op-option-tags">
                    {o.options.map((option) => (
                      <span key={option}>{option}</span>
                    ))}
                  </div>
                  <p className="op-received">
                    <Clock3 size={13} />
                    Received{" "}
                    {Math.max(
                      1,
                      Math.round(
                        (Date.now() - Date.parse(o.createdAt)) / 60000,
                      ),
                    )}{" "}
                    minutes ago
                  </p>
                  <OrderActions order={o} />
                  <Link className="ap-text-link" href={`/admin/orders/${o.id}`}>
                    Review details →
                  </Link>
                </OrderCard>
              ))}
              {!queue.length && (
                <div className="ap-panel">
                  <EmptyState
                    title="You’re all caught up."
                    text="No new orders are waiting for review."
                  />
                </div>
              )}
            </section>
          );
        })}
      </div>
    </>
  );
}
export function AssignmentsPage() {
  const allowed = usePermission("order.view");
  const { orders, assignments, employees } = useOperations();
  const load = useServiceLoad(assignmentService.getAssignments);
  if (!allowed) return <AccessDenied />;
  if (load.loading) return <LoadingPanel />;
  if (load.error) return <ErrorPanel {...load} />;
  const lanes = [
    {
      title: "Unassigned",
      statuses: ["PENDING", "CONFIRMED", "WAITING_ASSIGNMENT"],
    },
    { title: "Pending offers", statuses: ["OFFERED"] },
    { title: "Accepted", statuses: ["ACCEPTED"] },
    { title: "Active work", statuses: ["IN_PROGRESS", "PAUSED", "DISPUTED"] },
  ];
  return (
    <>
      <PageHeader
        eyebrow="PEOPLE × PROGRESS"
        title="Assignments"
        description="The right specialist. The right order. Full visibility."
      >
        <Link className="ap-button" href="/employee/orders/available">
          Employee preview <ArrowRight size={16} />
        </Link>
      </PageHeader>
      <div className="op-info-banner">
        <span className="op-step">1</span> Offer <ArrowRight size={16} />
        <span className="op-step">2</span> Employee accepts{" "}
        <ArrowRight size={16} />
        <span className="op-step">3</span> Work begins
      </div>
      <div className="op-assignment-board">
        {lanes.map((lane) => {
          const items = orders.filter((o) => lane.statuses.includes(o.status));
          return (
            <section key={lane.title}>
              <div className="op-lane-heading">
                <h2>
                  {lane.title} <span className="ap-count">{items.length}</span>
                </h2>
              </div>
              {items.map((o) => {
                const offer = assignments.find(
                  (a) => a.orderId === o.id && a.status === "OFFERED",
                );
                const employee = employees.find((e) => e.id === o.employeeId);
                return (
                  <OrderCard order={o} key={o.id}>
                    {employee && (
                      <p className="op-assignee">
                        <span className="ap-online" />
                        {employee.name} · {employee.type.toLowerCase()}
                      </p>
                    )}
                    {offer ? (
                      <div className="op-offer-state">
                        <strong>Waiting for employee response…</strong>
                        <OfferCountdown expiresAt={offer.expiresAt} />
                        <Link
                          href={`/employee/orders/${o.id}?employee=${offer.employeeId}`}
                        >
                          Preview accept / decline →
                        </Link>
                      </div>
                    ) : (
                      <OrderProgressBar value={o.progress} />
                    )}
                    <OrderActions order={o} compact />
                  </OrderCard>
                );
              })}
              {!items.length && (
                <EmptyState
                  title="Clear for now"
                  text="Orders appear here as they move forward."
                />
              )}
            </section>
          );
        })}
      </div>
      <section className="ap-panel op-history-panel">
        <div className="ap-panel-heading">
          <h2>Recent assignment decisions</h2>
          <span className="op-muted">Offers are kept in the history</span>
        </div>
        <div className="op-history-list">
          {assignments
            .filter((a) => a.status !== "OFFERED")
            .toReversed()
            .slice(0, 6)
            .map((a) => (
              <div key={a.id}>
                <Link href={`/admin/orders/${a.orderId}`}>#{a.orderId}</Link>
                <strong>
                  {employees.find((e) => e.id === a.employeeId)?.name}
                </strong>
                <StatusBadge status={a.status} />
                <span>{a.reason ?? "Employee response recorded"}</span>
                <small>{dateTime(a.respondedAt ?? a.offeredAt)}</small>
              </div>
            ))}
        </div>
      </section>
    </>
  );
}
