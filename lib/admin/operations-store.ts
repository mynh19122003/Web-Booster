"use client";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { dataSourceKey } from "./data-source";
import type {
  Order,
  StaffCandidate,
  OrderAssignment,
  OrderProgressEvent,
  Conversation,
  ChatMessage,
  OrderNotification,
} from "@/types/operations";
interface OperationsState {
  orders: Order[];
  employees: StaffCandidate[];
  assignments: OrderAssignment[];
  events: OrderProgressEvent[];
  conversations: Conversation[];
  messages: ChatMessage[];
  notifications: OrderNotification[];
  ready: boolean;
  initialized: boolean;
}
export const useOperations = create<OperationsState>()(
  persist<OperationsState>(
    () => ({
      orders: [],
      employees: [],
      assignments: [],
      events: [],
      conversations: [],
      messages: [],
      notifications: [],
      ready: false,
      initialized: false,
    }),
    {
      name: "ascend-operations-review-v3-" + dataSourceKey,
      storage: createJSONStorage(() => sessionStorage),
      skipHydration: true,
      partialize: (s) => ({
        orders: s.orders,
        employees: s.employees,
        assignments: s.assignments,
        events: s.events,
        conversations: s.conversations,
        messages: s.messages,
        notifications: s.notifications,
        ready: false,
        initialized: s.initialized,
      }),
    },
  ),
);
