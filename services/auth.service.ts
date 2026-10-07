"use client";
import { dataSource, selectDataSource } from "@/lib/admin/data-source";
import { unavailable } from "@/lib/api/errors";
import { mockAuthService } from "./mock/admin.service";
import { initializeReviewData } from "./mock/bootstrap";
import { useAdminStore } from "@/lib/admin/store";
import type { AuthService } from "./contracts";
const mockAuthAdapter = {
  ...mockAuthService,
  async login(...args: Parameters<typeof mockAuthService.login>) {
    await initializeReviewData();
    return mockAuthService.login(...args);
  },
  async me() {
    await initializeReviewData();
    return mockAuthService.me();
  },
} satisfies AuthService;
const apiAuthAdapter = {
  getLoginProfiles: () => [],
  getInvitationEntry: () => "/admin/accept-invitation",
  login: unavailable("auth"),
  me: unavailable("auth"),
  logout: unavailable("auth"),
  changePassword: unavailable("auth"),
  acceptInvitation: unavailable("auth"),
} satisfies typeof mockAuthAdapter;
export const authService = selectDataSource<typeof mockAuthAdapter>(
  dataSource.auth,
  mockAuthAdapter,
  apiAuthAdapter,
);
export async function initializeAdminWorkspace() {
  await initializeReviewData();
  try {
    await authService.me();
  } catch (error) {
    useAdminStore.setState({
      user: null,
      ready: true,
      authError:
        error instanceof Error ? error.message : "Dữ liệu chưa khả dụng.",
    });
  }
}
