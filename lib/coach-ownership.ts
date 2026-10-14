import { randomBytes } from "node:crypto";
import type { AuthUser } from "@/lib/auth-db";
import { mockState } from "@/lib/mock-state";
import { coaches, coachFor, type Coach } from "@/data/coaches";

export type CoachAccess = "own" | "demo" | "admin";
type Owned = { userId: string; slug: string; profile: Coach; published: boolean };
const owned = mockState.employeeCoaches as Map<string, Owned>;
const rows = () => [...owned.values()].filter(row => mockState.users.get(row.userId)?.role === "employee");

export function coachAccess(user: AuthUser): CoachAccess {
  return user.role === "employee" ? mockState.coachAccess.get(user.id) ?? "own" : "own";
}
export function coachBase(slug: string): Coach | undefined {
  return rows().find(row => row.slug === slug)?.profile ?? coachFor(slug);
}
export function coachPublished(slug: string): boolean {
  const row = rows().find(row => row.slug === slug);
  if (row) return row.published;
  return false;
}
export function publicCoachBases(): Coach[] {
  const slugs = new Set(rows().map(row => row.slug));
  return [...coaches.filter(coach => !slugs.has(coach.slug) && coachPublished(coach.slug)),
    ...rows().filter(row => row.published).map(row => row.profile)];
}
export function managedCoachBases(user: AuthUser): Coach[] {
  if (user.role !== "employee") return [];
  const scope = coachAccess(user);
  if (scope === "own") return rows().filter(row => row.userId === user.id).map(row => row.profile);
  const slugs = new Set(rows().map(row => row.slug));
  const samples = coaches.filter(coach => !slugs.has(coach.slug));
  return scope === "demo" ? samples : [...samples, ...rows().map(row => row.profile)];
}
export function canManageCoach(user: AuthUser | null, slug: string): boolean {
  return Boolean(user && managedCoachBases(user).some(coach => coach.slug === slug));
}
export type NewCoachInput = { name: string; game: string; server: string; peakRank: string; hourlyRate: number; languages: string[]; roles: string[]; bio: string };
export function createEmployeeCoach(user: AuthUser, input: NewCoachInput): Coach | null {
  if (user.role !== "employee" || coachAccess(user) !== "own" || owned.has(user.id)) return null;
  const slug = `coach-${randomBytes(8).toString("hex")}`;
  const coach: Coach = {
    ...input, slug, gameName: input.game === "valorant" ? "Valorant" : input.game === "teamfight-tactics" ? "Teamfight Tactics" : "League of Legends",
    online: false, isMvp: false, rating: 0, reviewCount: 0, students: 0, yearsCoaching: 0,
    sessionFormats: ["live"], bioKey: "coachBioLuna", bioOverride: input.bio, accent: "#ffa333", avatar: "/images/coaches/luna.svg",
  };
  owned.set(user.id, { userId: user.id, slug, profile: coach, published: false });
  return coach;
}
export function setCoachPublished(slug: string, published: boolean) {
  const row = rows().find(row => row.slug === slug);
  if (row) row.published = published;
  else if (coachFor(slug)) mockState.coachPublication.set(slug, published);
}
export function assignableCoaches() {
  const slugs = new Set(rows().map(row => row.slug));
  return coaches.filter(coach => !slugs.has(coach.slug));
}
export function assignCoach(userId: string, slug: string): boolean {
  const base = coachBase(slug);
  if (!base || mockState.users.get(userId)?.role !== "employee" || owned.has(userId) || rows().some(row => row.slug === slug)) return false;
  owned.set(userId, { userId, slug, profile: base, published: true });
  return true;
}
export function unassignedEmployees() {
  return [...mockState.users.values()].filter(user => user.role === "employee" && !owned.has(String(user.id)) && (mockState.coachAccess.get(String(user.id)) ?? "own") === "own")
    .map(user => ({ id: String(user.id), name: String(user.name), email: String(user.email) }));
}
