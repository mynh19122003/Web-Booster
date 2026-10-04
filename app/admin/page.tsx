import type { Metadata } from "next";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
export const metadata: Metadata = {
  title: "Admin Workspace",
  robots: { index: false, follow: false },
  alternates: { canonical: "/admin" },
};
export default function AdminPage() {
  return <AdminDashboard />;
}
