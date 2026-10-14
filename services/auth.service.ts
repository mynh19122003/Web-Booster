"use client";
import { unavailable } from "@/lib/api/errors";
import { useAdminStore } from "@/lib/admin/store";
import type { AuthService } from "./contracts";
const apiAuthAdapter = {
  getLoginProfiles: (): { role: "owner" | "staff" | "viewer"; email: string }[] => [],
  getInvitationEntry: () => "/admin/accept-invitation",
  login: unavailable("auth"),
  me: unavailable("auth"),
  logout: unavailable("auth"),
  changePassword: unavailable("auth"),
  acceptInvitation: unavailable("auth"),
};
export const authService: AuthService & Pick<typeof apiAuthAdapter, "getLoginProfiles" | "getInvitationEntry"> = apiAuthAdapter;
export async function initializeAdminWorkspace() {
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
