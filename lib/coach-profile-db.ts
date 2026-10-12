import { authDatabase } from "@/lib/auth-db";
import type { Coach } from "@/data/coaches";
import { coachBase, coachPublished, publicCoachBases } from "@/lib/coach-ownership";

export type CoachProfileRow = {
  slug: string;
  online: number | null;
  hourly_rate: number | null;
  is_mvp: number | null;
  bio_override: string | null;
  session_live: number | null;
  session_vod: number | null;
  avatar: string | null;
  rating: number | null;
  review_count: number | null;
  languages: string | null;
  roles: string | null;
  updated_at: number;
};

export type CoachProfileOverride = {
  slug: string;
  online: boolean | null;
  hourlyRate: number | null;
  isMvp: boolean | null;
  bioOverride: string | null;
  sessionLive: boolean | null;
  sessionVod: boolean | null;
  avatar: string | null;
  rating: number | null;
  reviewCount: number | null;
  languages: string[] | null;
  roles: string[] | null;
  updatedAt: number;
};

export type CoachProfileInput = {
  online?: boolean | null;
  hourlyRate?: number | null;
  isMvp?: boolean | null;
  bioOverride?: string | null;
  sessionLive?: boolean | null;
  sessionVod?: boolean | null;
  avatar?: string | null;
  rating?: number | null;
  reviewCount?: number | null;
  languages?: string[] | null;
  roles?: string[] | null;
};

function database() {
  const db = authDatabase();
  db.exec(`CREATE TABLE IF NOT EXISTS coach_profiles (
    slug TEXT PRIMARY KEY,
    online INTEGER,
    hourly_rate REAL,
    is_mvp INTEGER,
    bio_override TEXT,
    session_live INTEGER,
    session_vod INTEGER,
    avatar TEXT,
    rating REAL,
    review_count INTEGER,
    languages TEXT,
    roles TEXT,
    updated_at INTEGER NOT NULL
  )`);
  return db;
}

function toOverride(row: CoachProfileRow): CoachProfileOverride {
  let languages: string[] | null = null;
  let roles: string[] | null = null;
  if (row.languages) {
    try { languages = JSON.parse(row.languages); } catch { languages = null; }
  }
  if (row.roles) {
    try { roles = JSON.parse(row.roles); } catch { roles = null; }
  }
  return {
    slug: row.slug,
    online: row.online === null ? null : Boolean(row.online),
    hourlyRate: row.hourly_rate,
    isMvp: row.is_mvp === null ? null : Boolean(row.is_mvp),
    bioOverride: row.bio_override,
    sessionLive: row.session_live === null ? null : Boolean(row.session_live),
    sessionVod: row.session_vod === null ? null : Boolean(row.session_vod),
    avatar: row.avatar,
    rating: row.rating,
    reviewCount: row.review_count,
    languages,
    roles,
    updatedAt: row.updated_at,
  };
}

export function coachProfileOverride(slug: string): CoachProfileOverride | null {
  const row = database().prepare("SELECT * FROM coach_profiles WHERE slug = ?").get(slug) as CoachProfileRow | undefined;
  return row ? toOverride(row) : null;
}

export function allCoachProfileOverrides(): Record<string, CoachProfileOverride> {
  const rows = database().prepare("SELECT * FROM coach_profiles").all() as CoachProfileRow[];
  const map: Record<string, CoachProfileOverride> = {};
  for (const row of rows) {
    map[row.slug] = toOverride(row);
  }
  return map;
}

export function saveCoachProfile(slug: string, input: CoachProfileInput): CoachProfileOverride {
  const existing = coachProfileOverride(slug);
  const online = input.online !== undefined ? (input.online === null ? null : input.online ? 1 : 0) : (existing?.online === null || existing?.online === undefined ? null : existing.online ? 1 : 0);
  const hourlyRate = input.hourlyRate !== undefined ? input.hourlyRate : (existing?.hourlyRate ?? null);
  const isMvp = input.isMvp !== undefined ? (input.isMvp === null ? null : input.isMvp ? 1 : 0) : (existing?.isMvp === null || existing?.isMvp === undefined ? null : existing.isMvp ? 1 : 0);
  const bioOverride = input.bioOverride !== undefined ? input.bioOverride : (existing?.bioOverride ?? null);
  const sessionLive = input.sessionLive !== undefined ? (input.sessionLive === null ? null : input.sessionLive ? 1 : 0) : (existing?.sessionLive === null || existing?.sessionLive === undefined ? null : existing.sessionLive ? 1 : 0);
  const sessionVod = input.sessionVod !== undefined ? (input.sessionVod === null ? null : input.sessionVod ? 1 : 0) : (existing?.sessionVod === null || existing?.sessionVod === undefined ? null : existing.sessionVod ? 1 : 0);
  const avatar = input.avatar !== undefined ? input.avatar : (existing?.avatar ?? null);
  const rating = input.rating !== undefined ? input.rating : (existing?.rating ?? null);
  const reviewCount = input.reviewCount !== undefined ? input.reviewCount : (existing?.reviewCount ?? null);
  const languages = input.languages !== undefined ? (input.languages ? JSON.stringify(input.languages) : null) : (existing?.languages ? JSON.stringify(existing.languages) : null);
  const roles = input.roles !== undefined ? (input.roles ? JSON.stringify(input.roles) : null) : (existing?.roles ? JSON.stringify(existing.roles) : null);
  const updatedAt = Date.now();

  database().prepare(`
    INSERT INTO coach_profiles (
      slug, online, hourly_rate, is_mvp, bio_override, session_live, session_vod,
      avatar, rating, review_count, languages, roles, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(slug) DO UPDATE SET
      online = excluded.online,
      hourly_rate = excluded.hourly_rate,
      is_mvp = excluded.is_mvp,
      bio_override = excluded.bio_override,
      session_live = excluded.session_live,
      session_vod = excluded.session_vod,
      avatar = excluded.avatar,
      rating = excluded.rating,
      review_count = excluded.review_count,
      languages = excluded.languages,
      roles = excluded.roles,
      updated_at = excluded.updated_at
  `).run(
    slug, online, hourlyRate, isMvp, bioOverride, sessionLive, sessionVod,
    avatar, rating, reviewCount, languages, roles, updatedAt
  );

  return coachProfileOverride(slug)!;
}

export function resetCoachProfile(slug: string): void {
  database().prepare("DELETE FROM coach_profiles WHERE slug = ?").run(slug);
}

export function applyCoachOverride(coach: Coach, override?: CoachProfileOverride | null): Coach {
  if (!override) return coach;
  const live = override.sessionLive !== null ? override.sessionLive : coach.sessionFormats.includes("live");
  const vod = override.sessionVod !== null ? override.sessionVod : coach.sessionFormats.includes("vod");
  const sessionFormats: ("live" | "vod")[] = [];
  if (live) sessionFormats.push("live");
  if (vod) sessionFormats.push("vod");

  return {
    ...coach,
    online: override.online !== null ? override.online : coach.online,
    hourlyRate: override.hourlyRate !== null ? override.hourlyRate : coach.hourlyRate,
    isMvp: override.isMvp !== null ? override.isMvp : coach.isMvp,
    bioOverride: override.bioOverride !== null ? override.bioOverride : coach.bioOverride,
    avatar: override.avatar !== null ? override.avatar : coach.avatar,
    rating: override.rating !== null ? override.rating : coach.rating,
    reviewCount: override.reviewCount !== null ? override.reviewCount : coach.reviewCount,
    languages: override.languages !== null ? override.languages : coach.languages,
    roles: override.roles !== null ? override.roles : coach.roles,
    sessionFormats: sessionFormats.length > 0 ? sessionFormats : coach.sessionFormats,
  };
}

export function getCoachWithOverride(slug: string): Coach | undefined {
  const base = coachBase(slug);
  if (!base || !coachPublished(slug)) return undefined;
  const override = coachProfileOverride(slug);
  return applyCoachOverride(base, override);
}

export function getAllCoachesWithOverrides(): Coach[] {
  const overrides = allCoachProfileOverrides();
  return publicCoachBases().map(coach => applyCoachOverride(coach, overrides[coach.slug]));
}
