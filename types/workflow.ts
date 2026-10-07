import type {
  Order as PreviousOrder,
  StaffCandidate,
  ChatMessage,
  Conversation,
} from "./operations";

export const orderStatuses = [
  "PENDING_PAYMENT",
  "OPEN",
  "CLAIMED",
  "IN_PROGRESS",
  "PAUSED",
  "PENDING_REVIEW",
  "COMPLETED",
  "CANCELLED",
  "DISPUTED",
  "REFUNDED",
] as const;
export type OrderStatus = (typeof orderStatuses)[number];
export const statusLabels: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "Chờ thanh toán",
  OPEN: "Chờ nhân viên nhận",
  CLAIMED: "Đã có nhân viên nhận",
  IN_PROGRESS: "Đang thực hiện",
  PAUSED: "Tạm dừng",
  PENDING_REVIEW: "Chờ xác nhận",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã hủy",
  DISPUTED: "Đang khiếu nại",
  REFUNDED: "Đã hoàn tiền",
};
export interface Order extends Omit<PreviousOrder, "status"> {
  status: OrderStatus;
  updatedAt: string;
  startedAt?: string;
  completedAt?: string;
  estimatedDuration: string;
  reward: number;
  difficulty: "Tiêu chuẩn" | "Nâng cao";
  refundedAmount: number;
  complaintStatus?: ComplaintStatus;
}
/** The pre-claim projection deliberately excludes customer/account/contact data. */
export type AvailableOrder = Pick<
  Order,
  | "id"
  | "game"
  | "service"
  | "status"
  | "currentRank"
  | "targetRank"
  | "region"
  | "estimatedDuration"
  | "reward"
  | "options"
  | "createdAt"
  | "difficulty"
>;
export interface Employee extends Omit<StaffCandidate, "maxActiveOrders"> {
  role: "EMPLOYEE";
  status: "ACTIVE" | "SUSPENDED";
  maxActiveOrders: 1 | 2;
  completedOrders: number;
  currentIp: string;
  lastIp: string;
  device: string;
  userAgent: string;
  lastLogin: string;
  riotId: string;
  verified: boolean;
  clientOpen: boolean;
  phone: string;
  timezone: string;
}
export interface OrderAssignment {
  id: string;
  orderId: string;
  employeeId: string;
  status: "CLAIMED" | "ACTIVE" | "REASSIGNED" | "COMPLETED" | "REMOVED";
  claimedAt: string;
  startedAt?: string;
  endedAt?: string;
  actor: string;
}
export const complaintReasons = {
  ORDER_FAILED: "Làm hỏng đơn",
  RANK_LOST: "Tụt hạng / kết quả không đạt",
  EMPLOYEE_BEHAVIOR: "Hành vi nhân viên",
  NO_PROGRESS: "Không có tiến triển",
  WRONG_SERVICE: "Sai dịch vụ",
  ACCOUNT_ISSUE: "Vấn đề tài khoản",
  OTHER: "Khác",
} as const;
export type ComplaintReason = keyof typeof complaintReasons;
export type ComplaintStatus = "OPEN" | "UNDER_REVIEW" | "RESOLVED" | "REJECTED";
export const complaintLabels: Record<ComplaintStatus, string> = {
  OPEN: "Mới",
  UNDER_REVIEW: "Đang xử lý",
  RESOLVED: "Đã giải quyết",
  REJECTED: "Đã từ chối",
};
export interface Complaint {
  id: string;
  orderId: string;
  customerId: string;
  employeeId?: string;
  reason: ComplaintReason;
  description: string;
  status: ComplaintStatus;
  priority: "NORMAL" | "HIGH";
  createdAt: string;
  resolvedAt?: string;
  adminNote: string;
  evidence: string[];
  actions: string[];
}
export interface SecuritySession {
  id: string;
  employeeId: string;
  ip: string;
  device: string;
  userAgent: string;
  loginAt: string;
  lastActivityAt: string;
  status: "ACTIVE" | "REVOKED";
}
export interface EmployeeTransaction {
  id: string;
  employeeId: string;
  orderId?: string;
  complaintId?: string;
  type: "EARNING" | "BONUS" | "PENALTY" | "ADJUSTMENT";
  amount: number;
  reason: string;
  admin: string;
  at: string;
}
export interface ActivityLog {
  id: string;
  orderId?: string;
  employeeId?: string;
  actor: string;
  title: string;
  detail: string;
  at: string;
}
export interface IssueReport {
  id: string;
  orderId: string;
  employeeId: string;
  reason: string;
  description: string;
  at: string;
  status: "OPEN" | "RESOLVED";
}
export type { ChatMessage, Conversation };
