"use client";
import { useAdminStore as store } from "@/lib/admin/store";
import { currentAdminUser } from "@/mock-data/admin";
import { allPermissions, strongPassword } from "@/lib/admin/config";
import type {
  Permission,
  InviteStaffInput,
  DashboardStats,
} from "@/types/admin";
const wait = () => new Promise<void>((r) => setTimeout(r, 250));
const id = () => crypto.randomUUID();
export function can(permission?: Permission) {
  const u = store.getState().user;
  return (
    !!u &&
    (u.role === "SUPER_ADMIN" ||
      (!!permission && u.permissions.includes(permission)))
  );
}
function requirePermission(permission?: Permission) {
  if (!can(permission))
    throw new Error("Your account does not have permission for this action.");
}
function audit(action: string, description: string) {
  const s = store.getState();
  store.setState({
    activities: [
      {
        id: id(),
        action,
        description,
        actor: s.user?.fullName ?? "Invited staff",
        at: new Date().toISOString(),
      },
      ...s.activities,
    ],
  });
}
export const adminAuthService = {
  async login(
    email: string,
    password: string,
    mode: "owner" | "staff" | "viewer",
  ) {
    await wait();
    if (!email.includes("@") || password.length < 8)
      throw new Error(
        "Enter a valid email and at least 8 characters for this demo.",
      );
    email = email.trim().toLowerCase();
    const matchingStaff = store.getState().staff.find((s) => s.email === email);
    if (mode !== "owner" && matchingStaff?.status === "SUSPENDED")
      throw new Error("This staff account is suspended.");
    const source =
      mode === "owner"
        ? currentAdminUser
        : (store
            .getState()
            .staff.find((s) => s.status === "ACTIVE" && s.email === email) ??
          store.getState().staff[mode === "viewer" ? 2 : 0]);
    const user = {
      ...source,
      email,
      ...(mode === "viewer"
        ? {
            permissions: [
              "order.view",
              "chat.view",
            ] as Permission[],
          }
        : {}),
    };
    const now = new Date().toISOString();
    store.setState({
      user,
      sessions: [
        {
          id: id(),
          userId: user.id,
          user: user.fullName,
          email: user.email,
          role: user.role,
          ip: "127.0.0.1",
          device: "Local demo browser",
          loginAt: now,
          lastActivityAt: now,
          status: "ACTIVE",
          current: true,
        },
        ...store
          .getState()
          .sessions.map((session) => ({ ...session, current: false })),
      ],
    });
    return user;
  },
  async logout() {
    store.setState({ user: null });
  },
  async changePassword(
    current: string,
    password: string,
    confirmation: string,
  ) {
    await wait();
    if (
      !current ||
      !strongPassword(password) ||
      password !== confirmation ||
      password === current
    )
      throw new Error(
        "Use a different, matching password with 12+ characters, upper/lowercase, a number and a symbol.",
      );
    const s = store.getState();
    audit(
      "PASSWORD_CHANGED",
      "Updated password and signed out of all sessions (demo)",
    );
    store.setState({
      sessions: s.sessions.map((x) =>
        x.userId === s.user?.id ? { ...x, status: "REVOKED" } : x,
      ),
      user: null,
    });
  },
  async acceptInvitation(
    token: string,
    password: string,
    confirmation: string,
    contact: { phone: string; country: string; timezone: string },
  ) {
    await wait();
    const s = store.getState();
    const inv = s.invitations.find((x) => x.token === token);
    if (
      !inv ||
      inv.status !== "PENDING" ||
      Date.parse(inv.expiresAt) <= Date.now()
    )
      throw new Error(
        "This invitation is invalid, expired, or has already been used.",
      );
    if (!strongPassword(password) || password !== confirmation)
      throw new Error(
        "Passwords must match and meet all password requirements.",
      );
    store.setState({
      invitations: s.invitations.map((x) =>
        x.id === inv.id ? { ...x, status: "ACCEPTED" } : x,
      ),
      staff: [
        ...s.staff,
        {
          id: id(),
          fullName: inv.fullName,
          displayName: inv.displayName,
          email: inv.email,
          permissions: inv.permissions,
          role: "STAFF",
          ...contact,
          status: "ACTIVE",
          ip: "—",
          lastLogin: "",
        },
      ],
    });
    audit("INVITATION_ACCEPTED", `${inv.fullName} accepted an invitation`);
  },
};
export const staffService = {
  async getStaffList() {
    await wait();
    requirePermission();
    return store.getState().staff;
  },
  async createStaffInvitation(input: InviteStaffInput) {
    await wait();
    requirePermission();
    const s = store.getState();
    const email = input.email.trim().toLowerCase();
    if (
      s.staff.some((x) => x.email === email) ||
      s.invitations.some((x) => x.email === email && x.status === "PENDING")
    )
      throw new Error(
        "This email already belongs to a staff member or pending invitation.",
      );
    if (input.permissions.some((p) => !allPermissions.includes(p)))
      throw new Error("Unsupported permission.");
    const invitation = {
      ...input,
      email,
      id: id(),
      token: id(),
      status: "PENDING" as const,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
    };
    store.setState({ invitations: [invitation, ...s.invitations] });
    audit("STAFF_INVITED", `Invited ${input.fullName} to the team`);
    return invitation;
  },
  async resendStaffInvitation(invitationId: string) {
    await wait();
    requirePermission();
    const s = store.getState();
    const inv = s.invitations.find((x) => x.id === invitationId);
    if (!inv || !["PENDING", "EXPIRED"].includes(inv.status))
      throw new Error("This invitation cannot be resent.");
    store.setState({
      invitations: s.invitations.map((x) =>
        x.id === invitationId
          ? {
              ...x,
              status: "PENDING",
              token: id(),
              expiresAt: new Date(Date.now() + 86400000).toISOString(),
            }
          : x,
      ),
    });
    audit("STAFF_INVITED", `Resent invitation to ${inv.fullName}`);
  },
  async revokeStaffInvitation(invitationId: string) {
    await wait();
    requirePermission();
    store.setState((s) => ({
      invitations: s.invitations.map((x) =>
        x.id === invitationId ? { ...x, status: "REVOKED" } : x,
      ),
    }));
    audit("INVITATION_REVOKED", "Revoked a pending staff invitation");
  },
  async updateStaffPermissions(userId: string, permissions: Permission[]) {
    await wait();
    requirePermission();
    if (permissions.some((p) => !allPermissions.includes(p)))
      throw new Error("Unsupported permission.");
    store.setState((s) => ({
      staff: s.staff.map((x) => (x.id === userId ? { ...x, permissions } : x)),
    }));
    audit("PERMISSIONS_UPDATED", "Updated staff access permissions");
  },
  async suspendStaff(userId: string) {
    await wait();
    requirePermission();
    store.setState((s) => ({
      staff: s.staff.map((x) =>
        x.id === userId ? { ...x, status: "SUSPENDED" } : x,
      ),
      sessions: s.sessions.map((x) =>
        x.userId === userId ? { ...x, status: "REVOKED" } : x,
      ),
    }));
    audit("STAFF_SUSPENDED", "Suspended staff access and revoked sessions");
  },
  async activateStaff(userId: string) {
    await wait();
    requirePermission();
    store.setState((s) => ({
      staff: s.staff.map((x) =>
        x.id === userId ? { ...x, status: "ACTIVE" } : x,
      ),
    }));
    audit("STAFF_ACTIVATED", "Restored staff account access");
  },
  async revokeStaffSessions(userId: string) {
    await wait();
    requirePermission();
    store.setState((s) => ({
      sessions: s.sessions.map((x) =>
        x.userId === userId ? { ...x, status: "REVOKED" } : x,
      ),
    }));
    audit("SESSIONS_REVOKED", "Revoked all staff sessions");
  },
};
export const securityService = {
  async getSecuritySessions() {
    return store.getState().sessions;
  },
  async getAuditActivities() {
    return store.getState().activities;
  },
  async revokeSession(sessionId: string) {
    await wait();
    const s = store.getState();
    const session = s.sessions.find((x) => x.id === sessionId);
    if (
      !session ||
      (!can() && session.userId !== s.user?.id) ||
      (session.userId === "owner" && session.userId !== s.user?.id)
    )
      throw new Error("This session cannot be revoked.");
    store.setState({
      sessions: s.sessions.map((x) =>
        x.id === sessionId ? { ...x, status: "REVOKED" } : x,
      ),
    });
    audit("SESSIONS_REVOKED", `Revoked ${session.user}’s session`);
    if (session.current && session.userId === s.user?.id)
      store.setState({ user: null });
  },
};
export function getDashboardStats(): DashboardStats {
  const s = store.getState();
  return {
    activeStaff: s.staff.filter((x) => x.status === "ACTIVE").length,
    pendingInvitations: s.invitations.filter((x) => x.status === "PENDING")
      .length,
  };
}
