"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { ArrowRight, Gamepad2, LockKeyhole } from "lucide-react";
import { useOperations } from "@/lib/admin/operations-store";
import {
  useOperationsHydration,
  useServiceLoad,
} from "@/lib/admin/use-operations";
import { employeePreviewService } from "@/services/operations";
import {
  PageHeader,
  StatusBadge,
  Avatar,
  EmptyState,
  FormModal,
  Field,
} from "../portal/Ui";
import {
  OfferCountdown,
  OrderProgressBar,
  LoadingPanel,
  ErrorPanel,
  dateTime,
} from "./OrderUi";
export function EmployeeShell({ children }: { children: React.ReactNode }) {
  const ready = useOperationsHydration();
  const { employees, previewEmployeeId } = useOperations();
  const path = usePathname();
  if (!ready) return <LoadingPanel />;
  return (
    <div className="op-employee-shell">
      <header className="op-employee-header">
        <Link href="/employee/orders" className="ap-brand">
          <span className="ap-mark">A</span>
          <span>
            ASCEND<small>EMPLOYEE WORKSPACE</small>
          </span>
        </Link>
        <div className="op-employee-switch">
          <span className="ap-demo-tag">PREVIEW</span>
          <label>
            Explore as
            <select
              aria-label="Preview employee"
              value={previewEmployeeId}
              onChange={(e) =>
                useOperations.setState({ previewEmployeeId: e.target.value })
              }
            >
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
          </label>
          <Link className="ap-button" href="/admin/assignments">
            Back to admin <ArrowRight size={15} />
          </Link>
        </div>
      </header>
      <nav className="op-employee-nav" aria-label="Employee preview navigation">
        <Link
          aria-current={path === "/employee/orders" ? "page" : undefined}
          href="/employee/orders"
        >
          My orders
        </Link>
        <Link
          aria-current={
            path === "/employee/orders/available" ? "page" : undefined
          }
          href="/employee/orders/available"
        >
          Available offers
        </Link>
      </nav>
      <div className="op-employee-content">
        <div className="op-info-banner">
          <LockKeyhole size={17} />
          <span>
            Employee preview · Local demo only
            <small>
              Use the identity selector to explore offers. This is not a real
              employee login.
            </small>
          </span>
        </div>
        {children}
      </div>
    </div>
  );
}
export function EmployeeOrdersPage({
  available = false,
}: {
  available?: boolean;
}) {
  const { orders, previewEmployeeId, assignments } = useOperations();
  const load = useServiceLoad(employeePreviewService.getOrders);
  if (load.loading) return <LoadingPanel />;
  if (load.error) return <ErrorPanel {...load} />;
  const mine = orders.filter(
    (o) =>
      o.employeeId === previewEmployeeId &&
      (available ? o.status === "OFFERED" : o.status !== "OFFERED"),
  );
  return (
    <>
      <PageHeader
        eyebrow="YOUR NEXT CHAPTER"
        title={available ? "Available offers" : "My orders"}
        description={
          available
            ? "Review the brief. Accept work that fits your schedule."
            : "Your assignments and progress, in one place."
        }
      />
      <div className="op-employee-orders">
        {mine.map((o) => {
          const offer = assignments.find(
            (a) => a.orderId === o.id && a.status === "OFFERED",
          );
          return (
            <article className="ap-panel op-order-card" key={o.id}>
              <div className="op-card-top">
                <strong>#{o.id}</strong>
                <StatusBadge status={o.status} />
              </div>
              <h2>
                <Gamepad2 size={18} />
                {o.game}
              </h2>
              <p>
                {o.service} · {o.queue}
              </p>
              <div className="op-rank-path">
                {o.currentRank} → <strong>{o.targetRank}</strong>
              </div>
              <OrderProgressBar value={o.progress} />
              <p>Deadline: {dateTime(o.deadline)}</p>
              {offer && <OfferCountdown expiresAt={offer.expiresAt} />}
              <Link
                className="ap-button primary full"
                href={`/employee/orders/${o.id}`}
              >
                {offer ? "Review offer" : "View order"}
                <ArrowRight size={15} />
              </Link>
            </article>
          );
        })}
      </div>
      {!mine.length && (
        <div className="ap-panel">
          <EmptyState
            title={
              available
                ? "No offers waiting"
                : "Your next assignment starts here"
            }
            text="Offers are sent by the admin team. Switch the preview employee or assign an order from the admin workspace."
          />
        </div>
      )}
    </>
  );
}
export function EmployeeOrderDetail({
  id,
  employeeId,
}: {
  id: string;
  employeeId?: string;
}) {
  const { orders, employees, previewEmployeeId, assignments } = useOperations();
  const [action, setAction] = useState<"accept" | "decline" | "start" | null>(
    null,
  );
  const [result, setResult] = useState("");
  useEffect(() => {
    if (
      employeeId &&
      useOperations.getState().employees.some((e) => e.id === employeeId)
    )
      useOperations.setState({ previewEmployeeId: employeeId });
  }, [employeeId]);
  const order = orders.find(
    (o) => o.id === id && o.employeeId === previewEmployeeId,
  );
  const employee = employees.find((e) => e.id === previewEmployeeId)!;
  const offer = assignments.find(
    (a) =>
      a.orderId === id &&
      a.employeeId === previewEmployeeId &&
      a.status === "OFFERED",
  );
  if (!order)
    return (
      <div className="ap-panel">
        <EmptyState
          title={result || "This order isn’t assigned to you"}
          text={
            result
              ? "The order has returned to the admin assignment queue."
              : "Select the employee who received this offer, or return to your orders."
          }
        >
          <Link className="ap-button" href="/employee/orders/available">
            View available offers
          </Link>
        </EmptyState>
      </div>
    );
  return (
    <>
      <PageHeader
        eyebrow="EMPLOYEE ORDER BRIEF"
        title={`Order #${id}`}
        description={`${order.game} · ${order.service}`}
      >
        <StatusBadge status={order.status} />
      </PageHeader>
      <div className="op-two-columns">
        <section className="ap-panel ap-prose">
          <h2>Your assignment</h2>
          <div className="ap-person op-spaced">
            <Avatar name={employee.name} />
            <strong>{employee.name}</strong>
          </div>
          <div className="op-rank-path">
            {order.currentRank} → <strong>{order.targetRank}</strong>
          </div>
          <dl className="op-facts">
            <div>
              <dt>Region</dt>
              <dd>{order.region}</dd>
            </div>
            <div>
              <dt>Estimated work</dt>
              <dd>{employee.averageHours} hours</dd>
            </div>
            <div>
              <dt>Deadline</dt>
              <dd>{dateTime(order.deadline)}</dd>
            </div>
            <div>
              <dt>Customer timezone</dt>
              <dd>{order.customer.timezone}</dd>
            </div>
            <div>
              <dt>Reward / commission</dt>
              <dd>Not configured in this preview</dd>
            </div>
          </dl>
          <OrderProgressBar value={order.progress} />
        </section>
        <section className="ap-panel ap-prose">
          <h2>Special instructions</h2>
          <p className="op-instructions">{order.instructions}</p>
          <div className="op-option-tags">
            {order.options.map((option) => (
              <span key={option}>{option}</span>
            ))}
          </div>
          {offer ? (
            <div className="op-offer-state">
              <h2>Your response matters</h2>
              <p>
                Accepting reserves your workload. Declining returns the order to
                the admin queue.
              </p>
              <OfferCountdown expiresAt={offer.expiresAt} />
              <div className="op-order-actions">
                <button
                  className="ap-button primary"
                  onClick={() => setAction("accept")}
                >
                  Accept order
                </button>
                <button
                  className="ap-button"
                  onClick={() => setAction("decline")}
                >
                  Decline
                </button>
              </div>
            </div>
          ) : (
            <>
              <p>
                {order.status === "ACCEPTED"
                  ? "Offer accepted. You’re ready to start."
                  : "This order is part of your assigned workload."}
              </p>
              {order.status === "ACCEPTED" && (
                <button
                  className="ap-button primary"
                  onClick={() => setAction("start")}
                >
                  Start work
                </button>
              )}
            </>
          )}
        </section>
      </div>
      {action && (
        <FormModal
          title={
            action === "accept"
              ? "Accept this order?"
              : action === "decline"
                ? "Decline this offer?"
                : "Start work?"
          }
          description={
            action === "decline"
              ? "Give the admin team a short reason so they can find another specialist."
              : "This updates the shared local demo and notifies the admin workspace."
          }
          submit={
            action === "accept"
              ? "Accept order"
              : action === "decline"
                ? "Decline offer"
                : "Start work"
          }
          danger={action === "decline"}
          onClose={() => setAction(null)}
          onSubmit={async (data) => {
            if (action === "start") await employeePreviewService.start(id);
            else {
              if (!offer) throw new Error("This offer is no longer available.");
              await employeePreviewService.respond(
                offer.id,
                action === "accept",
                String(data.get("reason") ?? ""),
              );
              if (action === "decline") setResult("Offer declined");
            }
          }}
        >
          {action === "decline" && (
            <Field label="Decline reason">
              <textarea
                name="reason"
                required
                minLength={5}
                maxLength={1000}
                rows={4}
                placeholder="e.g. Currently unavailable"
              />
            </Field>
          )}
        </FormModal>
      )}
    </>
  );
}
