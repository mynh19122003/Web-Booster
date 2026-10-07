"use client";
import { create } from "zustand";
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
  authError: string;
  setReady: () => void;
}
export const useAdminStore = create<AdminState>((set) => ({
  user: null,
  staff: [],
  invitations: [],
  sessions: [],
  activities: [],
  ready: false,
  authError: "",
  setReady: () => set({ ready: true }),
}));
