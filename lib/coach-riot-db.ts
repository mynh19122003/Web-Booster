import { authDatabase } from "@/lib/auth-db";
import type { RiotAccount } from "@/lib/riot-types";

export type LinkedRiotAccount = RiotAccount & { puuid: string };
function database() {
  const db = authDatabase();
  db.exec(`CREATE TABLE IF NOT EXISTS coach_riot_accounts (
    slug TEXT PRIMARY KEY, game_name TEXT NOT NULL, tag_line TEXT NOT NULL,
    platform TEXT NOT NULL, puuid TEXT NOT NULL, updated_at INTEGER NOT NULL
  )`);
  return db;
}
export function coachRiotAccount(slug: string) {
  return database().prepare(`SELECT game_name AS gameName, tag_line AS tagLine,
    platform, puuid FROM coach_riot_accounts WHERE slug = ?`).get(slug) as LinkedRiotAccount | undefined;
}
export function linkCoachRiotAccount(slug: string, account: LinkedRiotAccount) {
  database().prepare(`INSERT INTO coach_riot_accounts VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(slug) DO UPDATE SET game_name=excluded.game_name, tag_line=excluded.tag_line,
    platform=excluded.platform, puuid=excluded.puuid, updated_at=excluded.updated_at`)
    .run(slug, account.gameName, account.tagLine, account.platform, account.puuid, Date.now());
}
export function unlinkCoachRiotAccount(slug: string) {
  database().prepare("DELETE FROM coach_riot_accounts WHERE slug = ?").run(slug);
}
