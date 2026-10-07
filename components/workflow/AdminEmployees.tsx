"use client";
import { useState } from "react";
import Link from "next/link";
import { useWorkflow } from "@/lib/workflow/store";
import {
  employeeService,
  securityService,
  workload,
  isActive,
} from "@/services/workflow-adapter";
import {
  PageHeader,
  DataTable,
  FormModal,
  Field,
  EmptyState,
  AccessDenied,
} from "@/components/admin/portal/Ui";
import { useNotice } from "@/components/admin/portal/AdminShell";
import {
  Badge,
  Facts,
  Panel,
  Stats,
  Timeline,
  useAllowed,
  money,
  date,
} from "./Shared";
import { AdminOrderTable } from "./AdminOrders";
export function AdminEmployees() {
  const allowed = useAllowed("employee.view");
  const s = useWorkflow();
  const [query, setQuery] = useState("");
  if (!allowed) return <AccessDenied />;
  return (
    <>
      <PageHeader
        eyebrow="NHÂN SỰ"
        title="Nhân viên"
        description="Năng lực, công việc và hoạt động của đội ngũ thực hiện dịch vụ."
      />
      <Panel title="Đội ngũ nhân viên">
        <label className="ap-search wf-search">
          <input
            aria-label="Tìm nhân viên"
            placeholder="Tên, mã nhân viên…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <DataTable
          label="Nhân viên"
          rows={s.employees.filter((e) =>
            `${e.name} ${e.id}`.toLowerCase().includes(query.toLowerCase()),
          )}
          columns={[
            {
              label: "Nhân viên",
              render: (e) => (
                <Link className="op-order-id" href={`/admin/employees/${e.id}`}>
                  {e.name}
                  <small className="op-block">
                    {e.online ? "Đang trực tuyến" : "Ngoại tuyến"}
                  </small>
                </Link>
              ),
            },
            { label: "Trạng thái", render: (e) => <Badge status={e.status} /> },
            { label: "Đơn hoạt động", render: (e) => workload(e.id) },
            { label: "Giới hạn", render: (e) => e.maxActiveOrders },
            { label: "Tỷ lệ thành công", render: (e) => `${e.successRate}%` },
            { label: "Hoàn thành", render: (e) => e.completedOrders },
            {
              label: "Khiếu nại",
              render: (e) =>
                s.complaints.filter((c) => c.employeeId === e.id).length,
            },
            { label: "IP hiện tại", render: (e) => e.currentIp },
            { label: "Hoạt động cuối", render: (e) => date(e.lastActivity) },
            {
              label: "Thao tác",
              render: (e) => (
                <Link
                  className="ap-button small"
                  href={`/admin/employees/${e.id}`}
                >
                  Xem hồ sơ
                </Link>
              ),
            },
          ]}
        />
      </Panel>
    </>
  );
}
export function AdminEmployeeDetail({ id }: { id: string }) {
  const view = useAllowed("employee.view");
  const manage = useAllowed("employee.manage");
  const orderView = useAllowed("order.view");
  const chatView = useAllowed("chat.view");
  const complaintView = useAllowed("complaint.view");
  const finance = useAllowed("finance.manage");
  const s = useWorkflow();
  const e = s.employees.find((e) => e.id === id);
  const notify = useNotice();
  const [action, setAction] = useState<"limit" | "status" | "sessions" | null>(
    null,
  );
  if (!view) return <AccessDenied />;
  if (!e) return <EmptyState title="Không tìm thấy nhân viên" />;
  const own = s.orders.filter((o) => o.employeeId === id);
  return (
    <>
      <PageHeader
        eyebrow="HỒ SƠ NHÂN VIÊN"
        title={e.name}
        description={`${e.type === "COACH" ? "Huấn luyện viên" : "Chuyên viên nâng hạng"} · ${e.games.join(" · ")}`}
      >
        <Badge status={e.status} />
      </PageHeader>
      <Stats
        items={[
          ["Đơn hoạt động", `${workload(id)} / ${e.maxActiveOrders}`],
          ["Hoàn thành", e.completedOrders],
          ["Thành công", `${e.successRate}%`],
          ["Khiếu nại", s.complaints.filter((c) => c.employeeId === id).length],
        ]}
      />
      <div className="wf-two">
        <Panel title="Thông tin nhân viên">
          <Facts
            items={[
              ["Mã nhân viên", e.id],
              ["Riot ID", e.riotId],
              ["Hạng", e.rank],
              ["Chuyên môn", e.games.join(" · ")],
              ["Trạng thái", <Badge key="status" status={e.status} />],
            ]}
          />
          <div className="wf-actions">
            {manage && (
              <>
                <button
                  className="ap-button"
                  onClick={() => setAction("status")}
                >
                  {e.status === "ACTIVE"
                    ? "Đình chỉ tài khoản"
                    : "Kích hoạt tài khoản"}
                </button>
                <button
                  className="ap-button"
                  onClick={() => setAction("sessions")}
                >
                  Thu hồi toàn bộ phiên
                </button>
              </>
            )}
          </div>
        </Panel>
        <Panel title="Giới hạn đơn hoạt động">
          <strong className="wf-big">{e.maxActiveOrders} đơn</strong>
          <p>Mặc định 1 đơn. Quản trị viên có thể cấp tối đa 2 đơn.</p>
          {manage && (
            <button
              className="ap-button primary"
              onClick={() => setAction("limit")}
            >
              Cập nhật giới hạn
            </button>
          )}
        </Panel>
      </div>
      {orderView && (
        <>
          <Panel title="Đơn đang phụ trách">
            <AdminOrderTable orders={own.filter(isActive)} />
          </Panel>
          <Panel title="Lịch sử đơn">
            <AdminOrderTable
              orders={s.orders.filter(
                (o) =>
                  s.assignments.some(
                    (a) => a.orderId === o.id && a.employeeId === id,
                  ) &&
                  (!isActive(o) || o.employeeId !== id),
              )}
            />
          </Panel>
        </>
      )}
      {chatView && (
        <Panel title="Lịch sử trò chuyện">
          {s.conversations
            .filter((c) =>
              s.assignments.some(
                (a) => a.orderId === c.orderId && a.employeeId === id,
              ),
            )
            .map((c) => (
              <Link
                className="wf-row"
                key={c.id}
                href={`/admin/chat?conversation=${c.id}`}
              >
                <span>
                  <strong>{c.participant.name}</strong>
                  <small>#{c.orderId}</small>
                </span>
                <span>{date(c.updatedAt)} ↗</span>
              </Link>
            ))}
        </Panel>
      )}
      <Panel title="Bảo mật & IP">
        <Facts
          items={[
            ["IP hiện tại", e.currentIp],
            ["IP trước", e.lastIp],
            ["Thiết bị hiện tại", e.device],
            ["User-Agent", e.userAgent],
            ["Đăng nhập cuối", date(e.lastLogin)],
            ["Hoạt động cuối", date(e.lastActivity)],
            [
              "Phiên hoạt động",
              String(
                s.sessions.filter(
                  (x) => x.employeeId === id && x.status === "ACTIVE",
                ).length,
              ),
            ],
          ]}
        />
        <DataTable
          label="Phiên & lịch sử IP"
          rows={s.sessions.filter((x) => x.employeeId === id)}
          columns={[
            { label: "IP", render: (x) => x.ip },
            { label: "Thiết bị", render: (x) => x.device },
            { label: "Đăng nhập", render: (x) => date(x.loginAt) },
            { label: "Hoạt động cuối", render: (x) => date(x.lastActivityAt) },
            { label: "Trạng thái", render: (x) => <Badge status={x.status} /> },
          ]}
        />
      </Panel>
      {complaintView && (
        <Panel title="Khiếu nại liên quan">
          {s.complaints
            .filter((c) => c.employeeId === id)
            .map((c) => (
              <Link
                className="wf-row"
                key={c.id}
                href={`/admin/complaints/${c.id}`}
              >
                <strong>
                  {c.id} · #{c.orderId}
                </strong>
                <Badge status={c.status} complaint />
              </Link>
            ))}
        </Panel>
      )}
      {finance && (
        <Panel title="Lịch sử tài chính">
          <DataTable
            label="Giao dịch"
            rows={s.transactions.filter((t) => t.employeeId === id)}
            columns={[
              { label: "Ngày", render: (t) => date(t.at) },
              {
                label: "Loại",
                render: (t) =>
                  ({
                    EARNING: "Thu nhập",
                    BONUS: "Thưởng",
                    PENALTY: "Xử phạt",
                    ADJUSTMENT: "Điều chỉnh",
                  })[t.type],
              },
              { label: "Đơn", render: (t) => t.orderId || "—" },
              { label: "Khiếu nại", render: (t) => t.complaintId || "—" },
              {
                label: "Số tiền",
                render: (t) => (
                  <span className={t.amount < 0 ? "ap-error" : ""}>
                    {money(t.amount)}
                  </span>
                ),
              },
              { label: "Lý do", render: (t) => t.reason },
              { label: "Quản trị viên", render: (t) => t.admin },
            ]}
          />
        </Panel>
      )}
      <Panel title="Timeline hoạt động">
        <Timeline employeeId={id} />
      </Panel>
      {action && (
        <FormModal
          title={
            action === "limit"
              ? `Giới hạn đơn · ${e.name}`
              : action === "sessions"
                ? `Thu hồi phiên · ${e.name}`
                : `${e.status === "ACTIVE" ? "Đình chỉ" : "Kích hoạt"} ${e.name}`
          }
          description={
            action === "limit"
              ? "Giới hạn bao gồm đơn đang thực hiện, tạm dừng, khiếu nại và chờ xác nhận."
              : "Xác nhận thay đổi tài khoản. Hoạt động sẽ được ghi vào lịch sử."
          }
          submit="Xác nhận"
          danger={action !== "limit"}
          onClose={() => setAction(null)}
          onSubmit={async (data) => {
            if (action === "limit")
              await employeeService.setLimit(
                id,
                Number(data.get("limit")) as 1 | 2,
              );
            else if (action === "sessions") await securityService.revoke(id);
            else
              await employeeService.setStatus(
                id,
                e.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE",
              );
            notify("Đã cập nhật nhân viên.");
          }}
        >
          {action === "limit" && (
            <Field label="Giới hạn đơn hoạt động">
              <select name="limit" defaultValue={e.maxActiveOrders}>
                <option value={1}>1 đơn</option>
                <option value={2}>2 đơn</option>
              </select>
            </Field>
          )}
        </FormModal>
      )}
    </>
  );
}
