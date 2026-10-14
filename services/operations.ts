"use client";
import { unavailable, ApiFeatureUnavailableError } from "@/lib/api/errors";
import type { OrderService, AssignmentService, ChatService } from "./contracts";
export {
  incomingStatuses,
  activeStatuses,
  workload,
} from "@/lib/admin/operations-model";
const apiOrderAdapter = {
  getOrders: unavailable("orders"),
  getOrder: unavailable("orders"),
  getOrderById: unavailable("orders"),
  getIncomingOrders: unavailable("orders"),
  assignStaff: unavailable("orders"),
  reassignStaff: unavailable("orders"),
  reviewOrder: unavailable("orders"),
  pauseOrder: unavailable("orders"),
  startOrder: unavailable("orders"),
  cancelOrder: unavailable("orders"),
  completeOrder: unavailable("orders"),
  updateProgress: unavailable("orders"),
  saveNotes: unavailable("orders"),
};
export const orderService = apiOrderAdapter satisfies OrderService;
const apiAssignmentAdapter = {
  getAssignments: unavailable("assignments"),
  getAvailableStaff: unavailable("assignments"),
  assignStaff: unavailable("assignments"),
  createAssignment: unavailable("assignments"),
  expireOffers() {
    throw new ApiFeatureUnavailableError("assignments");
  },
};
export const assignmentService = apiAssignmentAdapter satisfies AssignmentService;
const apiChatAdapter = {
  prepareAttachment: unavailable("chat"),
  getConversations: unavailable("chat"),
  getConversationMessages: unavailable("chat"),
  getMessages: unavailable("chat"),
  ensureOrderConversation: unavailable("chat"),
  sendMessage: unavailable("chat"),
  markAsRead: unavailable("chat"),
  archiveConversation: unavailable("chat"),
};
export const chatService = apiChatAdapter satisfies ChatService;
