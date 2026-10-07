"use client";
import { usePathname } from "next/navigation";
import { SkipLink as OperationalSkipLink } from "@/components/admin/SkipLink";

// Public's translated skip link lives inside its locale provider. Keep main's
// existing skip link for operational routes, including its hydration handling.
export function SiteSkipLink() {
  const path = usePathname();
  return path === "/admin" || path.startsWith("/admin/") || path === "/employee" || path.startsWith("/employee/") ? <OperationalSkipLink /> : null;
}
