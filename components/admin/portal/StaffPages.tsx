"use client";

import { adminText } from "@/lib/admin/vi";
import Link from "next/link";
import { useServiceLoad } from "@/lib/admin/use-operations";
import { LoadingPanel, ErrorPanel } from "../operations/OrderUi";
import { useState } from "react";
import { Plus, Users, ShieldCheck, Mail, ArrowUpRight } from "lucide-react";
import { useAdminStore } from "@/lib/admin/store";
import { staffService } from "@/services/admin";
import type { StaffMember, StaffInvitation, Permission } from "@/types/admin";
import { useNotice } from "./AdminShell";
import {
  AccessDenied,
  PageHeader,
  SearchFilterBar,
  DataTable,
  Avatar,
  StatusBadge,
  PermissionBadgeGroup,
  ActionMenu,
  FormModal,
  PermissionFields,
  Field,
  formatDate,
} from "./Ui";
export function StaffPage() {
  const { staff, user } = useAdminStore();
  const load = useServiceLoad(staffService.getStaff);
  const notice = useNotice();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("ALL");
  const [dialog, setDialog] = useState<{
    member: StaffMember;
    action: string;
  } | null>(null);
  if (user?.role !== "SUPER_ADMIN") return <AccessDenied />;
  if (load.loading) return <LoadingPanel />;
  if (load.error || load.unavailable)
    return (
      <ErrorPanel
        error={load.error || "Dữ liệu chưa khả dụng."}
        retry={load.retry}
      />
    );
  const rows = staff.filter(
    (s) =>
      `${s.fullName} ${s.email}`.toLowerCase().includes(query.toLowerCase()) &&
      (status === "ALL" || s.status === status),
  );
  return (
    <>
      <PageHeader
        eyebrow="NHÂN SỰ VÀ QUYỀN TRUY CẬP"
        title="Đội ngũ cùng nhịp."
        description="Quản lý đội ngũ giúp ASCEND vận hành hiệu quả."
      >
        <Link
          href="/admin/staff/invitations?invite=1"
          className="ap-button primary"
        >
          <Plus size={16} /> Mời nhân sự{" "}
        </Link>
      </PageHeader>
      <div className="ap-inline-summary">
        <span>
          <Users size={17} />
          <b>{staff.length}</b> Thành viên đội ngũ{" "}
        </span>
        <span>
          <i className="ap-online" />
          <b>{staff.filter((s) => s.status === "ACTIVE").length}</b> Đang hoạt
          động{" "}
        </span>
        <span>
          <ShieldCheck size={17} /> Truy cập theo quyền hạn{" "}
        </span>
      </div>
      <section className="ap-panel">
        <SearchFilterBar
          query={query}
          onQuery={setQuery}
          status={status}
          onStatus={setStatus}
          statuses={["ACTIVE", "SUSPENDED"]}
        />
        <DataTable
          label="Nhân sự quản trị"
          rows={rows}
          columns={[
            {
              label: "Thành viên",
              render: (s) => (
                <div className="ap-person">
                  <Avatar name={s.fullName} />
                  <div>
                    <strong>{s.fullName}</strong>
                    <small>{s.email}</small>
                  </div>
                </div>
              ),
            },
            {
              label: "Vai trò",
              render: (s) => (
                <span className="ap-role">{adminText(s.role)}</span>
              ),
            },
            {
              label: "Trạng thái",
              render: (s) => <StatusBadge status={s.status} />,
            },
            {
              label: "Quyền hạn",
              render: (s) => (
                <PermissionBadgeGroup permissions={s.permissions} />
              ),
            },
            {
              label: "Đăng nhập gần nhất / IP",
              render: (s) => (
                <div className="ap-cell-stack">
                  {formatDate(s.lastLogin)}
                  <small>{s.ip}</small>
                </div>
              ),
            },
            {
              label: "Thao tác",
              render: (s) => (
                <ActionMenu>
                  {[
                    "View detail",
                    "Edit permissions",
                    s.status === "ACTIVE" ? "Suspend" : "Activate",
                    "Revoke sessions",
                  ].map((action) => (
                    <button
                      key={action}
                      onClick={() => setDialog({ member: s, action })}
                    >
                      {adminText(action)}
                    </button>
                  ))}
                </ActionMenu>
              ),
            },
          ]}
        />
      </section>
      {dialog && (
        <FormModal
          title={adminText(dialog.action)}
          description={`${dialog.member.fullName} · ${dialog.member.email}`}
          submit={
            dialog.action === "View detail" ? "Đóng" : adminText(dialog.action)
          }
          danger={["Suspend", "Revoke sessions"].includes(dialog.action)}
          onClose={() => setDialog(null)}
          onSubmit={async (data) => {
            const { action, member } = dialog;
            if (action === "Edit permissions")
              await staffService.updateStaffPermissions(
                member.id,
                data.getAll("permissions") as Permission[],
              );
            if (action === "Suspend")
              await staffService.suspendStaff(member.id);
            if (action === "Activate")
              await staffService.activateStaff(member.id);
            if (action === "Revoke sessions")
              await staffService.revokeStaffSessions(member.id);
            if (action !== "View detail")
              notice(
                `${adminText(action)} thành công cho ${member.displayName}.`,
              );
          }}
        >
          {dialog.action === "Edit permissions" ? (
            <PermissionFields defaults={dialog.member.permissions} />
          ) : dialog.action === "View detail" ? (
            <div className="ap-detail-facts">
              <div>
                <span>Trạng thái tài khoản</span>
                <StatusBadge status={dialog.member.status} />
              </div>
              <div>
                <span>Đăng nhập gần nhất</span>
                {formatDate(dialog.member.lastLogin)}
              </div>
              <div>
                <span>IP gần nhất</span>
                {dialog.member.ip}
              </div>
              <div>
                <span>Quyền hạn</span>
                <PermissionBadgeGroup permissions={dialog.member.permissions} />
              </div>
            </div>
          ) : (
            <p>
              {dialog.action === "Suspend"
                ? "Thành viên này sẽ mất quyền truy cập và tất cả phiên đăng nhập sẽ bị thu hồi. Bạn có thể kích hoạt lại sau."
                : dialog.action === "Activate"
                  ? "Khôi phục quyền truy cập cho nhân sự này. Họ cần đăng nhập lại."
                  : "Tất cả phiên của thành viên này sẽ bị đăng xuất. Họ có thể đăng nhập lại bằng mật khẩu."}
            </p>
          )}
        </FormModal>
      )}
    </>
  );
}
export function InvitationsPage({
  openInvite = false,
}: {
  openInvite?: boolean;
}) {
  const { invitations, user } = useAdminStore();
  const load = useServiceLoad(staffService.getStaffInvitations);
  const notice = useNotice();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("ALL");
  const [invite, setInvite] = useState(openInvite);
  const [dialog, setDialog] = useState<{
    invitation: StaffInvitation;
    action: string;
  } | null>(null);
  if (user?.role !== "SUPER_ADMIN") return <AccessDenied />;
  if (load.loading) return <LoadingPanel />;
  if (load.error || load.unavailable)
    return (
      <ErrorPanel
        error={load.error || "Dữ liệu chưa khả dụng."}
        retry={load.retry}
      />
    );
  const rows = invitations.filter(
    (i) =>
      `${i.email} ${i.fullName}`.toLowerCase().includes(query.toLowerCase()) &&
      (status === "ALL" || status === i.status),
  );
  return (
    <>
      <PageHeader
        eyebrow="PHÁT TRIỂN ĐỘI NGŨ"
        title="Nhân sự phù hợp bắt đầu từ một lời mời."
        description="Mời người bạn tin tưởng vào hệ thống với quyền truy cập phù hợp."
      >
        <button className="ap-button primary" onClick={() => setInvite(true)}>
          <Plus size={16} /> Mời nhân sự{" "}
        </button>
      </PageHeader>
      <div className="ap-info-strip">
        <Mail size={18} />
        <p>
          Nhân sự tự đặt mật khẩu. Mỗi lời mời dùng một lần và hết hạn sau 24
          giờ.{" "}
        </p>
        <span>Bảo mật ngay từ đầu</span>
      </div>
      <section className="ap-panel">
        <SearchFilterBar
          query={query}
          onQuery={setQuery}
          status={status}
          onStatus={setStatus}
          statuses={["PENDING", "ACCEPTED", "EXPIRED", "REVOKED"]}
        />
        <DataTable
          label="Lời mời"
          rows={rows}
          columns={[
            {
              label: "Người được mời",
              render: (i) => (
                <div className="ap-person">
                  <Avatar name={i.fullName} />
                  <div>
                    <strong>{i.fullName}</strong>
                    <small>{i.email}</small>
                  </div>
                </div>
              ),
            },
            {
              label: "Quyền hạn",
              render: (i) => (
                <PermissionBadgeGroup permissions={i.permissions} />
              ),
            },
            {
              label: "Trạng thái",
              render: (i) => <StatusBadge status={i.status} />,
            },
            {
              label: "Ngày mời / Hết hạn",
              render: (i) => (
                <div className="ap-cell-stack">
                  {formatDate(i.createdAt)}
                  <small>{formatDate(i.expiresAt)}</small>
                </div>
              ),
            },
            {
              label: "Thao tác",
              render: (i) => (
                <ActionMenu>
                  <button
                    onClick={() =>
                      setDialog({ invitation: i, action: "Invitation detail" })
                    }
                  >
                    Xem chi tiết{" "}
                  </button>
                  {["PENDING", "EXPIRED"].includes(i.status) && (
                    <>
                      <button
                        onClick={() =>
                          setDialog({
                            invitation: i,
                            action: "Resend invitation",
                          })
                        }
                      >
                        Gửi lại lời mời{" "}
                      </button>
                      <button
                        onClick={() =>
                          setDialog({
                            invitation: i,
                            action: "Revoke invitation",
                          })
                        }
                      >
                        Thu hồi lời mời{" "}
                      </button>
                    </>
                  )}
                </ActionMenu>
              ),
            },
          ]}
        />
      </section>
      {invite && (
        <FormModal
          title="Mời nhân sự mới"
          description="Thêm thành viên, nâng tiêu chuẩn. Chọn quyền truy cập bên dưới."
          submit="Gửi lời mời"
          onClose={() => setInvite(false)}
          onSubmit={async (data) => {
            await staffService.createStaffInvitation({
              email: String(data.get("email")),
              fullName: String(data.get("full_name")),
              displayName: String(data.get("display_name")),
              permissions: data.getAll("permissions") as Permission[],
            });
            notice("Đã gửi lời mời nhân sự.");
          }}
        >
          <div className="ap-form-grid">
            <Field label="Họ và tên">
              <input
                name="full_name"
                required
                maxLength={160}
                placeholder="Ví dụ: Nguyễn Minh Anh"
              />
            </Field>
            <Field label="Tên hiển thị">
              <input
                name="display_name"
                required
                maxLength={80}
                placeholder="Ví dụ: Minh Anh"
              />
            </Field>
          </div>
          <Field label="Địa chỉ email">
            <input
              name="email"
              type="email"
              required
              placeholder="teammate@example.com"
            />
          </Field>
          <PermissionFields />
        </FormModal>
      )}
      {dialog && (
        <FormModal
          title={adminText(dialog.action)}
          description={dialog.invitation.email}
          submit={
            dialog.action === "Invitation detail" ? "Đóng" : dialog.action
          }
          danger={dialog.action === "Revoke invitation"}
          onClose={() => setDialog(null)}
          onSubmit={async () => {
            if (dialog.action === "Resend invitation")
              await staffService.resendStaffInvitation(dialog.invitation.id);
            if (dialog.action === "Revoke invitation")
              await staffService.revokeStaffInvitation(dialog.invitation.id);
            if (dialog.action !== "Invitation detail")
              notice(`${adminText(dialog.action)} thành công.`);
          }}
        >
          <StatusBadge status={dialog.invitation.status} />
          <p className="ap-spaced">
            {dialog.action === "Revoke invitation"
              ? "Liên kết này sẽ hết hiệu lực ngay. Người được mời không thể sử dụng để gia nhập."
              : dialog.action === "Resend invitation"
                ? "Lời mời mới sẽ thay thế liên kết cũ và có hiệu lực trong 24 giờ."
                : `Ngày mời ${formatDate(dialog.invitation.createdAt)}. Hết hạn ${formatDate(dialog.invitation.expiresAt)}.`}
          </p>
          <PermissionBadgeGroup permissions={dialog.invitation.permissions} />
          {dialog.action === "Invitation detail" &&
            dialog.invitation.token &&
            dialog.invitation.status === "PENDING" && (
              <Link
                className="ap-button ap-spaced"
                href={`/admin/accept-invitation?token=${dialog.invitation.token}`}
              >
                Xem lời mời <ArrowUpRight size={15} />
              </Link>
            )}
        </FormModal>
      )}
    </>
  );
}
