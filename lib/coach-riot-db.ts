import { mockState } from "@/lib/mock-state";
import type { RiotAccount } from "@/lib/riot-types";

export type LinkedRiotAccount = RiotAccount & { puuid: string };
export function coachRiotAccount(slug: string) {
  return mockState.coachRiotAccounts.get(slug) as LinkedRiotAccount | undefined;
}
export function linkCoachRiotAccount(slug: string, account: LinkedRiotAccount) {
  mockState.coachRiotAccounts.set(slug, structuredClone(account));
}
export function unlinkCoachRiotAccount(slug: string) {
  mockState.coachRiotAccounts.delete(slug);
}
