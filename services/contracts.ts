import type {
  AdminUser,
  DashboardStats,
  InviteStaffInput,
  Permission,
  StaffInvitation,
  StaffMember,
  SecuritySession,
  AuditActivity,
} from "@/types/admin";
import type {
  Conversation,
  Order,
  OrderAssignment,
  ChatMessage,
  StaffCandidate,
} from "@/types/operations";

export interface AuthService {
  login(email: string, password: string): Promise<AdminUser>;
  me(): Promise<AdminUser | null>;
  logout(): Promise<void>;
  acceptInvitation(
    token: string,
    password: string,
    confirmation: string,
    contact: { phone: string; country: string; timezone: string },
  ): Promise<void>;
  changePassword(
    current: string,
    password: string,
    confirmation: string,
  ): Promise<void>;
}
export interface StaffService {
  getStaff(): Promise<StaffMember[]>;
  getStaffById(id: string): Promise<StaffMember | undefined>;
  getStaffInvitations(): Promise<StaffInvitation[]>;
  inviteStaff(input: InviteStaffInput): Promise<StaffInvitation>;
  updatePermissions(id: string, permissions: Permission[]): Promise<void>;
  updateStaffPermissions(id: string, permissions: Permission[]): Promise<void>;
  suspendStaff(id: string): Promise<void>;
  activateStaff(id: string): Promise<void>;
  revokeStaffSessions(id: string): Promise<void>;
}
export interface OrderService {
  getOrders(): Promise<Order[]>;
  getOrder(id: string): Promise<Order>;
  getOrderById(id: string): Promise<Order>;
  getIncomingOrders(): Promise<Order[]>;
  assignStaff(id: string, staffId: string): Promise<OrderAssignment>;
  reassignStaff(id: string, staffId: string): Promise<OrderAssignment>;
}
export interface AssignmentService {
  getAssignments(): Promise<OrderAssignment[]>;
  getAvailableStaff(): Promise<StaffCandidate[]>;
  assignStaff(id: string, staffId: string): Promise<OrderAssignment>;
}
export interface DashboardService {
  getStats(): Promise<DashboardStats>;
  getDashboard(): Promise<DashboardStats>;
}
export interface ChatService {
  getConversations(): Promise<Conversation[]>;
  getConversationMessages(
    id: string,
    channel: ChatMessage["channel"],
  ): Promise<ChatMessage[]>;
  getMessages(
    id: string,
    channel: ChatMessage["channel"],
  ): Promise<ChatMessage[]>;
  sendMessage(
    id: string,
    body: string,
    channel: ChatMessage["channel"],
    attachment?: ChatMessage["attachment"],
  ): Promise<ChatMessage>;
}
export interface SecurityService {
  getSecuritySessions(): Promise<SecuritySession[]>;
  getAuditActivities(): Promise<AuditActivity[]>;
  revokeSession(id: string): Promise<void>;
}
