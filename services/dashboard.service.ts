import { unavailable } from "@/lib/api/errors";
import type { DashboardService } from "./contracts";
const apiDashboardAdapter: DashboardService = {
  getStats: unavailable("dashboard"),
  getDashboard: unavailable("dashboard"),
} satisfies DashboardService;
export const dashboardService = apiDashboardAdapter;
export function getDashboardStats() {
  return { activeStaff: null, pendingInvitations: null };
}
