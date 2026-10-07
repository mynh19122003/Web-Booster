"use client";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { orders, employees, ago } from "@/mock-data/orders";
import { assignments, progressEvents } from "@/mock-data/orderAssignments";
import { conversations } from "@/mock-data/conversations";
import { messages } from "@/mock-data/messages";
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
  setReady: () => void;
}
export const useOperations = create<OperationsState>()(
  persist(
    (set) => ({
      orders,
      employees,
      assignments,
      events: progressEvents,
      conversations,
      messages,
      notifications: [
        {
          id: "n1",
          title: "New order",
          detail: "#ASC-1049 was submitted",
          href: "/admin/orders/ASC-1049",
          at: ago(3),
          scope: "order.view",
        },
        {
          id: "n2",
          title: "New message",
          detail: "Mynh Dat asked for an update",
          href: "/admin/chat?order=ASC-1042",
          at: ago(2),
          scope: "chat.view",
        },
        {
          id: "n3",
          title: "Employee accepted order",
          detail: "Zen accepted #ASC-1041",
          href: "/admin/orders/ASC-1041",
          at: ago(15),
          scope: "order.view",
        },
        {
          id: "n4",
          title: "Employee declined order",
          detail: "Nova declined #ASC-1043",
          href: "/admin/orders/ASC-1043",
          at: ago(27),
          scope: "order.view",
        },
        {
          id: "n5",
          title: "Order completed",
          detail: "#ASC-1039 is complete",
          href: "/admin/orders/ASC-1039",
          at: ago(60),
          scope: "order.view",
        },
      ],
      ready: false,
      setReady: () => set({ ready: true }),
    }),
    {
      name: "ascend-operations-demo-v2",
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
      }),
      onRehydrateStorage: () => (state) => state?.setReady(),
    },
  ),
);
