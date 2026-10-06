"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  Clock3,
  Gamepad2,
  Check,
  ShieldCheck,
} from "lucide-react";
import { useOperations } from "@/lib/admin/operations-store";
import { useAdminStore } from "@/lib/admin/store";
import { can } from "@/services/admin";
import { orderService, workload } from "@/services/operations";
import type { Order, EmployeeCandidate } from "@/types/operations";
import type { Permission } from "@/types/admin";
import {
  Avatar,
  StatusBadge,
  EmptyState,
  FormModal,
  Field,
  ActionMenu,
} from "../portal/Ui";
import { useNotice } from "../portal/AdminShell";
export const money = (amount: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    amount,
  );
export const dateTime = (date: string) =>
  new Intl.DateTimeFormat("en-GB", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
export function usePermission(permission: Permission) {
  useAdminStore((s) => s.user);
  return can(permission);
}
export function LoadingPanel() {
  return (
    <div
      className="op-loading"
      role="status"
      aria-label="Loading workspace data"
    >
      {[0, 1, 2, 3].map((i) => (
        <div className="ap-skeleton" key={i} />
      ))}
      <span>Loading your workspace…</span>
    </div>
  );
}
export function ErrorPanel({
  error,
  retry,
}: {
  error: string;
  retry: () => void;
}) {
  return (
    <div className="ap-panel">
      <EmptyState title="We couldn’t load this workspace" text={error}>
        <button className="ap-button" onClick={retry}>
          Try again
        </button>
      </EmptyState>
    </div>
  );
}
export function OrderProgressBar({
  value,
  label = "Order progress",
}: {
  value: number;
  label?: string;
}) {
  return (
    <div className="op-progress">
      <div>
        <span>{label}</span>
        <strong>{value}%</strong>
      </div>
      <div
        className="op-progress-track"
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={value}
      >
        <span style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
export function OfferCountdown({ expiresAt }: { expiresAt: string }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const seconds = Math.max(0, Math.floor((Date.parse(expiresAt) - now) / 1000));
  return (
    <span className="op-countdown">
      <Clock3 size={13} />
      {seconds
        ? `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")} remaining`
        : "Offer expired"}
    </span>
  );
}
export function EmployeeCandidateCard({
  employee,
  selected,
  disabled,
  onSelect,
}: {
  employee: EmployeeCandidate;
  selected: boolean;
  disabled: boolean;
  onSelect: () => void;
}) {
  const active = workload(employee.id);
  return (
    <label
      className={`op-candidate ${selected ? "selected" : ""} ${disabled ? "unavailable" : ""}`}
    >
      <input
        type="radio"
        name="employee_id"
        value={employee.id}
        checked={selected}
        onChange={onSelect}
        disabled={disabled}
        required
      />
      <div className="ap-person">
        <Avatar name={employee.name} />
        <div>
          <strong>{employee.name}</strong>
          <small>
            {employee.type} · {employee.online ? "Online" : "Offline"}
          </small>
        </div>
        <Check className="op-selected-check" size={18} />
      </div>
      <p>{employee.games.join(" · ")}</p>
      <div className="op-candidate-facts">
        <span>
          Capability<strong>{employee.rank}</strong>
        </span>
        <span>
          Workload
          <strong>
            {active} / {employee.maxActiveOrders}
          </strong>
        </span>
        <span>
          Success<strong>{employee.successRate}%</strong>
        </span>
        <span>
          Avg. completion<strong>{employee.averageHours}h</strong>
        </span>
      </div>
      {disabled && (
        <small className="op-unavailable-badge">
          {active >= employee.maxActiveOrders
            ? "At capacity"
            : "Unavailable for this order"}
        </small>
      )}
    </label>
  );
}
export function AssignEmployeeModal({
  order,
  onClose,
}: {
  order: Order;
  onClose: () => void;
}) {
  const employees = useOperations((s) => s.employees);
  useOperations((s) => s.orders);
  const [query, setQuery] = useState("");
  const [game, setGame] = useState(order.game as string);
  const [rank, setRank] = useState("ALL");
  const [availability, setAvailability] = useState("ALL");
  const [capacity, setCapacity] = useState("ALL");
  const [selected, setSelected] = useState("");
  const notice = useNotice();
  const candidates = employees.filter(
    (e) =>
      e.name.toLowerCase().includes(query.toLowerCase()) &&
      (game === "ALL" || e.games.includes(game as Order["game"])) &&
      (rank === "ALL" || e.rank === rank) &&
      (availability === "ALL" || e.online === (availability === "ONLINE")) &&
      (capacity === "ALL" || workload(e.id) < e.maxActiveOrders),
  );
  return (
    <FormModal
      className="op-assign-modal"
      title={
        order.employeeId
          ? `Reassign #${order.id}`
          : `Assign employee · #${order.id}`
      }
      description={
        order.employeeId
          ? "Confirm a new employee below. The previous assignment will end and a new 15-minute offer will be sent."
          : "Choose the right person. The employee must accept before work begins."
      }
      submit={order.employeeId ? "Confirm reassignment" : "Send offer"}
      onClose={onClose}
      onSubmit={async () => {
        if (!selected) throw new Error("Choose an employee first.");
        await (order.employeeId
          ? orderService.reassignEmployee(order.id, selected)
          : orderService.assignEmployee(order.id, selected));
        notice("Offer sent. Waiting for employee response.");
      }}
    >
      <div className="op-assignment-target">
        <Gamepad2 size={20} />
        <span>
          {order.game}
          <strong>
            {order.currentRank} → {order.targetRank}
          </strong>
        </span>
        <StatusBadge status={order.status} />
      </div>
      <Field label="Search employees">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name…"
        />
      </Field>
      <div className="op-filter-grid">
        <Field label="Game">
          <select value={game} onChange={(e) => setGame(e.target.value)}>
            <option value="ALL">All games</option>
            {["League of Legends", "Valorant", "Teamfight Tactics"].map((g) => (
              <option key={g}>{g}</option>
            ))}
          </select>
        </Field>
        <Field label="Rank capability">
          <select value={rank} onChange={(e) => setRank(e.target.value)}>
            <option value="ALL">All ranks</option>
            {employees.map((e) => (
              <option key={e.id}>{e.rank}</option>
            ))}
          </select>
        </Field>
        <Field label="Availability">
          <select
            value={availability}
            onChange={(e) => setAvailability(e.target.value)}
          >
            <option value="ALL">Any availability</option>
            <option value="ONLINE">Online</option>
            <option value="OFFLINE">Offline</option>
          </select>
        </Field>
        <Field label="Workload">
          <select
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
          >
            <option value="ALL">All workloads</option>
            <option value="OPEN">Has capacity</option>
          </select>
        </Field>
      </div>
      <div className="op-candidates">
        {candidates.map((e) => (
          <EmployeeCandidateCard
            key={e.id}
            employee={e}
            selected={selected === e.id}
            disabled={
              !e.games.includes(order.game) ||
              e.type !== (order.service === "Coaching" ? "COACH" : "BOOSTER") ||
              e.id === order.employeeId ||
              workload(e.id) >= e.maxActiveOrders
            }
            onSelect={() => setSelected(e.id)}
          />
        ))}
        {!candidates.length && (
          <EmptyState
            title="No matching employees"
            text="Adjust the filters to see more candidates."
          />
        )}
      </div>
    </FormModal>
  );
}
export function OrderActions({
  order,
  compact = false,
}: {
  order: Order;
  compact?: boolean;
}) {
  const assign = usePermission("order.assign");
  const edit = usePermission("order.update");
  const cancel = usePermission("order.cancel");
  const chat = usePermission("chat.view");
  const [action, setAction] = useState<
    "assign" | "pause" | "cancel" | "complete" | "start" | "review" | null
  >(null);
  const notice = useNotice();
  const terminal = ["COMPLETED", "CANCELLED", "REFUNDED", "DISPUTED"].includes(
    order.status,
  );
  const controls = (
    <>
      {compact && <Link href={`/admin/orders/${order.id}`}>View order</Link>}
      {assign && !terminal && (
        <button
          className={!compact ? "ap-button primary" : ""}
          onClick={() => setAction("assign")}
        >
          {order.employeeId ? "Reassign" : "Assign employee"}
        </button>
      )}
      {chat && (
        <Link
          className={!compact ? "ap-button" : ""}
          href={`/admin/chat?order=${order.id}`}
        >
          Open chat
        </Link>
      )}
      {edit && ["PENDING", "CONFIRMED"].includes(order.status) && (
        <button
          className={!compact ? "ap-button" : ""}
          onClick={() => setAction("review")}
        >
          Review order
        </button>
      )}
      {edit && order.status === "IN_PROGRESS" && (
        <>
          <button
            className={!compact ? "ap-button" : ""}
            onClick={() => setAction("pause")}
          >
            Pause
          </button>
          <button
            className={!compact ? "ap-button" : ""}
            onClick={() => setAction("complete")}
          >
            Complete
          </button>
        </>
      )}
      {edit && ["ACCEPTED", "PAUSED"].includes(order.status) && (
        <button
          className={!compact ? "ap-button" : ""}
          onClick={() => setAction("start")}
        >
          {order.status === "PAUSED" ? "Resume" : "Start work"}
        </button>
      )}
      {cancel &&
        !["COMPLETED", "CANCELLED", "REFUNDED"].includes(order.status) && (
          <button
            className={!compact ? "ap-button danger" : ""}
            onClick={() => setAction("cancel")}
          >
            Cancel order
          </button>
        )}
    </>
  );
  const labels = {
    pause: "Pause order",
    cancel: "Cancel order",
    complete: "Complete order",
    start: "Start work",
    review: "Review order",
  };
  return (
    <div
      className={compact ? "op-row-actions" : "op-order-actions"}
      onClick={(e) => e.stopPropagation()}
    >
      {compact ? <ActionMenu>{controls}</ActionMenu> : controls}
      {action === "assign" && (
        <AssignEmployeeModal order={order} onClose={() => setAction(null)} />
      )}
      {action && action !== "assign" && (
        <FormModal
          title={`${labels[action]} #${order.id}?`}
          description={
            action === "cancel"
              ? "This action may require a refund. The demo will close active offers; no payment is changed."
              : action === "pause"
                ? "Work will pause until an admin resumes the order."
                : action === "complete"
                  ? "Mark the target as reached and release this employee’s workload."
                  : action === "review"
                    ? "Confirm the order details and move it to the assignment queue."
                    : "Move this accepted assignment into active work."
          }
          submit={labels[action]}
          danger={action === "cancel"}
          onClose={() => setAction(null)}
          onSubmit={async (data) => {
            if (action === "cancel")
              await orderService.cancelOrder(
                order.id,
                String(data.get("reason")),
              );
            if (action === "pause") await orderService.pauseOrder(order.id);
            if (action === "complete")
              await orderService.completeOrder(order.id);
            if (action === "start") await orderService.startOrder(order.id);
            if (action === "review") await orderService.reviewOrder(order.id);
            notice("Order updated in this demo workspace.");
          }}
        >
          {action === "review" ? (
            <dl className="op-review-summary">
              <div>
                <dt>Customer</dt>
                <dd>
                  {order.customer.name}
                  <small>{order.customer.email}</small>
                </dd>
              </div>
              <div>
                <dt>Game</dt>
                <dd>{order.game}</dd>
              </div>
              <div>
                <dt>Service</dt>
                <dd>{order.service}</dd>
              </div>
              <div>
                <dt>Current</dt>
                <dd>{order.currentRank}</dd>
              </div>
              <div>
                <dt>Target</dt>
                <dd>{order.targetRank}</dd>
              </div>
              <div>
                <dt>Region</dt>
                <dd>{order.region}</dd>
              </div>
              <div>
                <dt>Price</dt>
                <dd>{money(order.amount)}</dd>
              </div>
              <div>
                <dt>Options</dt>
                <dd>
                  {[order.priority, order.queue, ...order.options].join(" / ")}
                </dd>
              </div>
              <div>
                <dt>Submitted</dt>
                <dd>{dateTime(order.createdAt)}</dd>
              </div>
            </dl>
          ) : (
            <dl className="op-review-summary">
              <div>
                <dt>Customer</dt>
                <dd>{order.customer.name}</dd>
              </div>
              <div>
                <dt>Service</dt>
                <dd>
                  {order.game} / {order.service}
                </dd>
              </div>
              <div>
                <dt>Current</dt>
                <dd>{order.currentRank}</dd>
              </div>
              <div>
                <dt>Target</dt>
                <dd>{order.targetRank}</dd>
              </div>
            </dl>
          )}
          {action === "cancel" && (
            <Field label="Cancellation reason">
              <textarea
                name="reason"
                required
                minLength={5}
                maxLength={1000}
                rows={3}
              />
            </Field>
          )}
        </FormModal>
      )}
    </div>
  );
}
export function OrderTimeline({ orderId }: { orderId: string }) {
  const events = useOperations((s) => s.events)
    .filter((e) => e.orderId === orderId)
    .toSorted((a, b) => Date.parse(b.at) - Date.parse(a.at));
  return (
    <div className="ap-timeline">
      {events.map((e) => (
        <div className="ap-timeline-item" key={e.id}>
          <span className="ap-timeline-dot">
            <ShieldCheck size={14} />
          </span>
          <div>
            <strong>{e.title}</strong>
            <p>{e.detail}</p>
            <small>
              {e.actor} · {dateTime(e.at)}
            </small>
          </div>
        </div>
      ))}
    </div>
  );
}
export function OrderCard({
  order,
  children,
}: {
  order: Order;
  children?: React.ReactNode;
}) {
  return (
    <article className="ap-panel op-order-card">
      <div className="op-card-top">
        <Link href={`/admin/orders/${order.id}`}>
          #{order.id} <ArrowUpRight size={14} />
        </Link>
        <StatusBadge status={order.status} />
      </div>
      <div className="ap-person">
        <Avatar name={order.customer.name} />
        <div>
          <strong>{order.customer.name}</strong>
          <small>
            {order.game} · {order.service}
          </small>
        </div>
      </div>
      <div className="op-rank-path">
        <span>{order.currentRank}</span>
        <span>→</span>
        <strong>{order.targetRank}</strong>
      </div>
      {children}
    </article>
  );
}
