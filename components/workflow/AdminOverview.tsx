"use client";
import Link from "next/link";
import { useWorkflow } from "@/lib/workflow/store";
import { dashboardService, workload } from "@/services/workflow-adapter";
import { PageHeader, DataTable } from "@/components/admin/portal/Ui";
import { Panel, Stats, Badge, Timeline, useAllowed, date } from "./Shared";
import { AdminOrderTable } from "./AdminOrders";
export function AdminOverview() {
  const s = useWorkflow();
  const orderView = useAllowed("order.view");
  const employeeView = useAllowed("employee.view");
  const complaintView = useAllowed("complaint.view");
  const stats = dashboardService.getStats();
  return (
    <>
      <PageHeader
        eyebrow="ASCEND · VẬN HÀNH"
        title="Tổng quan"
        description="Một góc nhìn rõ ràng về đơn hàng, đội ngũ và chất lượng dịch vụ."
      />
      <Stats
        items={[
          ...(orderView
            ? ([
                ["Tổng đơn", stats.total],
                ["Chờ nhân viên", stats.open],
                ["Đang thực hiện", stats.active],
                ["Chờ xác nhận", stats.review],
              ] as [string, number][])
            : []),
          ...(complaintView
            ? ([["Khiếu nại đang mở", stats.complaints]] as [string, number][])
            : []),
          ...(employeeView
            ? ([
                ["Nhân viên online", stats.online],
                ["Nhân viên đang có đơn", stats.working],
              ] as [string, number][])
            : []),
        ]}
      />
      {orderView && (
        <>
          <Panel
            title="Đơn gần đây"
            action={<Link href="/admin/orders">Xem tất cả ↗</Link>}
          >
            <AdminOrderTable
              orders={[...s.orders]
                .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
                .slice(0, 5)}
            />
          </Panel>
          <Panel
            title="Đơn chờ nhân viên"
            action={<Link href="/admin/incoming-orders">Mở danh sách ↗</Link>}
          >
            <AdminOrderTable
              orders={s.orders.filter((o) => o.status === "OPEN").slice(0, 4)}
            />
          </Panel>
          <Panel title="Vấn đề cần hỗ trợ">
            {s.issues.length ? (
              s.issues.map((i) => (
                <Link
                  className="wf-row"
                  href={`/admin/orders/${i.orderId}`}
                  key={i.id}
                >
                  <span>
                    <strong>
                      #{i.orderId} · {i.reason}
                    </strong>
                    <p>{i.description}</p>
                    <small>{date(i.at)}</small>
                  </span>
                  <Badge status={i.status} />
                </Link>
              ))
            ) : (
              <p>Chưa có vấn đề mới từ nhân viên.</p>
            )}
          </Panel>
        </>
      )}
      <div className="wf-two">
        {employeeView && (
          <Panel title="Nhân viên đang hoạt động">
            <DataTable
              label="Nhân viên hoạt động"
              rows={s.employees.filter((e) => e.online)}
              columns={[
                {
                  label: "Nhân viên",
                  render: (e) => (
                    <Link href={`/admin/employees/${e.id}`}>{e.name} ↗</Link>
                  ),
                },
                {
                  label: "Đơn hoạt động",
                  render: (e) => `${workload(e.id)} / ${e.maxActiveOrders}`,
                },
                { label: "Hoạt động", render: (e) => date(e.lastActivity) },
              ]}
            />
          </Panel>
        )}
        {complaintView && (
          <Panel
            title="Khiếu nại đang mở"
            action={<Link href="/admin/complaints">Xem tất cả ↗</Link>}
          >
            {s.complaints
              .filter((c) => ["OPEN", "UNDER_REVIEW"].includes(c.status))
              .map((c) => (
                <Link
                  className="wf-row"
                  key={c.id}
                  href={`/admin/complaints/${c.id}`}
                >
                  <span>
                    <strong>{c.id}</strong>
                    <small>#{c.orderId}</small>
                  </span>
                  <Badge status={c.status} complaint />
                </Link>
              ))}
          </Panel>
        )}
      </div>
      {orderView && (
        <Panel title="Hoạt động gần đây">
          <Timeline />
        </Panel>
      )}
    </>
  );
}
