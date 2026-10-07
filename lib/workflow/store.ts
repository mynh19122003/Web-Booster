"use client";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  Order,
  Employee,
  OrderAssignment,
  Complaint,
  SecuritySession,
  EmployeeTransaction,
  ActivityLog,
  IssueReport,
  ChatMessage,
  Conversation,
} from "@/types/workflow";
export interface WorkflowState {
  orders: Order[];
  employees: Employee[];
  assignments: OrderAssignment[];
  conversations: Conversation[];
  messages: ChatMessage[];
  complaints: Complaint[];
  sessions: SecuritySession[];
  transactions: EmployeeTransaction[];
  activities: ActivityLog[];
  issues: IssueReport[];
  employeeId: string | null;
  employeeSessionId: string | null;
  ready: boolean;
  initialized: boolean;
}
export const useWorkflow = create<WorkflowState>()(
  persist<WorkflowState>(
    () => ({
      orders: [],
      employees: [],
      assignments: [],
      conversations: [],
      messages: [],
      complaints: [],
      sessions: [],
      transactions: [],
      activities: [],
      issues: [],
      employeeId: null,
      employeeSessionId: null,
      ready: false,
      initialized: false,
    }),
    {
      name: "ascend-order-flow-v1",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (s) => ({
        ...s,
        employeeId: null,
        employeeSessionId: null,
        ready: false,
      }),
    },
  ),
);
