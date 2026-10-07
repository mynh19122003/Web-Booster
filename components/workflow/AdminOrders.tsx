"use client";
import { useState } from "react";
import Link from "next/link";
import { useWorkflow } from "@/lib/workflow/store";
import {
  adminOrderService,
  assignmentService,
  workload,
} from "@/services/workflow-adapter";
import { orderStatuses, type Order } from "@/types/workflow";
import {
  PageHeader,
  FormModal,
  Field,
  EmptyState,
  AccessDenied,
  DataTable,
} from "@/components/admin/portal/Ui";
import { useNotice } from "@/components/admin/portal/AdminShell";
import {
  Badge,
  Facts,
  Panel,
  Progress,
  Timeline,
  useAllowed,
  usd,
  date,
} from "./Shared";
import { WorkflowChat } from "./WorkflowChat";
type Action =
  | "pause"
  | "resume"
  | "cancel"
  | "complete"
  | "payment"
  | "refund"
  | "assign"
  | "remove";
const actionLabels: Record<Action, string> = {
  pause: "Tạm dừng",
  resume: "Tiếp tục",
  cancel: "Hủy đơn",
  complete: "Hoàn thành",
  payment: "Xác nhận thanh toán",
  refund: "Hoàn tiền",
  assign: "Phân công / Phân công lại",
  remove: "Gỡ phân công",
};
export function AdminOrderActions({ order }: { order: Order }) {
  const edit = useAllowed("order.update");
  const assign = useAllowed("order.assign");
  const cancel = useAllowed("order.cancel");
  const finance = useAllowed("finance.manage");
  const s = useWorkflow();
  const notify = useNotice();
  const [action, setAction] = useState<Action | null>(null);
  const actions: Action[] = [];
  if (edit && order.status === "IN_PROGRESS") actions.push("pause");
  if (edit && order.status === "PAUSED" && order.employeeId)
    actions.push("resume");
  if (edit && ["IN_PROGRESS", "PENDING_REVIEW"].includes(order.status))
    actions.push("complete");
  if (edit && order.status === "PENDING_PAYMENT") actions.push("payment");
  if (
    assign &&
    ["OPEN", "CLAIMED", "IN_PROGRESS", "PAUSED", "DISPUTED"].includes(
      order.status,
    )
  ) {
    actions.push("assign");
    if (order.employeeId) actions.push("remove");
  }
  if (cancel && !["COMPLETED", "CANCELLED", "REFUNDED"].includes(order.status))
    actions.push("cancel");
  if (
    finance &&
    order.status !== "PENDING_PAYMENT" &&
    order.refundedAmount < order.amount
  )
    actions.push("refund");
  return (
    <>
      <div className="wf-actions">
        {actions.map((a) => (
          <button
            className={`ap-button ${a === "cancel" ? "danger" : ""}`}
            key={a}
            onClick={() => setAction(a)}
          >
            {actionLabels[a]}
          </button>
        ))}
      </div>
      {action && (
        <FormModal
          title={`${actionLabels[action]} #${order.id}`}
          description={
            action === "refund"
              ? `Có thể hoàn một phần hoặc toàn bộ. Số dư có thể hoàn: ${usd(order.amount - order.refundedAmount)}.`
              : "Xác nhận thao tác vận hành. Mọi thay đổi được ghi vào lịch sử."
          }
          submit="Xác nhận"
          danger={["cancel", "refund", "remove"].includes(action)}
          onClose={() => setAction(null)}
          onSubmit={async (data) => {
            if (action === "assign")
              await assignmentService.assign(
                order.id,
                String(data.get("employee")),
              );
            else if (action === "remove")
              await assignmentService.remove(order.id);
            else
              await adminOrderService.action(
                order.id,
                action,
                String(data.get("reason")),
                Number(data.get("amount")),
              );
            notify("Đã cập nhật đơn hàng.");
          }}
        >
          {action === "assign" && (
            <Field label="Nhân viên phụ trách">
              <select name="employee" required defaultValue="">
                <option value="" disabled>
                  Chọn nhân viên đủ điều kiện
                </option>
                {s.employees
                  .filter(
                    (e) =>
                      e.status === "ACTIVE" &&
                      e.id !== order.employeeId &&
                      e.games.includes(order.game) &&
                      e.type ===
                        (order.service === "Coaching" ? "COACH" : "BOOSTER") &&
                      workload(e.id) < e.maxActiveOrders,
                  )
                  .map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name} · {workload(e.id)} / {e.maxActiveOrders} đơn
                    </option>
                  ))}
              </select>
            </Field>
          )}
          {action === "refund" && (
            <Field label="Số tiền hoàn (USD)">
              <input
                name="amount"
                type="number"
                required
                min={0.01}
                max={order.amount - order.refundedAmount}
                step="0.01"
                defaultValue={order.amount - order.refundedAmount}
              />
            </Field>
          )}
          {!["assign", "remove"].includes(action) && (
            <Field label="Lý do">
              <textarea
                name="reason"
                required
                minLength={5}
                maxLength={2000}
                rows={3}
              />
            </Field>
          )}
        </FormModal>
      )}
    </>
  );
}
export function AdminOrderTable({ orders }: { orders: Order[] }) {
  const s = useWorkflow();
  return (
    <DataTable
      label="Đơn hàng"
      rows={orders}
      columns={[
        {
          label: "Mã đơn",
          render: (o) => (
            <Link className="op-order-id" href={`/admin/orders/${o.id}`}>
              #{o.id}
            </Link>
          ),
        },
        { label: "Khách hàng", render: (o) => o.customer.name },
        {
          label: "Trò chơi / Dịch vụ",
          render: (o) => (
            <>
              {o.game}
              <small className="op-block">
                {o.service === "Coaching"
                  ? "Huấn luyện"
                  : o.service === "Placement Matches"
                    ? "Trận phân hạng"
                    : "Nâng hạng"}
              </small>
            </>
          ),
        },
        { label: "Trạng thái", render: (o) => <Badge status={o.status} /> },
        {
          label: "Nhân viên",
          render: (o) =>
            s.employees.find((e) => e.id === o.employeeId)?.name ||
            "Chưa phân công",
        },
        { label: "Tiến độ", render: (o) => <Progress value={o.progress} /> },
        { label: "Ngày tạo", render: (o) => date(o.createdAt) },
        { label: "Cập nhật", render: (o) => date(o.updatedAt) },
        {
          label: "Khiếu nại",
          render: (o) =>
            o.complaintStatus ? (
              <Badge status={o.complaintStatus} complaint />
            ) : (
              "—"
            ),
        },
        {
          label: "Thao tác",
          render: (o) => (
            <Link className="ap-button small" href={`/admin/orders/${o.id}`}>
              Xem chi tiết
            </Link>
          ),
        },
      ]}
    />
  );
}
export function AdminOrders({
  incoming = false,
  assignments = false,
}: {
  incoming?: boolean;
  assignments?: boolean;
}) {
  const allowed = useAllowed("order.view");
  const s = useWorkflow();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("ALL");
  const [game, setGame] = useState("ALL");
  const [employee, setEmployee] = useState("ALL");
  const [page, setPage] = useState(1);
  if (!allowed) return <AccessDenied />;
  const filtered = s.orders.filter(
    (o) =>
      (!incoming || o.status === "OPEN") &&
      (!assignments || !!o.employeeId) &&
      `${o.id} ${o.customer.name} ${s.employees.find((e) => e.id === o.employeeId)?.name || ""}`
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (status === "ALL" || status === o.status) &&
      (game === "ALL" || game === o.game) &&
      (employee === "ALL" || employee === o.employeeId),
  );
  const pages = Math.max(1, Math.ceil(filtered.length / 8));
  const current = Math.min(page, pages);
  return (
    <>
      <PageHeader
        eyebrow="VẬN HÀNH"
        title={
          incoming
            ? "Đơn chờ nhân viên"
            : assignments
              ? "Phân công"
              : "Đơn hàng"
        }
        description={
          incoming
            ? "Đơn đã thanh toán, mở cho nhân viên đủ điều kiện nhận trước."
            : assignments
              ? "Theo dõi phân công tự nhận và điều phối của quản trị viên."
              : "Toàn bộ vòng đời đơn hàng, tiến độ và khiếu nại."
        }
      />
      <Panel title={`${filtered.length} đơn hàng`}>
        <div className="wf-filters">
          <label className="ap-search">
            <input
              aria-label="Tìm đơn hàng"
              placeholder="Mã đơn, khách hàng, nhân viên…"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
            />
          </label>
          {!incoming && (
            <select
              aria-label="Trạng thái đơn"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
            >
              <option value="ALL">Tất cả trạng thái</option>
              {orderStatuses.map((s) => (
                <option key={s} value={s}>
                  {/* Vietnamese values rendered through badge map below */}
                  {statusLabel(s)}
                </option>
              ))}
            </select>
          )}
          <select
            aria-label="Trò chơi"
            value={game}
            onChange={(e) => {
              setGame(e.target.value);
              setPage(1);
            }}
          >
            <option value="ALL">Tất cả trò chơi</option>
            {[...new Set(s.orders.map((o) => o.game))].map((g) => (
              <option key={g}>{g}</option>
            ))}
          </select>
          <select
            aria-label="Nhân viên"
            value={employee}
            onChange={(e) => {
              setEmployee(e.target.value);
              setPage(1);
            }}
          >
            <option value="ALL">Tất cả nhân viên</option>
            {s.employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
        </div>
        <AdminOrderTable
          orders={filtered.slice((current - 1) * 8, current * 8)}
        />
        <div className="wf-pagination">
          <button
            className="ap-button small"
            disabled={current <= 1}
            onClick={() => setPage(current - 1)}
          >
            Trước
          </button>
          <span>
            {current} / {pages}
          </span>
          <button
            className="ap-button small"
            disabled={current >= pages}
            onClick={() => setPage(current + 1)}
          >
            Sau
          </button>
        </div>
      </Panel>
      {assignments && (
        <Panel title="Lịch sử phân công">
          <DataTable
            label="Phân công"
            rows={s.assignments}
            columns={[
              {
                label: "Đơn",
                render: (a) => (
                  <Link href={`/admin/orders/${a.orderId}`}>#{a.orderId}</Link>
                ),
              },
              {
                label: "Nhân viên",
                render: (a) =>
                  s.employees.find((e) => e.id === a.employeeId)?.name,
              },
              {
                label: "Trạng thái",
                render: (a) => <Badge status={a.status} />,
              },
              { label: "Nhận lúc", render: (a) => date(a.claimedAt) },
              { label: "Kết thúc", render: (a) => date(a.endedAt) },
              { label: "Người thực hiện", render: (a) => a.actor },
            ]}
          />
        </Panel>
      )}
    </>
  );
}
import { statusLabels } from "@/types/workflow";
const statusLabel = (status: keyof typeof statusLabels) => statusLabels[status];
export function AdminOrderDetail({ id }: { id: string }) {
  const allowed = useAllowed("order.view");
  const chat = useAllowed("chat.view");
  const employeeView = useAllowed("employee.view");
  const complaintView = useAllowed("complaint.view");
  const s = useWorkflow();
  const o = s.orders.find((o) => o.id === id);
  const [customerOpen, setCustomerOpen] = useState(false);
  const employee = s.employees.find((e) => e.id === o?.employeeId);
  if (!allowed) return <AccessDenied />;
  if (!o) return <EmptyState title="Không tìm thấy đơn hàng" />;
  const c = s.conversations.find((c) => c.orderId === id);
  return (
    <>
      <PageHeader
        eyebrow="VẬN HÀNH ĐƠN HÀNG"
        title={`#${id}`}
        description={`${o.game} · ${o.currentRank} → ${o.targetRank}`}
      >
        <Badge status={o.status} />
      </PageHeader>
      <AdminOrderActions order={o} />
      <div className="wf-actions">
        <button className="ap-button" onClick={() => setCustomerOpen(true)}>
          Xem khách hàng
        </button>
        {chat && c && (
          <Link className="ap-button" href={`/admin/chat?conversation=${c.id}`}>
            Mở cuộc trò chuyện ↗
          </Link>
        )}
      </div>
      <div className="wf-two">
        <Panel title="Thông tin đơn">
          <Facts
            items={[
              ["Khách hàng", o.customer.name],
              ["Email", o.customer.email],
              [
                "Nhân viên",
                employee ? (
                  employeeView ? (
                    <Link href={`/admin/employees/${employee.id}`}>
                      {employee.name} ↗
                    </Link>
                  ) : (
                    employee.name
                  )
                ) : (
                  "Chưa phân công"
                ),
              ],
              [
                "Dịch vụ",
                o.service === "Coaching" ? "Huấn luyện" : "Nâng hạng",
              ],
              ["Khu vực", o.region],
              ["Riot ID", o.riotId],
              ["Hướng dẫn", o.instructions],
              [
                "Thanh toán",
                o.status === "PENDING_PAYMENT"
                  ? "Chờ thanh toán"
                  : "Đã thanh toán",
              ],
              ["Giá trị", usd(o.amount)],
              ["Đã hoàn", usd(o.refundedAmount)],
              ["Ngày tạo", date(o.createdAt)],
              ["Cập nhật", date(o.updatedAt)],
            ]}
          />
          <Progress value={o.progress} />
        </Panel>
        <Panel title="Timeline & hoạt động">
          <Timeline orderId={id} />
        </Panel>
      </div>
      <Panel title="Lịch sử phân công">
        <DataTable
          label="Lịch sử phân công"
          rows={s.assignments.filter((a) => a.orderId === id)}
          columns={[
            {
              label: "Nhân viên",
              render: (a) =>
                s.employees.find((e) => e.id === a.employeeId)?.name,
            },
            { label: "Trạng thái", render: (a) => <Badge status={a.status} /> },
            { label: "Nhận đơn", render: (a) => date(a.claimedAt) },
            { label: "Bắt đầu", render: (a) => date(a.startedAt) },
            { label: "Kết thúc", render: (a) => date(a.endedAt) },
            { label: "Người thực hiện", render: (a) => a.actor },
          ]}
        />
      </Panel>
      {s.issues.some((i) => i.orderId === id) && (
        <Panel title="Vấn đề nhân viên báo">
          {s.issues
            .filter((i) => i.orderId === id)
            .map((i) => (
              <div className="wf-row" key={i.id}>
                <span>
                  <strong>{i.reason}</strong>
                  <p>{i.description}</p>
                  <small>{date(i.at)}</small>
                </span>
              </div>
            ))}
        </Panel>
      )}
      {employee && employeeView && (
        <Panel title="Bảo mật nhân viên">
          <Facts
            items={[
              ["IP hiện tại", employee.currentIp],
              ["Thiết bị", employee.device],
              ["Hoạt động cuối", date(employee.lastActivity)],
              [
                "Phiên hoạt động",
                String(
                  s.sessions.filter(
                    (x) =>
                      x.employeeId === employee.id && x.status === "ACTIVE",
                  ).length,
                ),
              ],
            ]}
          />
        </Panel>
      )}
      {complaintView && (
        <Panel title="Khiếu nại">
          {s.complaints
            .filter((x) => x.orderId === id)
            .map((x) => (
              <Link
                className="wf-row"
                key={x.id}
                href={`/admin/complaints/${x.id}`}
              >
                <strong>{x.id}</strong>
                <Badge status={x.status} complaint />
              </Link>
            ))}
          {!s.complaints.some((x) => x.orderId === id) && (
            <p>Đơn chưa có khiếu nại.</p>
          )}
        </Panel>
      )}
      {chat && c && (
        <Panel title="Cuộc trò chuyện">
          <WorkflowChat mode="admin" fixedConversation={c.id} />
        </Panel>
      )}
      {customerOpen && (
        <FormModal
          title={o.customer.name}
          description="Thông tin khách hàng của đơn hàng"
          submit="Đóng"
          onClose={() => setCustomerOpen(false)}
          onSubmit={async () => {}}
        >
          <Facts
            items={[
              ["Tên hiển thị", o.customer.name],
              ["Email", o.customer.email],
              ["Quốc gia", o.customer.country],
              ["Múi giờ", o.customer.timezone],
            ]}
          />
        </FormModal>
      )}
    </>
  );
}
