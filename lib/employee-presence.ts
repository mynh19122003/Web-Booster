import { mockState } from "@/lib/mock-state";

export function storedEmployeePresence(userId: string): boolean | null {
  return mockState.presence.get(userId) ?? null;
}
export function saveEmployeePresence(userId: string, online: boolean) {
  mockState.presence.set(userId, online);
}
