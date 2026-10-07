"use client";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { dataSource, dataSourceKey } from "./data-source";
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
  initialized: boolean;
  authError: string;
  setReady: () => void;
}
export const useAdminStore = create<AdminState>()(
  persist(
    (set) => ({
      user: null,
      staff: [],
      invitations: [],
      sessions: [],
      activities: [],
      ready: false,
      initialized: false,
      authError: "",
      setReady: () => set({ ready: true }),
    }),
    {
      name: "ascend-admin-review-v3-" + dataSourceKey,
      storage: createJSONStorage(() => sessionStorage),
      skipHydration: true,
      partialize: (s) => ({
        user: dataSource.auth === "mock" ? s.user : null,
        staff: s.staff,
        invitations: s.invitations,
        sessions: s.sessions,
        activities: s.activities,
        initialized: s.initialized,
      }),
    },
  ),
);
