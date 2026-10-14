import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { mockState } from "@/lib/mock-state";

export type AuthUser = { id: string; name: string; email: string; role: "customer" | "user" | "employee" };
type StoredUser = AuthUser & { password_hash: string | null; google_sub?: string };

const users = mockState.users as Map<string, StoredUser>;
const tokenHash = (token: string) => createHash("sha256").update(token).digest("hex");
export const safeUser = (row: AuthUser): AuthUser => ({ id: row.id, name: row.name, email: row.email, role: row.role });

export function createPasswordHash(password: string) {
  const salt = randomBytes(16);
  return `${salt.toString("hex")}:${scryptSync(password, salt, 64).toString("hex")}`;
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
  const normalized = email.toLowerCase();
  if (findUserByEmail(normalized)) throw new Error("UNIQUE constraint failed: users.email");
  const user: StoredUser = { id: randomBytes(16).toString("hex"), name, email: normalized, role: "customer", password_hash: createPasswordHash(password) };
  users.set(user.id, user);
  return safeUser(user);
}
export function findUserByEmail(email: string) {
  return [...users.values()].find(user => user.email === email.toLowerCase());
}
export function createGoogleUser(name: string, email: string, googleSub: string) {
  const normalized = email.toLowerCase();
  if (findUserByEmail(normalized)) throw new Error("UNIQUE constraint failed: users.email");
  const user: StoredUser = { id: randomBytes(16).toString("hex"), name, email: normalized, role: "customer", password_hash: null, google_sub: googleSub };
  users.set(user.id, user);
  return safeUser(user);
}
export function findGoogleUser(subject: string) {
  const user = [...users.values()].find(row => row.google_sub === subject);
  return user ? safeUser(user) : undefined;
}
export function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;
  for (const [hash, session] of mockState.sessions) if (session.expiresAt <= Date.now()) mockState.sessions.delete(hash);
  mockState.sessions.set(tokenHash(token), { userId, expiresAt });
  return { token, expiresAt };
}
export function getUserForSession(token: string): AuthUser | null {
  const session = mockState.sessions.get(tokenHash(token));
  const user = session?.expiresAt && session.expiresAt > Date.now() ? users.get(session.userId) : undefined;
  return user ? safeUser(user) : null;
}
export function deleteSession(token: string) { mockState.sessions.delete(tokenHash(token)); }
function revokeOtherSessions(userId: string, token: string) {
  const current = tokenHash(token);
  for (const [hash, session] of mockState.sessions) if (session.userId === userId && hash !== current) mockState.sessions.delete(hash);
}
export function changeUserPassword(userId: string, newPassword: string, sessionToken: string) {
  if (getUserForSession(sessionToken)?.id !== userId) return "unauthorized" as const;
  const user = users.get(userId);
  if (!user?.password_hash) return "external-account" as const;
  if (verifyPassword(newPassword, user.password_hash)) return "same-password" as const;
  user.password_hash = createPasswordHash(newPassword);
  revokeOtherSessions(userId, sessionToken);
  return "saved" as const;
}

export type UserProfile = { name: string; email: string; phone: string; country: string; discord: string; avatar: string | null };
export function getUserProfile(user: AuthUser): UserProfile {
  const current = users.get(user.id) ?? user;
  return { name: current.name, email: current.email, phone: "", country: "", discord: "", avatar: null,
    ...(mockState.profiles.get(user.id) as Partial<UserProfile> | undefined) };
}
export function updateUserAvatar(user: AuthUser, avatar: string | null): UserProfile {
  mockState.profiles.set(user.id, { ...mockState.profiles.get(user.id), avatar });
  return getUserProfile(user);
}
export function updateUserProfile(user: AuthUser, profile: Omit<UserProfile, "email" | "avatar">, password?: { newPassword: string; sessionToken: string }): UserProfile {
  if (password) {
    const result = changeUserPassword(user.id, password.newPassword, password.sessionToken);
    if (result !== "saved") throw new Error(result);
  }
  const current = users.get(user.id);
  if (current) current.name = profile.name;
  mockState.profiles.set(user.id, { ...mockState.profiles.get(user.id), phone: profile.phone, country: profile.country, discord: profile.discord });
  return getUserProfile({ ...user, name: profile.name });
}
