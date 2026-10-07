import { dataSource, selectDataSource } from "@/lib/admin/data-source";
import { unavailable } from "@/lib/api/errors";
import { getMockDashboardStats } from "./mock/admin.service";
import type { DashboardService } from "./contracts";
const mockDashboardService = {
  async getStats() {
    return getMockDashboardStats();
  },
  async getDashboard() {
    return getMockDashboardStats();
  },
} satisfies DashboardService;
const apiDashboardAdapter = {
  getStats: unavailable("dashboard"),
  getDashboard: unavailable("dashboard"),
} satisfies DashboardService;
export const dashboardService = selectDataSource<DashboardService>(
  dataSource.dashboard,
  mockDashboardService,
  apiDashboardAdapter,
);
export function getDashboardStats() {
  return dataSource.dashboard === "mock"
    ? getMockDashboardStats()
    : { activeStaff: null, pendingInvitations: null };
}
