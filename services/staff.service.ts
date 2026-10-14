"use client";
import { unavailable } from "@/lib/api/errors";
import type { StaffService } from "./contracts";
const apiStaffAdapter = {
  getStaff: unavailable("staff"),
  getStaffList: unavailable("staff"),
  getStaffById: unavailable("staff"),
  getStaffInvitations: unavailable("staff"),
  inviteStaff: unavailable("staff"),
  createStaffInvitation: unavailable("staff"),
  resendStaffInvitation: unavailable("staff"),
  revokeStaffInvitation: unavailable("staff"),
  updatePermissions: unavailable("staff"),
  updateStaffPermissions: unavailable("staff"),
  activateStaff: unavailable("staff"),
  suspendStaff: unavailable("staff"),
  revokeStaffSessions: unavailable("staff"),
};
export const staffService: StaffService & typeof apiStaffAdapter = apiStaffAdapter;
