"use client";
import { create } from "zustand";
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
}
export const useOperations = create<OperationsState>(() => ({
  orders: [],
  employees: [],
  assignments: [],
  events: [],
  conversations: [],
  messages: [],
  notifications: [],
}));
