"use client";
export { authService as adminAuthService } from "./auth.service";
export { staffService } from "./staff.service";
export { securityService } from "./security.service";
export { getDashboardStats } from "./dashboard.service";
import { useAdminStore } from "@/lib/admin/store";
import type { Permission } from "@/types/admin";
export function can(permission?: Permission) {
  const user = useAdminStore.getState().user;
  return Boolean(user && (user.role === "SUPER_ADMIN" || (permission && user.permissions.includes(permission))));
}
