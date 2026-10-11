import { redirect } from "next/navigation";
import Link from "next/link";
import { currentUser } from "@/lib/current-user";
import { EmployeeOrderWorkspace } from "@/components/employee/EmployeeOrderWorkspace";
import { StatusToggle } from "@/components/employee/StatusToggle";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { UiText } from "@/components/ui/UiText";
import { Database, Gamepad2, MessageSquare, Shield, Users } from "lucide-react";

export const metadata = { title: "Employee workspace", robots: { index: false, follow: false } };

export default async function EmployeePage() {
  const user = await currentUser();
  if (!user) redirect("/employee/login");
  if (user.role !== "employee") redirect("/profile");

  return (
    <div className="employee-workspace">
      <div className="employee-dashboard-header">
        <div className="employee-dashboard-brand">
          <span className="employee-dashboard-badge">
            <Shield size={13} />
            <UiText english="Employee" vietnamese="Nhân viên" />
          </span>
          <h1><UiText english="Workspace" vietnamese="Khu làm việc" /></h1>
          <p className="employee-dashboard-user">
            <UiText english="Signed in as" vietnamese="Đăng nhập với" />{" "}
            <strong>{user.name}</strong>
          </p>
        </div>
        <div className="employee-dashboard-actions">
          <StatusToggle />
          <LogoutButton />
        </div>
      </div>

      <div className="employee-nav-grid">
        <Link href="/employee/riot" className="employee-nav-card">
          <div className="employee-nav-card-icon employee-nav-card-icon--blue"><Database size={22} /></div>
          <div><h2><UiText english="Riot game data" vietnamese="Dữ liệu game Riot" /></h2>
            <p><UiText english="LoL, TFT and Valorant accounts, ranks and matches" vietnamese="Tài khoản, rank và trận đấu LoL, TFT, Valorant" /></p></div>
        </Link>
        <div className="employee-nav-card employee-nav-card--active">
          <div className="employee-nav-card-icon">
            <MessageSquare size={22} />
          </div>
          <div>
            <h2><UiText english="Customer requests" vietnamese="Yêu cầu khách hàng" /></h2>
            <p><UiText english="Manage and reply to support tickets" vietnamese="Quản lý và phản hồi yêu cầu hỗ trợ" /></p>
          </div>
        </div>
        <Link href="/employee/coaches" className="employee-nav-card">
          <div className="employee-nav-card-icon employee-nav-card-icon--purple">
            <Users size={22} />
          </div>
          <div>
            <h2><UiText english="Coach workspace" vietnamese="Không gian coach" /></h2>
            <p><UiText english="Manage your profile and coaching availability" vietnamese="Quản lý hồ sơ và trạng thái nhận coaching" /></p>
          </div>
        </Link>
        <Link href="/coaches" className="employee-nav-card">
          <div className="employee-nav-card-icon employee-nav-card-icon--blue">
            <Gamepad2 size={22} />
          </div>
          <div>
            <h2><UiText english="Coach directory" vietnamese="Danh sách coach" /></h2>
            <p><UiText english="View all coaches and their profiles" vietnamese="Xem tất cả coach và profile" /></p>
          </div>
        </Link>
      </div>

      <div className="employee-section-label">
        <MessageSquare size={15} />
        <span><UiText english="Support inbox" vietnamese="Hộp thư hỗ trợ" /></span>
      </div>

      <EmployeeOrderWorkspace />
    </div>
  );
}
