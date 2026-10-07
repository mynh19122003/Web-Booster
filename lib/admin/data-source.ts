export type DataSource = "mock" | "api";
function source(value: string | undefined): DataSource {
  if (value === undefined || value === "mock") return "mock";
  if (value === "api") return "api";
  throw new Error("Invalid Admin data source. Use mock or api.");
}
/** Explicit per-module sources. Changing a source never enables automatic fallback. */
export const dataSource = {
  auth: source(process.env.NEXT_PUBLIC_ADMIN_AUTH_SOURCE),
  staff: source(process.env.NEXT_PUBLIC_ADMIN_STAFF_SOURCE),
  dashboard: source(process.env.NEXT_PUBLIC_ADMIN_DASHBOARD_SOURCE),
  orders: source(process.env.NEXT_PUBLIC_ADMIN_ORDERS_SOURCE),
  assignments: source(process.env.NEXT_PUBLIC_ADMIN_ASSIGNMENTS_SOURCE),
  chat: source(process.env.NEXT_PUBLIC_ADMIN_CHAT_SOURCE),
  security: source(process.env.NEXT_PUBLIC_ADMIN_SECURITY_SOURCE),
  notifications: source(process.env.NEXT_PUBLIC_ADMIN_NOTIFICATIONS_SOURCE),
} as const;
export const dataSourceKey = Object.values(dataSource).join("-");
export function selectDataSource<T>(mode: DataSource, mock: T, api: T): T {
  return mode === "mock" ? mock : api;
}
