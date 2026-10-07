import type { Metadata } from "next";
import { vietnameseAdminFont } from "@/lib/admin/font";
import { EmployeeShell } from "@/components/workflow/EmployeeShell";
import "../admin/portal.css";
import "../admin/operations.css";
import "../admin/typography.css";
import "../admin/workflow.css";
import "./riot.css";
export const metadata: Metadata = {
  title: "Không gian nhân viên",
  robots: { index: false, follow: false },
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div lang="vi" className={`${vietnameseAdminFont.variable} ap-root`}>
      <EmployeeShell>{children}</EmployeeShell>
    </div>
  );
}
