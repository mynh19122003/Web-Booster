import { randomBytes } from "node:crypto";
import { authDatabase, type AuthUser } from "@/lib/auth-db";
import { coaches, coachFor, type Coach } from "@/data/coaches";

export type CoachAccess = "own" | "demo" | "admin";
type OwnedCoach = { user_id: string; slug: string; profile_json: string; published: number };

function database() {
  const db = authDatabase();
  db.exec(`CREATE TABLE IF NOT EXISTS coach_access (
    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    scope TEXT NOT NULL CHECK(scope IN ('own','demo','admin'))
  );
  CREATE TABLE IF NOT EXISTS employee_coaches (
    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    slug TEXT NOT NULL UNIQUE,
    profile_json TEXT NOT NULL,
    published INTEGER NOT NULL DEFAULT 0 CHECK(published IN (0,1))
  );
  CREATE TABLE IF NOT EXISTS coach_publication (slug TEXT PRIMARY KEY, published INTEGER NOT NULL CHECK(published IN (0,1)));`);
  return db;
}

export function coachAccess(user: AuthUser): CoachAccess {
  if (user.role !== "employee") return "own";
  return (database().prepare("SELECT scope FROM coach_access WHERE user_id = ?").get(user.id) as { scope: CoachAccess } | undefined)?.scope ?? "own";
}

function rows(): OwnedCoach[] {
  return database().prepare("SELECT employee_coaches.* FROM employee_coaches JOIN users ON users.id = employee_coaches.user_id WHERE users.role = 'employee'").all() as OwnedCoach[];
}

export function coachBase(slug: string): Coach | undefined {
  const row = rows().find(row => row.slug === slug);
  return row ? JSON.parse(row.profile_json) as Coach : coachFor(slug);
}

export function coachPublished(slug: string): boolean {
  const row = database().prepare("SELECT published FROM employee_coaches WHERE slug = ?").get(slug) as { published: number } | undefined;
  if (!row) {
    const setting = database().prepare("SELECT published FROM coach_publication WHERE slug = ?").get(slug) as { published: number } | undefined;
    return Boolean(coachFor(slug)) && (setting ? Boolean(setting.published) : true);
  }
  return Boolean(row.published) && rows().some(row => row.slug === slug);
}

export function publicCoachBases(): Coach[] {
  const all = rows();
  const ownedSlugs = new Set((database().prepare("SELECT slug FROM employee_coaches").all() as { slug: string }[]).map(row => row.slug));
  return [...coaches.filter(coach => !ownedSlugs.has(coach.slug) && coachPublished(coach.slug)), ...all.filter(row => row.published).map(row => JSON.parse(row.profile_json) as Coach)];
}

export function managedCoachBases(user: AuthUser): Coach[] {
  if (user.role !== "employee") return [];
  const scope = coachAccess(user);
  const all = rows();
  if (scope === "own") return all.filter(row => row.user_id === user.id).map(row => JSON.parse(row.profile_json) as Coach);
  const ownedSlugs = new Set((database().prepare("SELECT slug FROM employee_coaches").all() as { slug: string }[]).map(row => row.slug));
  const samples = coaches.filter(coach => !ownedSlugs.has(coach.slug));
  return scope === "demo" ? samples : [...samples, ...all.map(row => JSON.parse(row.profile_json) as Coach)];
}

export function canManageCoach(user: AuthUser | null, slug: string): boolean {
  return Boolean(user && managedCoachBases(user).some(coach => coach.slug === slug));
}

export type NewCoachInput = { name: string; game: string; server: string; peakRank: string; hourlyRate: number; languages: string[]; roles: string[]; bio: string };
export function createEmployeeCoach(user: AuthUser, input: NewCoachInput): Coach | null {
  if (user.role !== "employee" || coachAccess(user) !== "own") return null;
  const slug = `coach-${randomBytes(8).toString("hex")}`;
  const coach: Coach = {
    ...input, slug, gameName: input.game === "valorant" ? "Valorant" : input.game === "teamfight-tactics" ? "Teamfight Tactics" : "League of Legends",
    online: false, isMvp: false, rating: 0, reviewCount: 0, students: 0, yearsCoaching: 0,
    sessionFormats: ["live"], bioKey: "coachBioLuna", bioOverride: input.bio, accent: "#ffa333", avatar: "/images/coaches/luna.svg",
  };
  const result = database().prepare("INSERT OR IGNORE INTO employee_coaches (user_id,slug,profile_json,published) VALUES (?,?,?,0)").run(user.id, slug, JSON.stringify(coach));
  return result.changes ? coach : null;
}

export function setCoachPublished(slug: string, published: boolean) {
  const db = database();
  const result = db.prepare("UPDATE employee_coaches SET published = ? WHERE slug = ?").run(published ? 1 : 0, slug);
  if (!result.changes && coachFor(slug)) db.prepare("INSERT INTO coach_publication VALUES (?,?) ON CONFLICT(slug) DO UPDATE SET published=excluded.published").run(slug, published ? 1 : 0);
}

export function assignableCoaches() {
  const owned = new Set((database().prepare("SELECT slug FROM employee_coaches").all() as { slug: string }[]).map(row => row.slug));
  return coaches.filter(coach => !owned.has(coach.slug));
}

export function assignCoach(userId: string, slug: string): boolean {
  const base = coachBase(slug);
  if (!base) return false;
  const db = database();
  const employee = db.prepare("SELECT id FROM users WHERE id = ? AND role = 'employee'").get(userId);
  if (!employee || db.prepare("SELECT slug FROM employee_coaches WHERE user_id = ? OR slug = ?").get(userId, slug)) return false;
  db.prepare("INSERT INTO employee_coaches (user_id,slug,profile_json,published) VALUES (?,?,?,1)").run(userId, slug, JSON.stringify(base));
  return true;
}

export function unassignedEmployees() {
  return database().prepare("SELECT id,name,email FROM users WHERE role = 'employee' AND id NOT IN (SELECT user_id FROM employee_coaches) AND id NOT IN (SELECT user_id FROM coach_access WHERE scope != 'own')").all() as { id: string; name: string; email: string }[];
}
