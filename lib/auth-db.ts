import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { DatabaseSync } from "node:sqlite";

declare global {
  var ascendAuthDatabase: DatabaseSync | undefined;
}

export type AuthUser = { id: string; name: string; email: string };

function database() {
  if (globalThis.ascendAuthDatabase) return globalThis.ascendAuthDatabase;
  const path = process.env.AUTH_DATABASE_PATH || join(process.cwd(), ".data", "auth.sqlite");
  mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec(`
    PRAGMA foreign_keys = ON;
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL COLLATE NOCASE UNIQUE,
      password_hash TEXT,
      google_sub TEXT UNIQUE,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at INTEGER NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS sessions_expiry ON sessions(expires_at);
  `);
  globalThis.ascendAuthDatabase = db;
  return db;
}

const tokenHash = (token: string) => createHash("sha256").update(token).digest("hex");
const safeUser = (row: { id: string; name: string; email: string }): AuthUser => ({
  id: row.id,
  name: row.name,
  email: row.email,
});

export function createPasswordHash(password: string) {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 64);
  return `${salt.toString("hex")}:${hash.toString("hex")}`;
}

export function verifyPassword(password: string, stored: string | null) {
  if (!stored) return false;
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  const actual = scryptSync(password, Buffer.from(saltHex, "hex"), expected.length);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export function createUser(name: string, email: string, password: string) {
  const id = randomBytes(16).toString("hex");
  database().prepare(
    "INSERT INTO users (id, name, email, password_hash, created_at) VALUES (?, ?, ?, ?, ?)",
  ).run(id, name, email.toLowerCase(), createPasswordHash(password), new Date().toISOString());
  return { id, name, email: email.toLowerCase() } satisfies AuthUser;
}

export function findUserByEmail(email: string) {
  const row = database().prepare(
    "SELECT id, name, email, password_hash FROM users WHERE email = ?",
  ).get(email.toLowerCase()) as ({ id: string; name: string; email: string; password_hash: string | null }) | undefined;
  return row;
}

export function createGoogleUser(name: string, email: string, googleSub: string) {
  const id = randomBytes(16).toString("hex");
  database().prepare(
    "INSERT INTO users (id, name, email, google_sub, created_at) VALUES (?, ?, ?, ?, ?)",
  ).run(id, name, email.toLowerCase(), googleSub, new Date().toISOString());
  return { id, name, email: email.toLowerCase() } satisfies AuthUser;
}

export function findGoogleUser(subject: string) {
  const row = database().prepare(
    "SELECT id, name, email FROM users WHERE google_sub = ?",
  ).get(subject) as AuthUser | undefined;
  return row;
}

export function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;
  const db = database();
  db.prepare("DELETE FROM sessions WHERE expires_at <= ?").run(Date.now());
  db.prepare("INSERT INTO sessions (token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)")
    .run(tokenHash(token), userId, expiresAt, new Date().toISOString());
  return { token, expiresAt };
}

export function getUserForSession(token: string): AuthUser | null {
  const row = database().prepare(`
    SELECT users.id, users.name, users.email
    FROM sessions JOIN users ON users.id = sessions.user_id
    WHERE sessions.token_hash = ? AND sessions.expires_at > ?
  `).get(tokenHash(token), Date.now()) as AuthUser | undefined;
  return row ? safeUser(row) : null;
}

export function deleteSession(token: string) {
  database().prepare("DELETE FROM sessions WHERE token_hash = ?").run(tokenHash(token));
}
