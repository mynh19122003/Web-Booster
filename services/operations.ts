"use client";
import { dataSource, selectDataSource } from "@/lib/admin/data-source";
import { unavailable, ApiFeatureUnavailableError } from "@/lib/api/errors";
import {
  mockOrderService,
  mockAssignmentService,
  mockChatService,
} from "./mock/operations.service";
import type { OrderService, AssignmentService, ChatService } from "./contracts";
export {
  incomingStatuses,
  activeStatuses,
  workload,
} from "@/lib/admin/operations-model";
const mockOrderAdapter = {
  ...mockOrderService,
  getOrderById: mockOrderService.getOrder,
  assignStaff:
    dataSource.assignments === "mock"
      ? mockOrderService.assignStaff
      : unavailable("assignments"),
  reassignStaff:
    dataSource.assignments === "mock"
      ? mockOrderService.reassignStaff
      : unavailable("assignments"),
};
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
export const orderService = selectDataSource<typeof mockOrderAdapter>(
  dataSource.orders,
  mockOrderAdapter,
  apiOrderAdapter,
) satisfies OrderService;
const mockAssignmentAdapter = {
  ...mockAssignmentService,
  assignStaff: mockOrderService.assignStaff,
};
const apiAssignmentAdapter = {
  getAssignments: unavailable("assignments"),
  getAvailableStaff: unavailable("assignments"),
  assignStaff: unavailable("assignments"),
  createAssignment: unavailable("assignments"),
  expireOffers() {
    throw new ApiFeatureUnavailableError("assignments");
  },
};
export const assignmentService = selectDataSource<typeof mockAssignmentAdapter>(
  dataSource.assignments,
  mockAssignmentAdapter,
  apiAssignmentAdapter,
) satisfies AssignmentService;
const mockChatAdapter = {
  ...mockChatService,
  getMessages: mockChatService.getConversationMessages,
};
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
export const chatService = selectDataSource<typeof mockChatAdapter>(
  dataSource.chat,
  mockChatAdapter,
  apiChatAdapter,
) satisfies ChatService;
