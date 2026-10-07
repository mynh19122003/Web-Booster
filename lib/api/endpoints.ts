/** Verified read-only against backend/routes/api.php. No orders/chat/dashboard URLs are registered. */
export const backendEndpoints = {
  auth: {
    login: "/auth/login",
    me: "/auth/me",
    logout: "/auth/logout",
    changePassword: "/auth/change-password",
    acceptInvitation: "/auth/staff/accept-invitation",
  },
  staff: {
    list: "/admin/staff",
    detail: (id: string) => `/admin/staff/${encodeURIComponent(id)}`,
    invitations: "/admin/staff/invitations",
    permissions: (id: string) =>
      `/admin/staff/${encodeURIComponent(id)}/permissions`,
    activate: (id: string) => `/admin/staff/${encodeURIComponent(id)}/activate`,
    suspend: (id: string) => `/admin/staff/${encodeURIComponent(id)}/suspend`,
    revokeSessions: (id: string) =>
      `/admin/staff/${encodeURIComponent(id)}/revoke-sessions`,
    resendInvitation: (id: string) =>
      `/admin/staff/invitations/${encodeURIComponent(id)}/resend`,
    revokeInvitation: (id: string) =>
      `/admin/staff/invitations/${encodeURIComponent(id)}`,
  },
} as const;
export const adminEndpoints = {
  login: "/auth/login",
  me: "/auth/me",
  logout: "/auth/logout",
  changePassword: "/auth/change-password",
  acceptInvitation: "/auth/accept-invitation",
} as const;
// Endpoint registry is preparation only; no Admin API adapter is connected.
