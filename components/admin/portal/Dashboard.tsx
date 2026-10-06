"use client";

import { adminText } from "@/lib/admin/vi";
import Link from "next/link";
import {
  ArrowUpRight,
  CalendarDays,
  ClipboardList,
  Users,
  Mail,
  ShieldCheck,
  Plus,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { useAdminStore } from "@/lib/admin/store";
import { can, getDashboardStats } from "@/services/admin";
import { OperationsOverview } from "../operations/OperationsOverview";
import {
  PageHeader,
  AdminStatCard,
  Avatar,
  StatusBadge,
  ActivityTimeline,
  formatDate,
} from "./Ui";
export function Dashboard() {
  const { user, applications, invitations, activities } = useAdminStore();
  const stats = getDashboardStats();
  const owner = user?.role === "SUPER_ADMIN";
  const view = can("employee.application.view");
  return (
    <>
      <PageHeader
        eyebrow="TỔNG QUAN KHÔNG GIAN LÀM VIỆC"
        title={`Xin chào, ${user?.displayName}.`}
        description="Theo dõi hoạt động của đội ngũ hôm nay."
      >
        <span className="ap-date">
          <CalendarDays size={16} /> 05 tháng 10 năm 2026{" "}
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
          label="Hồ sơ chờ duyệt"
          value={view ? stats.pendingApplications : 0}
          note={view ? "Sẵn sàng xét duyệt" : "Cần quyền xem"}
          icon={<ClipboardList size={19} />}
          index="01"
        />
        <AdminStatCard
          label="Nhân sự đang hoạt động"
          value={owner ? stats.activeStaff : 1}
          note={
            owner ? "Duy trì hoạt động liên tục" : "Tài khoản nhân sự của bạn"
          }
          icon={<Users size={19} />}
          index="02"
        />
        <AdminStatCard
          label="Lời mời đang chờ"
          value={owner ? stats.pendingInvitations : 0}
          note={
            owner
              ? "Đang chờ gia nhập đội ngũ"
              : "Do quản trị viên cấp cao quản lý"
          }
          icon={<Mail size={19} />}
          index="03"
        />
        <AdminStatCard
          label="Nhân viên đang hoạt động"
          value={view ? stats.activeEmployees : 0}
          note="Đã được duyệt trong hệ thống"
          icon={<CheckCircle2 size={19} />}
          index="04"
        />
      </div>
      <div className="ap-dashboard-grid">
        <section className="ap-panel ap-applications-panel">
          <div className="ap-panel-heading">
            <div>
              <h2>
                Hồ sơ gần đây{" "}
                <span className="ap-count">
                  {view ? applications.length : "—"}
                </span>
              </h2>
              <p>Thành viên tiếp theo của đội ngũ có thể ở đây.</p>
            </div>
            {view && (
              <Link href="/admin/employee-applications">
                Xem tất cả <ArrowUpRight size={15} />
              </Link>
            )}
          </div>
          {view ? (
            <div className="ap-table-wrap">
              <table aria-label="Hồ sơ gần đây">
                <thead>
                  <tr>
                    <th>Ứng viên</th>
                    <th>Vị trí ứng tuyển</th>
                    <th>Trạng thái</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {applications.slice(0, 5).map((a) => (
                    <tr key={a.id}>
                      <td>
                        <div className="ap-person">
                          <Avatar name={a.fullName} />
                          <div>
                            <strong>{a.fullName}</strong>
                            <small>{a.riotId}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="ap-position">
                          {adminText(a.positionApplied)}
                        </span>
                      </td>
                      <td>
                        <StatusBadge status={a.status} />
                      </td>
                      <td>
                        <Link
                          href={`/admin/employee-applications/${a.id}`}
                          className="ap-icon-button"
                          aria-label={`Xem hồ sơ ${a.fullName}`}
                        >
                          <ArrowUpRight size={18} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="ap-panel-padding">
              Quyền truy cập hồ sơ do quản trị viên cấp cao quản lý.{" "}
            </p>
          )}
        </section>
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
            Xét duyệt ứng viên, cấp quyền phù hợp và bảo vệ không gian làm
            việc.{" "}
          </p>
          <Link
            href={view ? "/admin/employee-applications" : "/admin/profile"}
            className="ap-button primary"
          >
            {view ? "Xét duyệt hồ sơ" : "Xem hồ sơ cá nhân"}
            <ArrowRight size={16} />
          </Link>
          <div className="ap-spotlight-bottom">
            <span className="ap-stack">
              <Avatar name="Olivia Chen" />
              <Avatar name="Marcus Reed" />
              <Avatar name="Sofia Laurent" />
            </span>
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
        <span className="ap-updated">
          Dữ liệu dùng thử · {formatDate("2026-10-05")}
        </span>
      </div>
    </>
  );
}
