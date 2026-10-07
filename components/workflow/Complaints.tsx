"use client";
import { useState } from "react";
import Link from "next/link";
import { useWorkflow } from "@/lib/workflow/store";
import { complaintService, employeeService } from "@/services/workflow-adapter";
import {
  complaintReasons,
  complaintLabels,
  type ComplaintReason,
  type ComplaintStatus,
} from "@/types/workflow";
import {
  PageHeader,
  DataTable,
  FormModal,
  Field,
  AccessDenied,
  EmptyState,
} from "@/components/admin/portal/Ui";
import { useNotice } from "@/components/admin/portal/AdminShell";
import {
  Badge,
  Facts,
  Panel,
  Progress,
  Timeline,
  useAllowed,
  money,
  usd,
  date,
} from "./Shared";
import { AdminOrderActions } from "./AdminOrders";
import { WorkflowChat } from "./WorkflowChat";
/** Reusable customer form. Hosting customer order detail can pass its own adapter. */
export function CustomerComplaintForm({
  orderId,
  onClose,
  onSubmit = complaintService.create,
}: {
  orderId: string;
  onClose: () => void;
  onSubmit?: typeof complaintService.create;
}) {
  return (
    <FormModal
      title={`Gửi khiếu nại #${orderId}`}
      description="Mô tả sự việc để đội ngũ kiểm tra và hỗ trợ."
      submit="Gửi khiếu nại"
      onClose={onClose}
      onSubmit={async (data) => {
        await onSubmit(
          orderId,
          String(data.get("reason")) as ComplaintReason,
          String(data.get("description")),
          String(data.get("evidence")).split("\n").filter(Boolean),
        );
      }}
    >
      <Field label="Mã đơn">
        <input readOnly value={orderId} />
      </Field>
      <Field label="Lý do">
        <select name="reason">
          {Object.entries(complaintReasons).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Mô tả">
        <textarea
          required
          minLength={10}
          maxLength={2000}
          rows={4}
          name="description"
        />
      </Field>
      <Field
        label="Bằng chứng"
        hint="Mô tả bằng chứng hoặc đường dẫn, mỗi dòng một mục."
      >
        <textarea name="evidence" rows={3} maxLength={2000} />
      </Field>
    </FormModal>
  );
}
export function ComplaintList() {
  const allowed = useAllowed("complaint.view");
  const s = useWorkflow();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("ALL");
  const [reason, setReason] = useState("ALL");
  const [employee, setEmployee] = useState("ALL");
  const [game, setGame] = useState("ALL");
  const [priority, setPriority] = useState("ALL");
  const [from, setFrom] = useState("");
  if (!allowed) return <AccessDenied />;
  const rows = s.complaints.filter((c) => {
    const o = s.orders.find((o) => o.id === c.orderId)!;
    const e = s.employees.find((e) => e.id === c.employeeId);
    return (
      `${c.id} ${o.id} ${o.customer.name} ${e?.name || ""}`
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (status === "ALL" || c.status === status) &&
      (reason === "ALL" || c.reason === reason) &&
      (employee === "ALL" || c.employeeId === employee) &&
      (game === "ALL" || o.game === game) &&
      (priority === "ALL" || c.priority === priority) &&
      (!from || c.createdAt.slice(0, 10) >= from)
    );
  });
  return (
    <>
      <PageHeader
        eyebrow="VẬN HÀNH"
        title="Khiếu nại"
        description="Kiểm tra bằng chứng, bảo vệ chất lượng và xử lý công bằng."
      />
      <Panel title={`${rows.length} khiếu nại`}>
        <div className="wf-filters">
          <label className="ap-search">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Tìm khiếu nại"
              placeholder="Khiếu nại, đơn, khách hàng, nhân viên…"
            />
          </label>
          <select
            aria-label="Trạng thái khiếu nại"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="ALL">Tất cả trạng thái</option>
            {Object.entries(complaintLabels).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          <select
            aria-label="Lý do khiếu nại"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          >
            <option value="ALL">Tất cả lý do</option>
            {Object.entries(complaintReasons).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          <select
            aria-label="Nhân viên"
            value={employee}
            onChange={(e) => setEmployee(e.target.value)}
          >
            <option value="ALL">Tất cả nhân viên</option>
            {s.employees.map((e) => (
              <option value={e.id} key={e.id}>
                {e.name}
              </option>
            ))}
          </select>
          <select
            aria-label="Trò chơi"
            value={game}
            onChange={(e) => setGame(e.target.value)}
          >
            <option value="ALL">Tất cả trò chơi</option>
            {[...new Set(s.orders.map((o) => o.game))].map((g) => (
              <option key={g}>{g}</option>
            ))}
          </select>
          <select
            aria-label="Ưu tiên"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          >
            <option value="ALL">Tất cả ưu tiên</option>
            <option value="HIGH">Cao</option>
            <option value="NORMAL">Thông thường</option>
          </select>
          <Field label="Từ ngày">
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </Field>
        </div>
        <DataTable
          label="Khiếu nại"
          rows={rows}
          columns={[
            {
              label: "Mã khiếu nại",
              render: (c) => (
                <Link
                  className="op-order-id"
                  href={`/admin/complaints/${c.id}`}
                >
                  {c.id}
                </Link>
              ),
            },
            { label: "Đơn", render: (c) => c.orderId },
            {
              label: "Khách hàng",
              render: (c) =>
                s.orders.find((o) => o.id === c.orderId)?.customer.name,
            },
            {
              label: "Nhân viên",
              render: (c) =>
                s.employees.find((e) => e.id === c.employeeId)?.name || "—",
            },
            { label: "Lý do", render: (c) => complaintReasons[c.reason] },
            {
              label: "Trạng thái",
              render: (c) => <Badge status={c.status} complaint />,
            },
            { label: "Ngày tạo", render: (c) => date(c.createdAt) },
            { label: "Ưu tiên", render: (c) => <Badge status={c.priority} /> },
            {
              label: "Thao tác",
              render: (c) => (
                <Link
                  className="ap-button small"
                  href={`/admin/complaints/${c.id}`}
                >
                  Xem chi tiết
                </Link>
              ),
            },
          ]}
        />
      </Panel>
    </>
  );
}
type Resolution = ComplaintStatus | "WARNING" | "NO_PENALTY" | "SUSPEND";
export function ComplaintDetail({ id }: { id: string }) {
  const view = useAllowed("complaint.view");
  const manage = useAllowed("complaint.manage");
  const finance = useAllowed("finance.manage");
  const employeeManage = useAllowed("employee.manage");
  const employeeView = useAllowed("employee.view");
  const orderView = useAllowed("order.view");
  const chat = useAllowed("chat.view");
  const s = useWorkflow();
  const notify = useNotice();
  const [resolution, setResolution] = useState<Resolution | null>(null);
  const [penalty, setPenalty] = useState(false);
  const [penaltyDraft, setPenaltyDraft] = useState<{
    amount: number;
    reason: string;
    note: string;
  } | null>(null);
  if (!view) return <AccessDenied />;
  const c = s.complaints.find((c) => c.id === id);
  const o = s.orders.find((o) => o.id === c?.orderId);
  const e = s.employees.find((e) => e.id === c?.employeeId);
  if (!c || !o) return <EmptyState title="Không tìm thấy khiếu nại" />;
  const closed = ["RESOLVED", "REJECTED"].includes(c.status);
  const conversation = s.conversations.find((x) => x.orderId === o.id);
  const labels: Record<Resolution, string> = {
    OPEN: "Mở lại",
    UNDER_REVIEW: "Bắt đầu xử lý",
    RESOLVED: "Giải quyết khiếu nại",
    REJECTED: "Từ chối khiếu nại",
    WARNING: "Cảnh cáo nhân viên",
    NO_PENALTY: "Không xử phạt",
    SUSPEND: "Đình chỉ nhân viên",
  };
  return (
    <>
      <PageHeader
        eyebrow="CHI TIẾT KHIẾU NẠI"
        title={c.id}
        description={`#${o.id} · ${complaintReasons[c.reason]}`}
      >
        <Badge status={c.status} complaint />
      </PageHeader>
      {manage && !closed && (
        <div className="wf-actions">
          {(
            [
              "UNDER_REVIEW",
              "NO_PENALTY",
              "WARNING",
              "RESOLVED",
              "REJECTED",
            ] as Resolution[]
          ).map((r) => (
            <button
              className="ap-button"
              key={r}
              onClick={() => setResolution(r)}
            >
              {labels[r]}
            </button>
          ))}
          {finance && e && (
            <button
              className="ap-button danger"
              onClick={() => setPenalty(true)}
            >
              Trừ tiền nhân viên
            </button>
          )}
          {employeeManage && e && (
            <button
              className="ap-button danger"
              onClick={() => setResolution("SUSPEND")}
            >
              Đình chỉ nhân viên
            </button>
          )}
        </div>
      )}
      <div className="wf-two">
        <Panel title="Nội dung & bằng chứng">
          <Facts
            items={[
              ["Khách hàng", o.customer.name],
              ["Nhân viên", e?.name || "—"],
              ["Lý do", complaintReasons[c.reason]],
              ["Ưu tiên", <Badge key="priority" status={c.priority} />],
              ["Ngày tạo", date(c.createdAt)],
              ["Ngày giải quyết", date(c.resolvedAt)],
            ]}
          />
          <p>{c.description}</p>
          <h3>Bằng chứng</h3>
          {c.evidence.map((x, i) => (
            <p className="wf-evidence" key={i}>
              {x}
            </p>
          ))}
          <Progress value={o.progress} />
        </Panel>
        <Panel title="Quyết định & ghi chú nội bộ">
          <p className="wf-banner">Chỉ Admin/Staff có thể xem ghi chú này.</p>
          <p>{c.adminNote}</p>
          {c.actions.map((a, i) => (
            <p className="wf-evidence" key={i}>
              {a}
            </p>
          ))}
        </Panel>
      </div>
      {orderView && (
        <Panel title="Đơn hàng & thao tác vận hành">
          <Link className="ap-button" href={`/admin/orders/${o.id}`}>
            Mở #{o.id} ↗
          </Link>
          <Facts
            items={[
              ["Giá trị đơn", usd(o.amount)],
              ["Đã hoàn tiền", usd(o.refundedAmount)],
              ["Trạng thái", <Badge key="status" status={o.status} />],
            ]}
          />
          <AdminOrderActions order={o} />
          <Timeline orderId={o.id} />
        </Panel>
      )}
      {employeeView && e && (
        <Panel title="Hoạt động, IP & phiên nhân viên">
          <Facts
            items={[
              [
                "Nhân viên",
                <Link key="employee" href={`/admin/employees/${e.id}`}>
                  {e.name} ↗
                </Link>,
              ],
              ["IP hiện tại", e.currentIp],
              ["Thiết bị", e.device],
              ["Hoạt động cuối", date(e.lastActivity)],
            ]}
          />
          <DataTable
            label="Phiên liên quan"
            rows={s.sessions.filter((x) => x.employeeId === e.id)}
            columns={[
              { label: "IP", render: (x) => x.ip },
              { label: "Thiết bị", render: (x) => x.device },
              { label: "Đăng nhập", render: (x) => date(x.loginAt) },
              { label: "Hoạt động", render: (x) => date(x.lastActivityAt) },
              {
                label: "Trạng thái",
                render: (x) => <Badge status={x.status} />,
              },
            ]}
          />
          <Timeline employeeId={e.id} />
        </Panel>
      )}
      {chat && conversation && (
        <Panel title="Toàn bộ cuộc trò chuyện">
          <WorkflowChat mode="admin" fixedConversation={conversation.id} />
        </Panel>
      )}
      {resolution && (
        <FormModal
          title={labels[resolution]}
          description={`Khiếu nại ${id} · #${o.id}. Ghi rõ quyết định và lý do.`}
          submit="Xác nhận quyết định"
          danger={resolution === "SUSPEND" || resolution === "REJECTED"}
          onClose={() => setResolution(null)}
          onSubmit={async (data) => {
            const note = String(data.get("note"));
            if (resolution === "SUSPEND" && e)
              await employeeService.setStatus(e.id, "SUSPENDED");
            await complaintService.update(
              id,
              ["WARNING", "NO_PENALTY", "SUSPEND"].includes(resolution)
                ? "UNDER_REVIEW"
                : (resolution as ComplaintStatus),
              `${labels[resolution]}: ${note}`,
            );
            notify("Đã lưu quyết định xử lý.");
          }}
        >
          <Field label="Quyết định / Lý do">
            <textarea
              name="note"
              required
              minLength={5}
              maxLength={2000}
              rows={4}
            />
          </Field>
        </FormModal>
      )}
      {penalty && e && (
        <FormModal
          title="Trừ tiền nhân viên"
          description={`${e.name} · #${o.id} · ${id}`}
          submit="Kiểm tra quyết định"
          danger
          onClose={() => setPenalty(false)}
          onSubmit={async (data) => {
            setPenaltyDraft({
              amount: Number(data.get("amount")),
              reason: String(data.get("reason")),
              note: String(data.get("note")),
            });
          }}
        >
          <Field label="Số tiền trừ (VND)">
            <input
              name="amount"
              required
              type="number"
              min={1000}
              step={1000}
            />
          </Field>
          <Field label="Lý do">
            <textarea
              name="reason"
              required
              minLength={5}
              maxLength={1000}
              rows={3}
              defaultValue={`Làm hỏng đơn #${o.id}`}
            />
          </Field>
          <Field label="Ghi chú">
            <textarea name="note" maxLength={1000} rows={2} />
          </Field>
        </FormModal>
      )}
      {penaltyDraft && e && (
        <FormModal
          title={`Bạn có chắc muốn trừ ${money(penaltyDraft.amount)} từ nhân viên ${e.name}?`}
          description={`#${o.id} · Khiếu nại ${id}. Khoản trừ sẽ được ghi vào lịch sử tài chính.`}
          submit="Xác nhận xử phạt"
          danger
          onClose={() => setPenaltyDraft(null)}
          onSubmit={async () => {
            await complaintService.penalty(
              id,
              penaltyDraft.amount,
              penaltyDraft.reason,
              penaltyDraft.note,
            );
            setPenaltyDraft(null);
            notify("Đã ghi nhận khoản xử phạt.");
          }}
        >
          <Facts
            items={[
              ["Nhân viên", e.name],
              ["Số tiền", money(penaltyDraft.amount)],
              ["Lý do", penaltyDraft.reason],
              ["Ghi chú", penaltyDraft.note || "—"],
            ]}
          />
        </FormModal>
      )}
    </>
  );
}
