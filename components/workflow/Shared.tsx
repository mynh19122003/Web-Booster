"use client";
import Link from "next/link";
import type { ReactNode } from "react";
import { useWorkflow } from "@/lib/workflow/store";
import { useAdminStore } from "@/lib/admin/store";
import { can } from "@/services/admin";
import type { Permission } from "@/types/admin";
import {
  statusLabels,
  complaintLabels,
  type OrderStatus,
  type ComplaintStatus,
} from "@/types/workflow";
import { adminText } from "@/lib/admin/vi";
export const money = (amount: number) => `${amount.toLocaleString("vi-VN")}đ`;
export const usd = (amount: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "USD" }).format(
    amount,
  );
export const date = (value?: string) =>
  value
    ? new Date(value).toLocaleString("vi-VN", {
        timeZone: "Asia/Ho_Chi_Minh",
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
      })
    : "—";
export function useAllowed(permission: Permission) {
  useAdminStore((s) => s.user);
  return can(permission);
}
export function Badge({
  status,
  complaint = false,
}: {
  status: OrderStatus | ComplaintStatus | string;
  complaint?: boolean;
}) {
  const label =
    (complaint
      ? complaintLabels[status as ComplaintStatus]
      : statusLabels[status as OrderStatus]) ||
    complaintLabels[status as ComplaintStatus] ||
    (
      {
        ACTIVE: "Hoạt động",
        SUSPENDED: "Đình chỉ",
        REVOKED: "Đã thu hồi",
        HIGH: "Cao",
        NORMAL: "Thông thường",
        REASSIGNED: "Đã chuyển giao",
        REMOVED: "Đã gỡ",
      } as Record<string, string>
    )[status] ||
    adminText(status);
  return <span className={`wf-badge wf-${status.toLowerCase()}`}>{label}</span>;
}
export function Progress({ value }: { value: number }) {
  return (
    <div className="wf-progress" aria-label={`Tiến độ ${value}%`}>
      <div>
        <i style={{ width: `${value}%` }} />
      </div>
      <span>{value}%</span>
    </div>
  );
}
export function Facts({ items }: { items: [string, ReactNode][] }) {
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
export function Panel({
  title,
  children,
  action,
}: {
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="ap-panel wf-panel">
      <header className="ap-panel-heading">
        <h2>{title}</h2>
        {action}
      </header>
      {children}
    </section>
  );
}
export function Stats({ items }: { items: [string, ReactNode][] }) {
  return (
    <div className="wf-stats">
      {items.map(([label, value]) => (
        <article className="ap-stat" key={label}>
          <span>{label}</span>
          <strong>{value}</strong>
          <small>Cập nhật theo hoạt động</small>
        </article>
      ))}
    </div>
  );
}
export function Timeline({
  orderId,
  employeeId,
}: {
  orderId?: string;
  employeeId?: string;
}) {
  const activities = useWorkflow((s) => s.activities);
  return (
    <div className="ap-timeline">
      {activities
        .filter(
          (a) =>
            (!orderId || a.orderId === orderId) &&
            (!employeeId || a.employeeId === employeeId),
        )
        .slice(-15)
        .reverse()
        .map((a) => (
          <div className="ap-timeline-item" key={a.id}>
            <span className="ap-timeline-dot" />
            <div>
              <strong>{adminText(a.title)}</strong>
              <p>{adminText(a.detail)}</p>
              <small>
                {a.actor} · {date(a.at)}
              </small>
            </div>
          </div>
        ))}
    </div>
  );
}
export function OrderLinks({
  id,
  mode = "admin",
}: {
  id: string;
  mode?: "admin" | "employee";
}) {
  return (
    <Link className="ap-button small" href={`/${mode}/orders/${id}`}>
      Xem chi tiết ↗
    </Link>
  );
}
