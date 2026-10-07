"use client";
import { staffService as mock, can } from "./admin";
import { useAdminStore } from "@/lib/admin/store";
import type { StaffService } from "./contracts";
export const staffService = {
  ...mock,
  getStaff: mock.getStaffList,
  async getStaffById(id: string) { return (await mock.getStaffList()).find(s => s.id === id); },
  async getStaffInvitations() {
    if (!can()) throw new Error("Your account does not have permission for this action.");
    return useAdminStore.getState().invitations;
  },
  inviteStaff: mock.createStaffInvitation,
} satisfies StaffService;
