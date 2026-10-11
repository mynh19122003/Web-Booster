import { existsSync } from "node:fs";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";

const args = process.argv.slice(2);
const emailIndex = args.indexOf("--email");
const email = emailIndex >= 0 ? args[emailIndex + 1]?.trim().toLowerCase() : undefined;
if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  console.error("Usage: npm run employee:grant -- --email staff@example.com [--revoke]");
  process.exit(1);
}
const path = process.env.AUTH_DATABASE_PATH || join(process.cwd(), ".data", "auth.sqlite");
if (!existsSync(path)) {
  console.error("No authentication database found. Register an account first.");
  process.exit(1);
}
const db = new DatabaseSync(path);
try {
  const user = db.prepare("SELECT id, password_hash FROM users WHERE email = ?").get(email);
  if (!user) throw new Error("Account not found. Register the employee's account first.");
  if (!args.includes("--revoke") && !user.password_hash) throw new Error("Use an account registered with an email and password for employee sign in.");
  const columns = db.prepare("PRAGMA table_info(users)").all();
  if (!columns.some(column => column.name === "role")) {
    db.exec("ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'employee'))");
  }
  const role = args.includes("--revoke") ? "customer" : "employee";
  db.exec("BEGIN IMMEDIATE");
  db.prepare("UPDATE users SET role = ? WHERE id = ?").run(role, user.id);
  db.prepare("DELETE FROM sessions WHERE user_id = ?").run(user.id);
  db.exec("COMMIT");
  console.log(`Account ${email} now has ${role} access. Sign in again to continue.`);
} catch (error) {
  if (db.isTransaction) db.exec("ROLLBACK");
  console.error(error instanceof Error ? error.message : "Unable to update access.");
  process.exitCode = 1;
} finally { db.close(); }
