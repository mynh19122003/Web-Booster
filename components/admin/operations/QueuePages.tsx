"use client";

import { adminText } from "@/lib/admin/vi";
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
      title: "Đơn mới",
      status: "PENDING",
      description: "Yêu cầu mới, sẵn sàng kiểm tra.",
    },
    {
      title: "Cần xét duyệt",
      status: "CONFIRMED",
      description: "Đã xác nhận thanh toán. Hãy kiểm tra thông tin.",
    },
    {
      title: "Chờ phân công",
      status: "WAITING_ASSIGNMENT",
      description: "Đã duyệt và sẵn sàng phân công nhân viên phù hợp.",
    },
  ];
  return (
    <>
      <PageHeader
        eyebrow="HỘP THƯ ĐƠN HÀNG"
        title="Đơn mới"
        description="Hàng chờ rõ ràng. Trải nghiệm khởi đầu tốt."
      >
        <span className="ap-date">
          <Inbox size={16} />
          {
            orders.filter((o) => incomingStatuses.includes(o.status)).length
          }{" "}
          đang chờ{" "}
        </span>
        <Link className="ap-button" href="/admin/orders">
          Tất cả đơn hàng <ArrowRight size={16} />
        </Link>
      </PageHeader>
      <div className="op-info-banner">
        <Clock3 size={18} />
        <span>
          Trải nghiệm tốt bắt đầu từ đây.{" "}
          <small>Duyệt đơn mới và gửi đề nghị tới nhân viên sẵn sàng. </small>
        </span>
        <span className="ap-demo-tag">HÀNG CHỜ DÙNG THỬ</span>
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
                      Khu vực ưu tiên<strong>{adminText(o.region)}</strong>
                    </span>
                    <span>
                      LP hiện tại<strong>{o.currentLP} LP</strong>
                    </span>
                    <span>
                      Giá<strong>{money(o.amount)}</strong>
                    </span>
                  </div>
                  <div className="op-option-tags">
                    {o.options.map((option) => (
                      <span key={option}>{adminText(option)}</span>
                    ))}
                  </div>
                  <p className="op-received">
                    <Clock3 size={13} />
                    Đã nhận{" "}
                    {Math.max(
                      1,
                      Math.round(
                        (Date.now() - Date.parse(o.createdAt)) / 60000,
                      ),
                    )}{" "}
                    phút trước{" "}
                  </p>
                  <OrderActions order={o} />
                  <Link className="ap-text-link" href={`/admin/orders/${o.id}`}>
                    Xem chi tiết →{" "}
                  </Link>
                </OrderCard>
              ))}
              {!queue.length && (
                <div className="ap-panel">
                  <EmptyState
                    title="Bạn đã xử lý hết."
                    text="Hiện không có đơn mới chờ duyệt."
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
      title: "Chưa phân công",
      statuses: ["PENDING", "CONFIRMED", "WAITING_ASSIGNMENT"],
    },
    { title: "Đề nghị đang chờ", statuses: ["OFFERED"] },
    { title: "Đã nhận việc", statuses: ["ACCEPTED"] },
    {
      title: "Đang thực hiện",
      statuses: ["IN_PROGRESS", "PAUSED", "DISPUTED"],
    },
  ];
  return (
    <>
      <PageHeader
        eyebrow="NHÂN SỰ × TIẾN ĐỘ"
        title="Phân công"
        description="Đúng nhân viên, đúng đơn hàng. Theo dõi rõ ràng."
      >
        <Link className="ap-button" href="/employee/orders/available">
          Xem thử nhân viên <ArrowRight size={16} />
        </Link>
      </PageHeader>
      <div className="op-info-banner">
        <span className="op-step">1</span> Gửi đề nghị <ArrowRight size={16} />
        <span className="op-step">2</span> Nhân viên nhận việc{" "}
        <ArrowRight size={16} />
        <span className="op-step">3</span> Bắt đầu thực hiện{" "}
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
                        {employee.name} · {adminText(employee.type)}
                      </p>
                    )}
                    {offer ? (
                      <div className="op-offer-state">
                        <strong>Đang chờ nhân viên phản hồi…</strong>
                        <OfferCountdown expiresAt={offer.expiresAt} />
                        <Link
                          href={`/employee/orders/${o.id}?employee=${offer.employeeId}`}
                        >
                          Xem thử nhận / từ chối →{" "}
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
                  title="Hiện chưa có đơn"
                  text="Đơn sẽ xuất hiện tại đây khi chuyển trạng thái."
                />
              )}
            </section>
          );
        })}
      </div>
      <section className="ap-panel op-history-panel">
        <div className="ap-panel-heading">
          <h2>Lịch sử phân công gần đây</h2>
          <span className="op-muted">Đề nghị được lưu trong lịch sử</span>
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
                <span>{a.reason ?? "Đã ghi nhận phản hồi nhân viên"}</span>
                <small>{dateTime(a.respondedAt ?? a.offeredAt)}</small>
              </div>
            ))}
        </div>
      </section>
    </>
  );
}
