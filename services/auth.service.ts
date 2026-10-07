"use client";
import { adminAuthService } from "./admin";
import { useAdminStore } from "@/lib/admin/store";
import type { AuthService } from "./contracts";
export const authService = {
  ...adminAuthService,
  async me() { return useAdminStore.getState().user; },
} satisfies AuthService;
