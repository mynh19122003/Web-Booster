// UI review fixtures only; never used as an API fallback.
import type {
  AdminUser,
  StaffMember,
  StaffInvitation,
  SecuritySession,
  AuditActivity,
} from "@/types/admin";
import { mockStaffCandidates as assignmentStaff } from "./orders";
import { allPermissions } from "@/lib/admin/config";
export const mockAdminUser: AdminUser = {
  id: "owner",
  fullName: "Alex Morgan",
  displayName: "Alex",
  email: "alex@ascend.demo",
  role: "SUPER_ADMIN",
  permissions: allPermissions,
};
export const mockStaff: StaffMember[] = [
  {
    id: "s1",
    fullName: "Olivia Chen",
    displayName: "Olivia",
    email: "olivia@ascend.demo",
    role: "STAFF",
    permissions: allPermissions,
    status: "ACTIVE",
    lastLogin: "2026-10-05T08:42:00Z",
    ip: "203.0.113.24",
  },
  {
    id: "s2",
    fullName: "Marcus Reed",
    displayName: "Marcus",
    email: "marcus@ascend.demo",
    role: "STAFF",
    permissions: allPermissions.slice(0, 2),
    status: "ACTIVE",
    lastLogin: "2026-10-05T07:15:00Z",
    ip: "203.0.113.81",
  },
  {
    id: "s3",
    fullName: "Sofia Laurent",
    displayName: "Sofia",
    email: "sofia@ascend.demo",
    role: "STAFF",
    permissions: [allPermissions[0], "order.view", "chat.view"],
    status: "ACTIVE",
    lastLogin: "2026-10-04T19:30:00Z",
    ip: "198.51.100.12",
  },
  {
    id: "s4",
    fullName: "James Park",
    displayName: "James",
    email: "james@ascend.demo",
    role: "STAFF",
    permissions: [],
    status: "SUSPENDED",
    lastLogin: "2026-10-02T11:20:00Z",
    ip: "198.51.100.46",
  },
];
// Operational candidates are STAFF accounts in the same team directory.
mockStaff.push(
  ...assignmentStaff.map((s) => ({
    id: s.id,
    fullName: s.name,
    displayName: s.name,
    email: s.name.toLowerCase() + "@ascend.demo",
    role: "STAFF" as const,
    permissions: allPermissions,
    status: "ACTIVE" as const,
    lastLogin: s.lastActivity,
    ip: "127.0.0.1",
  })),
);
export const mockInvitations: StaffInvitation[] = [
  {
    id: "inv-101",
    email: "nina@ascend.demo",
    fullName: "Nina Williams",
    displayName: "Nina",
    permissions: allPermissions,
    status: "PENDING",
    createdAt: "2026-10-05T08:20:00Z",
    expiresAt: new Date(Date.now() + 86400000).toISOString(),
    token: "demo-invitation",
  },
  {
    id: "inv-102",
    email: "ethan@ascend.demo",
    fullName: "Ethan Brooks",
    displayName: "Ethan",
    permissions: [allPermissions[0]],
    status: "PENDING",
    createdAt: "2026-10-05T07:00:00Z",
    expiresAt: new Date(Date.now() + 86400000).toISOString(),
  },
  {
    id: "inv-103",
    email: "olivia@ascend.demo",
    fullName: "Olivia Chen",
    displayName: "Olivia",
    permissions: allPermissions,
    status: "ACCEPTED",
    createdAt: "2026-10-01T09:00:00Z",
    expiresAt: "2026-10-02T09:00:00Z",
  },
  {
    id: "inv-104",
    email: "ryan@ascend.demo",
    fullName: "Ryan Scott",
    displayName: "Ryan",
    permissions: [],
    status: "EXPIRED",
    createdAt: "2026-10-01T09:00:00Z",
    expiresAt: "2026-10-02T09:00:00Z",
  },
  {
    id: "inv-105",
    email: "mia@ascend.demo",
    fullName: "Mia Jones",
    displayName: "Mia",
    permissions: [],
    status: "REVOKED",
    createdAt: "2026-09-30T09:00:00Z",
    expiresAt: "2026-10-01T09:00:00Z",
  },
];
export const mockSessions: SecuritySession[] = [
  mockAdminUser,
  ...mockStaff.slice(0, 3),
].map((u, i) => ({
  id: `ses-${i}`,
  userId: u.id,
  user: u.fullName,
  email: u.email,
  role: u.role,
  ip: `203.0.113.${20 + i}`,
  device: i === 2 ? "Safari · macOS" : "Chrome · Windows",
  loginAt: "2026-10-05T07:20:00Z",
  lastActivityAt: "2026-10-05T09:42:00Z",
  status: "ACTIVE",
  current: i === 0,
}));
export const mockActivities: AuditActivity[] = [
  {
    id: "a1",
    action: "STAFF_INVITED",
    description: "Invited Nina Williams to the team",
    actor: "Alex Morgan",
    at: "2026-10-05T08:20:00Z",
  },

  {
    id: "a3",
    action: "PASSWORD_CHANGED",
    description: "Updated account password",
    actor: "Alex Morgan",
    at: "2026-10-04T10:30:00Z",
  },
  {
    id: "a4",
    action: "INVITATION_ACCEPTED",
    description: "Olivia Chen joined the staff team",
    actor: "Olivia Chen",
    at: "2026-10-01T09:30:00Z",
  },
];

export const mockLoginProfiles = [
  { role: "owner" as const, email: mockAdminUser.email },
  { role: "staff" as const, email: mockStaff[0].email },
  { role: "viewer" as const, email: mockStaff[2].email },
];
export const mockInvitationToken = "demo-invitation";
