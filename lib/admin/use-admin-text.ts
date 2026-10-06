"use client";
import { usePathname } from "next/navigation";
import { adminText } from "./vi";
const originalText = (value: string) => value;
/** Shared Admin components keep their original labels outside /admin. */
export function useAdminText() {
  return usePathname().startsWith("/admin") ? adminText : originalText;
}
