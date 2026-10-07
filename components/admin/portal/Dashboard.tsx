"use client";

import { useServiceLoad } from "@/lib/admin/use-operations";
import { dashboardService } from "@/services/dashboard.service";
import { LoadingPanel, ErrorPanel } from "../operations/OrderUi";
import Link from "next/link";
import {
  ArrowUpRight,
  CalendarDays,
  Users,
  Mail,
  ShieldCheck,
  Plus,
  ArrowRight,
} from "lucide-react";
import { useAdminStore } from "@/lib/admin/store";
import { getDashboardStats } from "@/services/admin";
import { OperationsOverview } from "../operations/OperationsOverview";
import { PageHeader, AdminStatCard, StatusBadge, ActivityTimeline } from "./Ui";
export function Dashboard() {
  const { user, invitations, activities } = useAdminStore();
  const load = useServiceLoad(dashboardService.getDashboard);
  const stats = getDashboardStats();
  const owner = user?.role === "SUPER_ADMIN";
  if (load.loading) return <LoadingPanel />;
  if (load.error) return <ErrorPanel {...load} />;
  return (
    <>
      <PageHeader
        eyebrow="TỔNG QUAN KHÔNG GIAN LÀM VIỆC"
        title={`Xin chào, ${user?.displayName}.`}
        description="Theo dõi hoạt động của đội ngũ hôm nay."
      >
        <span className="ap-date">
          <CalendarDays size={16} />{" "}
          {new Date().toLocaleDateString("vi-VN", {
            timeZone: "Asia/Ho_Chi_Minh",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}{" "}
        </span>
        {owner && (
          <Link
            href="/admin/staff/invitations?invite=1"
            className="ap-button primary"
          >
            <Plus size={16} /> Mời nhân sự{" "}
          </Link>
        )}
      </PageHeader>
      <OperationsOverview />
      <div className="ap-stats">
        <AdminStatCard
          label="Nhân sự đang hoạt động"
          value={stats.activeStaff}
          note={
            owner ? "Duy trì hoạt động liên tục" : "Tài khoản nhân sự của bạn"
          }
          icon={<Users size={19} />}
          index="02"
        />
        <AdminStatCard
          label="Lời mời đang chờ"
          value={stats.pendingInvitations}
          note={
            owner
              ? "Đang chờ gia nhập đội ngũ"
              : "Do quản trị viên cấp cao quản lý"
          }
          icon={<Mail size={19} />}
          index="03"
        />
      </div>
      <div className="ap-dashboard-grid">
        <section className="ap-panel ap-spotlight">
          <div className="ap-spotlight-icon">
            <ShieldCheck size={29} />
          </div>
          <div className="ap-eyebrow">XÂY DỰNG TRÊN NIỀM TIN</div>
          <h2>
            Đội ngũ vững mạnh bắt đầu <br />
            từ những người phù hợp.{" "}
          </h2>
          <p>
            Phân công nhân sự, cấp quyền phù hợp và bảo vệ không gian làm
            việc.{" "}
          </p>
          <Link
            href={owner ? "/admin/staff" : "/admin/profile"}
            className="ap-button primary"
          >
            {owner ? "Quản lý nhân sự" : "Xem hồ sơ cá nhân"}
            <ArrowRight size={16} />
          </Link>
          <div className="ap-spotlight-bottom">
            <small>Một đội ngũ. Một tiêu chuẩn cao hơn.</small>
          </div>
        </section>
        <section className="ap-panel">
          <div className="ap-panel-heading">
            <div>
              <h2>{owner ? "Lời mời nhân sự" : "Không gian làm việc"}</h2>
              <p>
                {owner
                  ? "Lời chào đón đang được gửi đi."
                  : "Mọi thứ bạn cần chỉ cách một thao tác."}
              </p>
            </div>
            {owner && (
              <Link href="/admin/staff/invitations">
                Quản lý <ArrowUpRight size={15} />
              </Link>
            )}
          </div>
          {owner ? (
            <div className="ap-invitation-list">
              {!invitations.length && (
                <p className="ap-panel-padding">Chưa có lời mời.</p>
              )}
              {invitations.slice(0, 3).map((i) => (
                <div key={i.id}>
                  <span className="ap-mail-icon">
                    <Mail size={18} />
                  </span>
                  <div>
                    <strong>{i.fullName}</strong>
                    <small>{i.email}</small>
                  </div>
                  <StatusBadge status={i.status} />
                </div>
              ))}
            </div>
          ) : (
            <div className="ap-panel-padding">
              <p>
                Tài khoản của bạn có {user?.permissions.length} quyền được
                cấp.{" "}
              </p>
              <Link className="ap-text-link" href="/admin/profile">
                Xem quyền truy cập →{" "}
              </Link>
            </div>
          )}
          <div className="ap-panel-footnote">
            <span className="ap-online" /> Lời mời hết hạn sau 24 giờ{" "}
          </div>
        </section>
        <section className="ap-panel">
          <div className="ap-panel-heading">
            <div>
              <h2>Hoạt động gần đây</h2>
              <p>Theo dõi rõ ràng. Quản lý an tâm.</p>
            </div>
            <Link href="/admin/security">
              Bảo mật <ArrowUpRight size={15} />
            </Link>
          </div>
          <ActivityTimeline
            activities={activities
              .filter((a) => owner || a.actor === user?.fullName)
              .slice(0, 3)}
          />
        </section>
      </div>
      <div className="ap-quick-actions">
        {owner && (
          <Link href="/admin/staff">
            <Users size={18} />
            <span>
              Quản lý đội ngũ<small>Nhân sự, quyền hạn và truy cập</small>
            </span>
            <ArrowUpRight size={17} />
          </Link>
        )}
        <Link href="/admin/security">
          <ShieldCheck size={18} />
          <span>
            Bảo vệ không gian làm việc{" "}
            <small>Phiên đăng nhập và hoạt động bảo mật</small>
          </span>
          <ArrowUpRight size={17} />
        </Link>
        <span className="ap-updated">Dữ liệu chưa khả dụng.</span>
      </div>
    </>
  );
}
