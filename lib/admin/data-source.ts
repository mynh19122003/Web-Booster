export type DataSource = "api";
function source(value: string | undefined): DataSource {
  if (value === undefined || value === "api") return "api";
  throw new Error("Invalid Admin data source. Use api.");
}
/** Admin adapters accept only API data. */
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
