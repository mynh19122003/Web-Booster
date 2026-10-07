"use client";
import { dataSource, selectDataSource } from "@/lib/admin/data-source";
import { unavailable } from "@/lib/api/errors";
import { mockStaffService, can } from "./mock/admin.service";
import { useAdminStore } from "@/lib/admin/store";
import type { StaffService } from "./contracts";
const mockStaffAdapter = {
  ...mockStaffService,
  getStaff: mockStaffService.getStaffList,
  async getStaffById(id: string) {
    return (await mockStaffService.getStaffList()).find((s) => s.id === id);
  },
  async getStaffInvitations() {
    if (!can()) throw new Error("Bạn không có quyền truy cập.");
    return useAdminStore.getState().invitations;
  },
  inviteStaff: mockStaffService.createStaffInvitation,
  updatePermissions: mockStaffService.updateStaffPermissions,
} satisfies StaffService;
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
} satisfies typeof mockStaffAdapter;
export const staffService = selectDataSource<typeof mockStaffAdapter>(
  dataSource.staff,
  mockStaffAdapter,
  apiStaffAdapter,
);
