export type Permission =
  | "order.view"
  | "order.assign"
  | "order.update"
  | "order.cancel"
  | "chat.view"
  | "chat.send";
export interface AdminUser {
  id: string;
  fullName: string;
  displayName: string;
  email: string;
  role: "SUPER_ADMIN" | "STAFF";
  permissions: Permission[];
}
export interface StaffMember extends AdminUser {
  phone?: string;
  country?: string;
  timezone?: string;
  status: "ACTIVE" | "SUSPENDED";
  lastLogin: string;
  ip: string;
}
export interface StaffInvitation {
  id: string;
  email: string;
  fullName: string;
  displayName: string;
  permissions: Permission[];
  status: "PENDING" | "ACCEPTED" | "EXPIRED" | "REVOKED";
  createdAt: string;
  expiresAt: string;
  token?: string;
}
export interface SecuritySession {
  id: string;
  userId: string;
  user: string;
  email: string;
  role: string;
  ip: string;
  device: string;
  loginAt: string;
  lastActivityAt: string;
  status: "ACTIVE" | "REVOKED";
  current?: boolean;
}
export interface AuditActivity {
  id: string;
  action: string;
  description: string;
  actor: string;
  at: string;
}
export interface DashboardStats {
  updatedAt?: string;
  activeStaff: number | null;
  pendingInvitations: number | null;
}
export interface InviteStaffInput {
  email: string;
  fullName: string;
  displayName: string;
  permissions: Permission[];
}
