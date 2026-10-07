"use client";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import * as seed from "@/mock-data/admin";
import type {
  AdminUser,
  StaffMember,
  StaffInvitation,
  SecuritySession,
  AuditActivity,
} from "@/types/admin";
interface AdminState {
  user: AdminUser | null;
  staff: StaffMember[];
  invitations: StaffInvitation[];
  sessions: SecuritySession[];
  activities: AuditActivity[];
  ready: boolean;
  setReady: () => void;
}
export const useAdminStore = create<AdminState>()(
  persist(
    (set) => ({
      user: null,
      staff: seed.staff,
      invitations: seed.invitations,
      sessions: seed.sessions,
      activities: seed.activities,
      ready: false,
      setReady: () => set({ ready: true }),
    }),
    {
      name: "ascend-admin-demo-v2",
      storage: createJSONStorage(() => sessionStorage),
      skipHydration: true,
      partialize: (s) => ({
        user: s.user,
        staff: s.staff,
        invitations: s.invitations,
        sessions: s.sessions,
        activities: s.activities,
      }),
      onRehydrateStorage: () => (s) => s?.setReady(),
    },
  ),
);
