"use client";

import { adminText } from "@/lib/admin/vi";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  X,
  Send,
  Trophy,
  ClipboardCheck,
  Globe,
  Mail,
} from "lucide-react";
import { useAdminStore } from "@/lib/admin/store";
import { can, employeeApplicationService } from "@/services/admin";
import type { ApproveApplicationInput } from "@/types/admin";
import { useNotice } from "./AdminShell";
import {
  AccessDenied,
  PageHeader,
  SearchFilterBar,
  DataTable,
  Avatar,
  StatusBadge,
  FormModal,
  Field,
  EmptyState,
  formatDate,
} from "./Ui";
export function ApplicationsPage() {
  const { applications } = useAdminStore();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("ALL");
  if (!can("employee.application.view")) return <AccessDenied />;
  const rows = applications.filter(
    (a) =>
      `${a.fullName} ${a.email} ${a.riotId}`
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (status === "ALL" || status === a.status),
  );
  return (
    <>
      <PageHeader
        eyebrow="TÌM KIẾM NHÂN TÀI"
        title="Hồ sơ ứng tuyển"
        description="Khám phá các ứng viên sẵn sàng cùng ASCEND phát triển."
      >
        <span className="ap-date">
          <ClipboardCheck size={17} />{" "}
          {applications.filter((a) => a.status === "PENDING").length} đang chờ
          duyệt{" "}
        </span>
      </PageHeader>
      <div className="ap-tabs" role="group" aria-label="Trạng thái hồ sơ">
        {["ALL", "PENDING", "APPROVED", "REJECTED"].map((s) => (
          <button
            key={s}
            className={status === s ? "active" : ""}
            onClick={() => setStatus(s)}
          >
            {s === "ALL" ? "Tất cả hồ sơ" : adminText(s)}
            <span>
              {applications.filter((a) => s === "ALL" || a.status === s).length}
            </span>
          </button>
        ))}
      </div>
      <section className="ap-panel">
        <SearchFilterBar
          query={query}
          onQuery={setQuery}
          status={status}
          onStatus={setStatus}
          statuses={["PENDING", "APPROVED", "REJECTED"]}
          placeholder="Tìm theo tên, email hoặc Riot ID…"
        />
        <DataTable
          label="Hồ sơ ứng tuyển"
          rows={rows}
          columns={[
            {
              label: "Ứng viên",
              render: (a) => (
                <div className="ap-person">
                  <Avatar name={a.fullName} />
                  <div>
                    <strong>{a.fullName}</strong>
                    <small>{a.email}</small>
                  </div>
                </div>
              ),
            },
            {
              label: "Vị trí ứng tuyển",
              render: (a) => (
                <span className="ap-position">
                  {adminText(a.positionApplied)}
                </span>
              ),
            },
            {
              label: "Riot ID / Hạng",
              render: (a) => (
                <div className="ap-cell-stack">
                  {a.riotId}
                  <small className="ap-rank">{a.currentRank}</small>
                </div>
              ),
            },
            {
              label: "Trạng thái",
              render: (a) => <StatusBadge status={a.status} />,
            },
            { label: "Ngày gửi", render: (a) => formatDate(a.submittedAt) },
            {
              label: "Xem hồ sơ",
              render: (a) => (
                <Link
                  className="ap-icon-button"
                  aria-label={`Xem hồ sơ ${a.fullName}`}
                  href={`/admin/employee-applications/${a.id}`}
                >
                  <ArrowUpRight size={18} />
                </Link>
              ),
            },
          ]}
        />
      </section>
    </>
  );
}
export function ApplicationDetail({ id }: { id: string }) {
  const { applications } = useAdminStore();
  const a = applications.find((x) => x.id === id);
  const notice = useNotice();
  const [dialog, setDialog] = useState<"approve" | "reject" | "resend" | null>(
    null,
  );
  if (!can("employee.application.view")) return <AccessDenied />;
  if (!a)
    return (
      <EmptyState
        title="Không tìm thấy hồ sơ"
        text="Hồ sơ này có thể không còn tồn tại."
      >
        <Link className="ap-button" href="/admin/employee-applications">
          Quay lại danh sách hồ sơ{" "}
        </Link>
      </EmptyState>
    );
  return (
    <>
      <Link className="ap-back" href="/admin/employee-applications">
        <ArrowLeft size={15} /> Tất cả hồ sơ{" "}
      </Link>
      <PageHeader
        eyebrow={`HỒ SƠ / ${a.id.toUpperCase()}`}
        title={a.fullName}
        description={`Ngày gửi ${formatDate(a.submittedAt)} · Vị trí ${adminText(a.positionApplied)}`}
      >
        <StatusBadge status={a.status} />
        {a.status === "PENDING" && (
          <>
            {can("employee.application.reject") && (
              <button className="ap-button" onClick={() => setDialog("reject")}>
                <X size={16} /> Từ chối{" "}
              </button>
            )}
            {can("employee.application.approve") && (
              <button
                className="ap-button primary"
                onClick={() => setDialog("approve")}
              >
                <Check size={16} /> Duyệt hồ sơ{" "}
              </button>
            )}
          </>
        )}
      </PageHeader>
      <div className="ap-detail-grid">
        <div>
          <section className="ap-panel">
            <div className="ap-profile-banner">
              <Avatar name={a.fullName} size="large" />
              <div>
                <h2>{a.displayName}</h2>
                <p>{a.fullName}</p>
              </div>
              <span className="ap-rank-pill">
                <Trophy size={16} />
                {a.currentRank}
              </span>
            </div>
            <div className="ap-detail-facts ap-panel-padding">
              <div>
                <span>Địa chỉ email</span>
                <a href={`mailto:${a.email}`}>{a.email}</a>
              </div>
              <div>
                <span>Số điện thoại</span>
                {a.phone}
              </div>
              <div>
                <span>Quốc gia</span>
                {a.country === "VN" ? "Việt Nam" : a.country}
              </div>
              <div>
                <span>Múi giờ</span>
                {a.timezone}
              </div>
              <div>
                <span>Riot ID</span>
                {a.riotId}
              </div>
              <div>
                <span>Vị trí ứng tuyển</span>
                {adminText(a.positionApplied)}
              </div>
            </div>
          </section>
          <section className="ap-panel ap-prose">
            <h2>Kinh nghiệm và thông tin ứng viên</h2>
            <p>{adminText(a.experience)}</p>
            <h2>Lời nhắn từ {a.displayName}</h2>
            <p>{adminText(a.note)}</p>
          </section>
        </div>
        <aside>
          <section className="ap-panel ap-prose">
            <div className="ap-section-icon">
              <ClipboardCheck size={22} />
            </div>
            <h2>Trạng thái xét duyệt</h2>
            <StatusBadge status={a.status} />
            <ol className="ap-review-timeline">
              <li>
                <b>Đã nhận hồ sơ</b>
                <small>{formatDate(a.submittedAt)}</small>
              </li>
              <li>
                <b>
                  {a.status === "PENDING"
                    ? "Đang chờ xét duyệt"
                    : `Hồ sơ: ${adminText(a.status)}`}
                </b>
                <small>
                  {a.reviewedBy
                    ? `${a.reviewedBy} · ${formatDate(a.reviewedAt!)}`
                    : "Hãy xem xét kinh nghiệm của ứng viên."}
                </small>
              </li>
            </ol>
            {a.rejectionReason && (
              <div className="ap-error">{adminText(a.rejectionReason)}</div>
            )}
            {a.status === "APPROVED" && (
              <>
                <div className="ap-success">
                  <Mail size={18} />
                  <span>
                    Đã gửi thông tin đăng nhập cho nhân viên.{" "}
                    <small>Việc gửi được mô phỏng trong bản dùng thử.</small>
                  </span>
                </div>
                <p>
                  Lần đăng nhập đầu tiên yêu cầu đổi mật khẩu trong vòng 24 giờ.
                </p>
                <p>
                  {adminText(a.department ?? "")} · {a.maxActiveOrders} đơn đang
                  thực hiện{" "}
                </p>
                {can("employee.application.approve") && (
                  <button
                    className="ap-button"
                    onClick={() => setDialog("resend")}
                  >
                    <Send size={15} /> Gửi lại thông tin đăng nhập{" "}
                  </button>
                )}
              </>
            )}
          </section>
          <div className="ap-side-note">
            <Globe size={18} />
            <p>
              Dịch vụ tốt bắt đầu từ nhân sự tốt. Hãy xem xét kỹ từng hồ
              sơ.{" "}
            </p>
          </div>
        </aside>
      </div>
      {dialog && (
        <FormModal
          title={
            dialog === "approve"
              ? "Chào đón nhân viên mới"
              : dialog === "reject"
                ? "Từ chối hồ sơ"
                : "Gửi lại thông tin đăng nhập cho nhân viên"
          }
          description={
            dialog === "approve"
              ? `Thiết lập tài khoản cho ${a.displayName}. Thông tin đăng nhập tạm sẽ được gửi qua email.`
              : dialog === "reject"
                ? "Nêu rõ lý do từ chối. Không thể hoàn tác quyết định này."
                : "Mật khẩu tạm mới thay thế mật khẩu cũ và thu hồi các phiên hiện tại."
          }
          submit={
            dialog === "approve"
              ? "Duyệt và gửi thông tin đăng nhập"
              : dialog === "reject"
                ? "Từ chối hồ sơ"
                : "Gửi lại thông tin đăng nhập"
          }
          danger={dialog === "reject"}
          onClose={() => setDialog(null)}
          onSubmit={async (data) => {
            if (dialog === "approve")
              await employeeApplicationService.approveEmployeeApplication(
                a.id,
                {
                  employeeType: String(
                    data.get("employee_type"),
                  ) as ApproveApplicationInput["employeeType"],
                  department: String(
                    data.get("department"),
                  ) as ApproveApplicationInput["department"],
                  maxActiveOrders: Number(data.get("max_active_orders")),
                },
              );
            if (dialog === "reject")
              await employeeApplicationService.rejectEmployeeApplication(
                a.id,
                String(data.get("rejection_reason")),
              );
            if (dialog === "resend")
              await employeeApplicationService.resendCredentials(a.id);
            notice(
              dialog === "reject"
                ? "Đã từ chối hồ sơ và lưu kết quả xét duyệt."
                : "Đã gửi thông tin đăng nhập cho nhân viên (dùng thử).",
            );
          }}
        >
          {dialog === "approve" ? (
            <>
              <Field label="Loại nhân viên">
                <select name="employee_type" defaultValue={a.positionApplied}>
                  <option value="BOOSTER">Nhân viên cày hạng</option>
                  <option value="COACH">Huấn luyện viên</option>
                </select>
              </Field>
              <Field label="Bộ phận">
                <select
                  name="department"
                  defaultValue={
                    a.positionApplied === "COACH" ? "COACHING" : "BOOSTING"
                  }
                >
                  <option value="BOOSTING">Cày hạng</option>
                  <option value="COACHING">Huấn luyện</option>
                </select>
              </Field>
              <Field label="Số đơn tối đa đang thực hiện">
                <input
                  name="max_active_orders"
                  type="number"
                  min={1}
                  max={100}
                  defaultValue={3}
                  required
                />
              </Field>
            </>
          ) : dialog === "reject" ? (
            <Field label="Lý do từ chối">
              <textarea
                name="rejection_reason"
                required
                minLength={5}
                maxLength={2000}
                rows={4}
                placeholder="Nêu lý do hồ sơ chưa phù hợp…"
              />
            </Field>
          ) : (
            <p>
              Bản dùng thử ghi nhận việc gửi lại vào nhật ký. Không gửi email
              thật.{" "}
            </p>
          )}
        </FormModal>
      )}
    </>
  );
}
