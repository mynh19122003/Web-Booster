import type { Metadata } from "next";
import { adminFont } from "@/lib/admin/font";
import { EmployeeShell } from "@/components/admin/operations/EmployeePreview";
import "../admin/portal.css";
import "../admin/operations.css";
export const metadata: Metadata = {
  title: "Employee Preview",
  robots: { index: false, follow: false },
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${adminFont.variable} ap-root`}>
      <EmployeeShell>{children}</EmployeeShell>
    </div>
  );
}
