"use client";

import { usePathname } from "next/navigation";

export function SkipLink() {
  const pathname = usePathname();
  const isAdmin = pathname === "/admin" || pathname.startsWith("/admin/");
  return (
    <a className="skip-link" href="#main">
      {isAdmin ? "Chuyển đến nội dung" : "Skip to content"}
    </a>
  );
}
