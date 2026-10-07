"use client";

import { adminText, adminError } from "@/lib/admin/vi";
import { useServiceLoad } from "@/lib/admin/use-operations";
import { LoadingPanel, ErrorPanel } from "../operations/OrderUi";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Monitor, LockKeyhole, LogOut } from "lucide-react";
import { useAdminStore } from "@/lib/admin/store";
import { securityService, adminAuthService } from "@/services/admin";
import type { SecuritySession } from "@/types/admin";
import { useNotice } from "./AdminShell";
import {
  PageHeader,
  DataTable,
  Avatar,
  StatusBadge,
  ActivityTimeline,
  FormModal,
  Field,
  PermissionBadgeGroup,
  formatDate,
} from "./Ui";
export function SecurityPage() {
  const { sessions, activities, user } = useAdminStore();
  const load = useServiceLoad(securityService.getSecuritySessions);
  const notice = useNotice();
  const [target, setTarget] = useState<SecuritySession | null>(null);
  const owner = user?.role === "SUPER_ADMIN";
  if (load.loading) return <LoadingPanel />;
  if (load.error || load.unavailable)
    return (
      <ErrorPanel
        error={load.error || "Dữ liệu chưa khả dụng."}
        retry={load.retry}
      />
    );
  const visible = sessions.filter((s) => owner || s.userId === user?.id);
  return (
    <>
      <PageHeader
        eyebrow="BẢO VỆ KHÔNG GIAN LÀM VIỆC"
        title="Bảo mật và hoạt động"
        description="Theo dõi người đang đăng nhập và quản lý quyền truy cập của đội ngũ."
      >
        <span className="ap-date">
          <ShieldCheck size={16} /> Theo dõi phiên đăng nhập{" "}
        </span>
      </PageHeader>
      <div className="ap-info-strip">
        <ShieldCheck size={20} />
        <p>
          Thu hồi phiên sẽ đăng xuất thiết bị đó. IP được ghi vào nhật ký, không
          dùng làm yếu tố xác thực duy nhất.{" "}
        </p>
      </div>
      <section className="ap-panel">
        <div className="ap-panel-heading">
          <div>
            <h2>Phiên đăng nhập</h2>
            <p>
              {owner
                ? "Các phiên đang hoạt động và vừa bị thu hồi của đội ngũ."
                : "Các phiên đăng nhập gần đây của bạn."}
            </p>
          </div>
          <span className="ap-count">
            {visible.filter((s) => s.status === "ACTIVE").length} đang hoạt động
          </span>
        </div>
        <DataTable
          rows={visible}
          label="Phiên đăng nhập"
          columns={[
            {
              label: "Người dùng",
              render: (s) => (
                <div className="ap-person">
                  <Avatar name={s.user} />
                  <div>
                    <strong>{s.user}</strong>
                    <small>{s.email}</small>
                  </div>
                </div>
              ),
            },
            {
              label: "Thiết bị / IP",
              render: (s) => (
                <div className="ap-cell-stack">
                  <span>
                    <Monitor size={14} /> {adminText(s.device)}
                  </span>
                  <small>{s.ip}</small>
                </div>
              ),
            },
            {
              label: "Thời gian đăng nhập",
              render: (s) => formatDate(s.loginAt),
            },
            {
              label: "Hoạt động gần nhất",
              render: (s) => formatDate(s.lastActivityAt),
            },
            {
              label: "Trạng thái",
              render: (s) => <StatusBadge status={s.status} />,
            },
            {
              label: "Thao tác",
              render: (s) =>
                s.status === "ACTIVE" ? (
                  <button
                    className="ap-button small"
                    onClick={() => setTarget(s)}
                  >
                    Thu hồi{s.current ? " (hiện tại)" : ""}
                  </button>
                ) : (
                  <span className="ap-muted">Đã đăng xuất</span>
                ),
            },
          ]}
        />
      </section>
      <section className="ap-panel ap-spaced">
        <div className="ap-panel-heading">
          <div>
            <h2>Nhật ký hoạt động</h2>
            <p>Ghi nhận các thay đổi quan trọng trong hệ thống.</p>
          </div>
        </div>
        <ActivityTimeline
          activities={activities.filter(
            (a) => owner || a.actor === user?.fullName,
          )}
        />
      </section>
      {target && (
        <FormModal
          title="Thu hồi phiên đăng nhập này?"
          description={`${target.user} · ${adminText(target.device)}`}
          submit="Thu hồi phiên đăng nhập"
          danger
          onClose={() => setTarget(null)}
          onSubmit={async () => {
            await securityService.revokeSession(target.id);
            notice("Đã thu hồi phiên đăng nhập thành công.");
          }}
        >
          <p>
            {target.current && target.userId === user?.id
              ? "Đây là phiên hiện tại. Bạn sẽ bị đăng xuất."
              : "Thiết bị này sẽ mất quyền truy cập ngay. Người dùng cần đăng nhập lại để tiếp tục."}
          </p>
        </FormModal>
      )}
    </>
  );
}
export function ProfilePage() {
  const { user, sessions } = useAdminStore();
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  if (!user) return null;
  async function change(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setPending(true);
    setError("");
    try {
      await adminAuthService.changePassword(
        String(data.get("current")),
        String(data.get("password")),
        String(data.get("confirmation")),
      );
      router.push("/admin/login?changed=1");
    } catch (e) {
      setError(adminError(e));
    } finally {
      setPending(false);
    }
  }
  const recent = sessions.find((s) => s.userId === user.id);
  return (
    <>
      <PageHeader
        eyebrow="TÀI KHOẢN CỦA BẠN"
        title="Hồ sơ cá nhân"
        description="Thông tin cá nhân, quyền truy cập và thiết lập bảo mật."
      />
      <div className="ap-detail-grid">
        <div>
          <section className="ap-panel">
            <div className="ap-profile-banner">
              <Avatar name={user.fullName} size="large" />
              <div>
                <h2>{user.fullName}</h2>
                <p>{user.email}</p>
              </div>
              <span className="ap-role">{adminText(user.role)}</span>
            </div>
            <div className="ap-detail-facts ap-panel-padding">
              <div>
                <span>Tên hiển thị</span>
                {user.displayName}
              </div>
              <div>
                <span>Trạng thái tài khoản</span>
                <StatusBadge status="ACTIVE" />
              </div>
              <div>
                <span>Không gian làm việc</span>Vận hành ASCEND{" "}
              </div>
              <div>
                <span>Quyền truy cập</span>
                {user.role === "SUPER_ADMIN" ? (
                  "Toàn quyền quản trị"
                ) : (
                  <PermissionBadgeGroup permissions={user.permissions} />
                )}
              </div>
            </div>
          </section>
          <section className="ap-panel ap-prose">
            <h2>
              <LockKeyhole size={20} /> Đổi mật khẩu{" "}
            </h2>
            <p>
              Đổi mật khẩu sẽ đăng xuất tất cả phiên. Bạn cần đăng nhập
              lại.{" "}
            </p>
            <form onSubmit={change}>
              <Field label="Mật khẩu hiện tại">
                <input
                  name="current"
                  type="password"
                  required
                  autoComplete="current-password"
                />
              </Field>
              <div className="ap-form-grid">
                <Field label="Mật khẩu mới">
                  <input
                    name="password"
                    type="password"
                    minLength={12}
                    maxLength={128}
                    required
                    autoComplete="new-password"
                  />
                </Field>
                <Field label="Xác nhận mật khẩu mới">
                  <input
                    name="confirmation"
                    type="password"
                    required
                    autoComplete="new-password"
                  />
                </Field>
              </div>
              <p className="ap-form-hint">
                Ít nhất 12 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc
                biệt.{" "}
              </p>
              {error && (
                <p role="alert" className="ap-error">
                  {adminError(error)}
                </p>
              )}
              <button
                className="ap-button primary ap-spaced"
                disabled={pending}
              >
                {pending ? "Đang cập nhật…" : "Cập nhật mật khẩu và đăng xuất"}
                <LogOut size={16} />
              </button>
            </form>
          </section>
        </div>
        <aside>
          <section className="ap-panel ap-prose">
            <div className="ap-section-icon">
              <ShieldCheck size={25} />
            </div>
            <h2>Thông tin bảo mật</h2>
            <p>Quyền hạn của bạn do quản trị viên quản lý.</p>
            <div className="ap-detail-facts">
              <div>
                <span>Đăng nhập gần nhất</span>
                {recent ? formatDate(recent.loginAt) : "—"}
              </div>
              <div>
                <span>Thiết bị</span>
                {recent?.device ?? "—"}
              </div>
              <div>
                <span>Địa chỉ IP</span>
                {recent?.ip ?? "—"}
              </div>
            </div>
          </section>
          <div className="ap-side-note">
            <LockKeyhole size={18} />
            <p>Bảo vệ tài khoản và không chia sẻ mật khẩu của bạn. </p>
          </div>
        </aside>
      </div>
    </>
  );
}
