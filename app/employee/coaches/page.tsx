import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/current-user";
import { CoachRiotAccounts } from "@/components/coaches/CoachRiotAccounts";
import { UiText } from "@/components/ui/UiText";
import { ArrowLeft, Users } from "lucide-react";

export const metadata = { title: "Coach workspace", robots: { index: false, follow: false } };

export default async function CoachAccountsPage() {
  const user = await currentUser();
  if (!user) redirect("/employee/login");
  if (user.role !== "employee") redirect("/profile");

  return (
    <div className="employee-workspace">
      <div className="employee-dashboard-header">
        <div className="employee-dashboard-brand">
          <Link href="/employee" className="employee-back-link">
            <ArrowLeft size={15} />
            <UiText english="Back to workspace" vietnamese="Về trang làm việc" />
          </Link>
          <h1>
            <Users size={28} style={{ display: "inline", verticalAlign: "middle", marginRight: 10 }} />
            <UiText english="Coach workspace" vietnamese="Không gian coach" />
          </h1>
          <p className="employee-dashboard-desc">
            <UiText
              english="Manage your profile, accept coaching sessions and connect your Riot account."
              vietnamese="Quản lý hồ sơ, bật/tắt nhận coaching và liên kết tài khoản Riot của bạn."
            />
          </p>
        </div>
      </div>

      <CoachRiotAccounts />
    </div>
  );
}
