import type { Metadata } from "next";
import { Dashboard } from "@/components/admin/portal/Dashboard";
export const metadata: Metadata = {
  title: "Admin Workspace",
  robots: { index: false, follow: false },
  alternates: { canonical: "/admin" },
};
export default function AdminPage() {
  return <Dashboard />;
}
