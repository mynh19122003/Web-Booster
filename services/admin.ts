"use client";
import { useAdminStore } from "@/lib/admin/store";
import { unavailable } from "@/lib/api/errors";
import type { Permission, DashboardStats } from "@/types/admin";
export { authService as adminAuthService } from "./auth.service";
export function can(permission?: Permission) {
  const user = useAdminStore.getState().user;
  return (
    !!user &&
    (user.role === "SUPER_ADMIN" ||
      (!!permission && user.permissions.includes(permission)))
  );
}
export const staffService = {
  getStaffList: unavailable("staff"),
  getStaffById: unavailable("staff"),
  getStaffInvitations: unavailable("staff"),
  createStaffInvitation: unavailable("staff"),
  resendStaffInvitation: unavailable("staff"),
  revokeStaffInvitation: unavailable("staff"),
  updateStaffPermissions: unavailable("staff"),
  suspendStaff: unavailable("staff"),
  activateStaff: unavailable("staff"),
  revokeStaffSessions: unavailable("staff"),
};
export const securityService = {
  getSecuritySessions: unavailable("security"),
  getAuditActivities: unavailable("security"),
  revokeSession: unavailable("security"),
};
export function getDashboardStats(): DashboardStats {
  return { activeStaff: null, pendingInvitations: null };
}
