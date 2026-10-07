"use client";

import { adminText } from "@/lib/admin/vi";
import Link from "next/link";
import { ArrowUpRight, Package, MessageSquare } from "lucide-react";
import { useOperations } from "@/lib/admin/operations-store";

import { can } from "@/services/admin";
import { StatusBadge } from "../portal/Ui";
import { money, usePermission } from "./OrderUi";
export function OperationsOverview() {
  const allowed = usePermission("order.view");
  const chat = usePermission("chat.view");
  const { orders } = useOperations();

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
                value: "—",
                note: "Giá trị đơn đã xác nhận",
              },
              {
                label: "Đơn hàng hôm nay",
                value: "—",
                note: "Hành trình khách hàng mới",
              },
              {
                label: "Đơn đang thực hiện",
                value: "—",
                note: "Trong quy trình xử lý",
              },
              {
                label: "Đơn chưa phân công",
                value: "—",
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
                {!orders.length && (
                  <p className="ap-panel-padding">Chưa có đơn hàng.</p>
                )}
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
                  <strong>—</strong>
                  <div>
                    <i
                      style={{
                        width: "0%",
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
              <small>Dữ liệu chưa khả dụng. · Mở trò chuyện</small>
            </span>
            <ArrowUpRight size={16} />
          </Link>
        )}
      </div>
    </section>
  );
}
