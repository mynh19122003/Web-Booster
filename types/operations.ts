export const orderStatuses = [
  "PENDING",
  "CONFIRMED",
  "WAITING_ASSIGNMENT",
  "OFFERED",
  "ACCEPTED",
  "IN_PROGRESS",
  "PAUSED",
  "COMPLETED",
  "CANCELLED",
  "DISPUTED",
  "REFUNDED",
] as const;
export type OrderStatus = (typeof orderStatuses)[number];
export type Game = "League of Legends" | "Valorant" | "Teamfight Tactics";
export interface Customer {
  id: string;
  name: string;
  email: string;
  country: string;
  timezone: string;
}
export interface Order {
  id: string;
  customer: Customer;
  game: Game;
  service: "Rank Boost" | "Coaching" | "Placement Matches";
  riotId: string;
  region: string;
  currentRank: string;
  targetRank: string;
  currentLP: number;
  milestones: string[];
  queue: string;
  options: string[];
  priority: "Standard" | "Priority";
  status: OrderStatus;
  progress: number;
  amount: number;
  createdAt: string;
  deadline: string;
  employeeId?: string;
  instructions: string;
  adminNotes: string;
  employeeNotes: string;
}
export interface EmployeeCandidate {
  id: string;
  name: string;
  type: "BOOSTER" | "COACH";
  games: Game[];
  rank: string;
  online: boolean;
  maxActiveOrders: number;
  successRate: number;
  averageHours: number;
  lastActivity: string;
}
export type AssignmentStatus =
  "OFFERED" | "ACCEPTED" | "DECLINED" | "REPLACED" | "EXPIRED" | "CANCELLED";
export interface OrderAssignment {
  id: string;
  orderId: string;
  employeeId: string;
  status: AssignmentStatus;
  offeredAt: string;
  expiresAt: string;
  respondedAt?: string;
  reason?: string;
}
export interface OrderProgressEvent {
  id: string;
  orderId: string;
  title: string;
  detail: string;
  at: string;
  actor: string;
}
export interface ChatParticipant {
  id: string;
  name: string;
  role: "CUSTOMER" | "ADMIN" | "EMPLOYEE";
}
export interface Conversation {
  id: string;
  orderId: string;
  participant: ChatParticipant;
  unread: number;
  archived: boolean;
  updatedAt: string;
}
export interface ChatMessage {
  id: string;
  conversationId: string;
  sender: ChatParticipant;
  body: string;
  at: string;
  channel: "CUSTOMER" | "INTERNAL";
  read: boolean;
  attachment?: { name: string; kind: "image" | "file" };
}
export interface OrderNotification {
  id: string;
  title: string;
  detail: string;
  href: string;
  at: string;
  scope: "order.view" | "chat.view";
}
