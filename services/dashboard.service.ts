"use client";
import { getDashboardStats } from "./admin";
import type { DashboardService } from "./contracts";
export const dashboardService = {
  async getStats() { return getDashboardStats(); },
} satisfies DashboardService;
