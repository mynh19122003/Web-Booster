import { DatabaseSync } from "node:sqlite";
import { join } from "node:path";

const args = process.argv.slice(2);
const value = key => args.includes(key) ? args[args.indexOf(key) + 1] : undefined;
const email = value("--email")?.trim().toLowerCase();
const scope = value("--scope");
if (!email || !["own", "demo", "admin"].includes(scope)) {
  console.error("Usage: npm run coach:access -- --email staff@example.com --scope own|demo|admin");
  process.exit(1);
}
const db = new DatabaseSync(process.env.AUTH_DATABASE_PATH || join(process.cwd(), ".data", "auth.sqlite"));
try {
  const user = db.prepare("SELECT id FROM users WHERE email = ? AND role = 'employee'").get(email);
  if (!user) throw new Error("Employee account not found. Grant employee access first.");
  db.exec(`PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS coach_access (user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE, scope TEXT NOT NULL CHECK(scope IN ('own','demo','admin')));`);
  db.prepare("INSERT INTO coach_access (user_id,scope) VALUES (?,?) ON CONFLICT(user_id) DO UPDATE SET scope=excluded.scope").run(user.id, scope);
  console.log(`Coach access updated: ${email} → ${scope}`);
} catch (error) {
  console.error(error instanceof Error ? error.message : "Could not update access."); process.exitCode = 1;
} finally { db.close(); }
