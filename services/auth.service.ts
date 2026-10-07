"use client";
import { apiRequest, ApiError } from "@/lib/api/client";
import { adminEndpoints } from "@/lib/api/endpoints";
import { useAdminStore } from "@/lib/admin/store";
import { useOperations } from "@/lib/admin/operations-store";
import type { AdminUser } from "@/types/admin";
import type { AuthService } from "./contracts";
function clear() {
  useAdminStore.setState({
    user: null,
    staff: [],
    invitations: [],
    sessions: [],
    activities: [],
    ready: true,
  });
  useOperations.setState({
    orders: [],
    employees: [],
    assignments: [],
    events: [],
    conversations: [],
    messages: [],
    notifications: [],
  });
}
const post = (body: unknown) => ({
  method: "POST",
  body: JSON.stringify(body),
});
export const authService = {
  async login(email: string, password: string) {
    const user = await apiRequest<AdminUser>(
      adminEndpoints.login,
      post({ email: email.trim(), password }),
    );
    useAdminStore.setState({ user, ready: true, authError: "" });
    return user;
  },
  async me() {
    try {
      const user = await apiRequest<AdminUser>(adminEndpoints.me);
      useAdminStore.setState({ user, ready: true, authError: "" });
      return user;
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        clear();
        return null;
      }
      clear();
      useAdminStore.setState({
        authError:
          error instanceof Error ? error.message : "Không thể tải tài khoản.",
      });
      throw error;
    }
  },
  async logout() {
    await apiRequest(adminEndpoints.logout, post({}));
    clear();
  },
  async changePassword(
    current: string,
    password: string,
    confirmation: string,
  ) {
    await apiRequest(
      adminEndpoints.changePassword,
      post({
        current_password: current,
        password,
        password_confirmation: confirmation,
      }),
    );
    clear();
  },
  async acceptInvitation(
    token: string,
    password: string,
    confirmation: string,
    contact: { phone: string; country: string; timezone: string },
  ) {
    await apiRequest(
      adminEndpoints.acceptInvitation,
      post({
        token,
        password,
        password_confirmation: confirmation,
        ...contact,
        phone: contact.phone || null,
      }),
    );
  },
} satisfies AuthService;
