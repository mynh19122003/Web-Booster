import { unavailable } from "@/lib/api/errors";
import type { DashboardService } from "./contracts";
export const dashboardService = {
  getStats: unavailable("dashboard"),
  getDashboard: unavailable("dashboard"),
} satisfies DashboardService;
