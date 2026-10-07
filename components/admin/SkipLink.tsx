"use client";

import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

export function SkipLink() {
  const pathname = usePathname();
  // A root 404 is prerendered without the requested admin pathname.
  const hydrated = useSyncExternalStore(subscribe, () => true, () => false);
  const isAdmin = hydrated && (pathname === "/admin" || pathname.startsWith("/admin/"));
  return (
    <a className="skip-link" href="#main">
      {isAdmin ? "Chuyển đến nội dung" : "Skip to content"}
    </a>
  );
}
