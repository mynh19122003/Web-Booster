"use client";

import { adminText } from "@/lib/admin/vi";
import Link from "next/link";
import { ArrowUpRight, Package, MessageSquare } from "lucide-react";
import { useOperations } from "@/lib/admin/operations-store";
import { activeStatuses, incomingStatuses } from "@/services/operations";
import { can } from "@/services/admin";
import { StatusBadge } from "../portal/Ui";
import { money, usePermission } from "./OrderUi";
export function OperationsOverview() {
  const allowed = usePermission("order.view");
  const chat = usePermission("chat.view");
  const { orders, conversations } = useOperations();
  const today = new Date().toISOString().slice(0, 10);
  const todaysOrders = orders.filter((o) => o.createdAt.startsWith(today));
  const unread = conversations
    .filter((c) => !c.archived)
    .reduce((sum, c) => sum + c.unread, 0);
  if (!allowed && !chat) return null;
  return (
    <section className="op-overview">
      {allowed && (
        <>
          <div className="op-section-title">
            <h2>
              <Package size={18} />
              Vận hành đơn hàng{" "}
            </h2>
            <Link href="/admin/orders">
              Xem tất cả đơn hàng <ArrowUpRight size={15} />
            </Link>
          </div>
          <div className="ap-stats">
            {[
              {
                label: "Doanh thu hôm nay",
                value: money(
                  todaysOrders
                    .filter(
                      (o) =>
                        !["PENDING", "CANCELLED", "REFUNDED"].includes(
                          o.status,
                        ),
                    )
                    .reduce((sum, o) => sum + o.amount, 0),
                ),
                note: "Giá trị đơn đã xác nhận · dùng thử",
              },
              {
                label: "Đơn hàng hôm nay",
                value: todaysOrders.length,
                note: "Hành trình khách hàng mới",
              },
              {
                label: "Đơn đang thực hiện",
                value: orders.filter((o) => activeStatuses.includes(o.status))
                  .length,
                note: "Trong quy trình xử lý",
              },
              {
                label: "Đơn chưa phân công",
                value: orders.filter((o) => incomingStatuses.includes(o.status))
                  .length,
                note: "Sẵn sàng duyệt hoặc phân công",
              },
            ].map((stat) => (
              <article className="ap-stat" key={stat.label}>
                <span className="op-muted">{stat.label}</span>
                <strong>{stat.value}</strong>
                <small>{stat.note}</small>
              </article>
            ))}
          </div>
          <div className="op-overview-grid">
            <section className="ap-panel">
              <div className="ap-panel-heading">
                <h2>Đơn hàng gần đây</h2>
                <Link href="/admin/orders">
                  Xem tất cả <ArrowUpRight size={14} />
                </Link>
              </div>
              <div className="op-recent-orders">
                {orders
                  .toSorted(
                    (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
                  )
                  .slice(0, 4)
                  .map((o) => (
                    <Link key={o.id} href={`/admin/orders/${o.id}`}>
                      <div>
                        <strong>#{o.id}</strong>
                        <small>
                          {o.customer.name} · {adminText(o.service)}
                        </small>
                      </div>
                      <StatusBadge status={o.status} />
                      <strong>{money(o.amount)}</strong>
                    </Link>
                  ))}
              </div>
            </section>
            <section className="ap-panel ap-prose">
              <h2>Tổng quan trạng thái đơn</h2>
              {["PENDING", "IN_PROGRESS", "COMPLETED"].map((status) => (
                <div className="op-status-metric" key={status}>
                  <span>{adminText(status)}</span>
                  <strong>
                    {orders.filter((o) => o.status === status).length}
                  </strong>
                  <div>
                    <i
                      style={{
                        width: `${(orders.filter((o) => o.status === status).length / Math.max(1, orders.length)) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </section>
          </div>
        </>
      )}
      <div className="op-quick-links">
        {allowed && (
          <Link href="/admin/incoming-orders">
            Duyệt đơn mới <ArrowUpRight size={16} />
          </Link>
        )}
        {allowed && can("order.assign") && (
          <Link href="/admin/assignments">
            Phân công đơn <ArrowUpRight size={16} />
          </Link>
        )}
        {chat && (
          <Link href="/admin/chat">
            <MessageSquare size={16} />
            <span>
              Hoạt động trò chuyện{" "}
              <small>{unread} tin nhắn chưa đọc · Mở trò chuyện</small>
            </span>
            <ArrowUpRight size={16} />
          </Link>
        )}
      </div>
    </section>
  );
}
