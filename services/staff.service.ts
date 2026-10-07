import { staffService as adapter } from "./admin";
import type { StaffService } from "./contracts";
export const staffService = {
  ...adapter,
  getStaff: adapter.getStaffList,
  updatePermissions: adapter.updateStaffPermissions,
  inviteStaff: adapter.createStaffInvitation,
} satisfies StaffService;
