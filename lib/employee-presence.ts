import { authDatabase } from "@/lib/auth-db";

export function employeePresenceDatabase() {
  const db = authDatabase();
  db.exec(`CREATE TABLE IF NOT EXISTS employee_presence (
    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    is_online INTEGER NOT NULL DEFAULT 0 CHECK(is_online IN (0,1)),
    updated_at INTEGER NOT NULL
  )`);
  return db;
}
export function storedEmployeePresence(userId: string): boolean | null {
  const row = employeePresenceDatabase().prepare("SELECT is_online FROM employee_presence WHERE user_id = ?").get(userId) as { is_online: number } | undefined;
  return row ? Boolean(row.is_online) : null;
}
export function saveEmployeePresence(userId: string, online: boolean) {
  employeePresenceDatabase().prepare(`INSERT INTO employee_presence VALUES (?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET is_online=excluded.is_online, updated_at=excluded.updated_at`)
    .run(userId, online ? 1 : 0, Date.now());
}
