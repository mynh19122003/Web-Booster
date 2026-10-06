import { adminFont } from "@/lib/admin/font";
import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/portal/AdminShell";
import "./portal.css";
import "./operations.css";
export const metadata: Metadata = {
  title: "Trang quản trị",
  robots: { index: false, follow: false },
};
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div lang="vi" className={`${adminFont.variable} ap-root`}>
      <AdminShell>{children}</AdminShell>
    </div>
  );
}
