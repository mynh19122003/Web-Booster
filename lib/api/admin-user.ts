import type { AdminUser, Permission } from "@/types/admin";
export interface BackendAdminUser {
  id: number | string;
  email: string;
  full_name: string | null;
  display_name: string | null;
  role: string;
  status: string;
  permissions: Permission[];
  must_change_password: boolean;
}
export function toAdminUser(raw: BackendAdminUser): AdminUser {
  if (
    raw.status !== "ACTIVE" ||
    (raw.role !== "SUPER_ADMIN" && raw.role !== "STAFF")
  )
    throw new Error("Bạn không có quyền truy cập.");
  if (
    !raw.id ||
    typeof raw.email !== "string" ||
    !raw.email ||
    !Array.isArray(raw.permissions) ||
    raw.permissions.some((permission) => typeof permission !== "string") ||
    (raw.full_name !== null && typeof raw.full_name !== "string") ||
    (raw.display_name !== null && typeof raw.display_name !== "string")
  )
    throw new Error("Phản hồi tài khoản không hợp lệ.");
  return {
    id: String(raw.id),
    email: raw.email,
    fullName: raw.full_name ?? "",
    displayName: raw.display_name ?? raw.full_name ?? raw.email,
    role: raw.role,
    permissions: raw.permissions,
  };
}
