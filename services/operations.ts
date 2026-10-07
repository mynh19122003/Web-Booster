"use client";
import { unavailable } from "@/lib/api/errors";
import { useOperations } from "@/lib/admin/operations-store";
import type { OrderStatus } from "@/types/operations";
export const incomingStatuses: OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "WAITING_ASSIGNMENT",
];
export const activeStatuses: OrderStatus[] = [
  "OFFERED",
  "ACCEPTED",
  "IN_PROGRESS",
  "PAUSED",
  "DISPUTED",
];
export function workload(id: string) {
  return useOperations
    .getState()
    .orders.filter(
      (o) => o.employeeId === id && activeStatuses.includes(o.status),
    ).length;
}
export const orderService = {
  getOrders: unavailable("orders"),
  getOrder: unavailable("orders"),
  getOrderById: unavailable("orders"),
  getIncomingOrders: unavailable("orders"),
  assignStaff: unavailable("assignments"),
  reassignStaff: unavailable("assignments"),
  reviewOrder: unavailable("orders"),
  pauseOrder: unavailable("orders"),
  startOrder: unavailable("orders"),
  cancelOrder: unavailable("orders"),
  completeOrder: unavailable("orders"),
  updateProgress: unavailable("orders"),
  saveNotes: unavailable("orders"),
};
export const assignmentService = {
  getAssignments: unavailable("assignments"),
  assignStaff: unavailable("assignments"),
  createAssignment: unavailable("assignments"),
  getAvailableStaff: unavailable("staff"),
};
export const chatService = {
  getConversations: unavailable("chat"),
  getConversationMessages: unavailable("chat"),
  getMessages: unavailable("chat"),
  ensureOrderConversation: unavailable("chat"),
  sendMessage: unavailable("chat"),
  markAsRead: unavailable("chat"),
  archiveConversation: unavailable("chat"),
};
