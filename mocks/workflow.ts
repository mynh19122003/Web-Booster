import { mockOrders, mockStaffCandidates, ago } from "./orders";
import { mockAssignments, mockProgressEvents } from "./orderAssignments";
import { mockConversations } from "./conversations";
import { mockMessages } from "./messages";
import type { WorkflowState } from "@/lib/workflow/store";
import type { OrderStatus, Order } from "@/types/workflow";

const statuses: Record<string, OrderStatus> = {
  PENDING: "PENDING_PAYMENT",
  CONFIRMED: "OPEN",
  WAITING_ASSIGNMENT: "OPEN",
  OFFERED: "CLAIMED",
  ACCEPTED: "CLAIMED",
};
/** Preserve the original fixtures; adapt them to the reviewed product flow. */
export function workflowFixtures(): Omit<
  WorkflowState,
  "ready" | "initialized" | "employeeId" | "employeeSessionId"
> {
  const orders: Order[] = mockOrders.map((o) => ({
    ...structuredClone(o),
    status: statuses[o.status] ?? (o.status as OrderStatus),
    updatedAt: ago(10),
    estimatedDuration: o.service === "Coaching" ? "2–3 giờ" : "12–16 giờ",
    reward: Math.round(o.amount * 5000),
    difficulty: "Tiêu chuẩn" as const,
    refundedAmount: o.status === "REFUNDED" ? o.amount : 0,
    startedAt: o.progress ? ago(70) : undefined,
  }));
  // Nova starts with one active order; retain the paused fixture as unassigned.
  const paused = orders.find((o) => o.id === "ASC-1040")!;
  paused.employeeId = undefined;
  const review = orders.find((o) => o.id === "ASC-1041")!;
  review.status = "PENDING_REVIEW";
  review.progress = 100;
  // The previous offered order returns to the self-claim queue; keep its history.
  const available = orders.find((o) => o.id === "ASC-1043")!;
  available.status = "OPEN";
  available.employeeId = undefined;
  const employees = mockStaffCandidates.map((e, i) => ({
    ...structuredClone(e),
    role: "EMPLOYEE" as const,
    status: "ACTIVE" as const,
    maxActiveOrders: (i === 1 ? 2 : 1) as 1 | 2,
    completedOrders: [128, 214, 96, 84][i],
    currentIp: `203.0.113.${20 + i}`,
    lastIp: `198.51.100.${30 + i}`,
    device: "Windows · Chrome",
    userAgent: "Mozilla/5.0 Windows NT 10.0 Chrome/140.0",
    lastLogin: ago(120),
    riotId: `${e.name}#VN2`,
    verified: i < 2,
    clientOpen: i === 0,
    phone: "",
    timezone: "Asia/Ho_Chi_Minh",
  }));
  const disputed = orders.find((o) => o.status === "DISPUTED")!;
  disputed.complaintStatus = "OPEN";
  return {
    orders,
    employees,
    assignments: mockAssignments.map((a) => ({
      id: a.id,
      orderId: a.orderId,
      employeeId: a.employeeId,
      status:
        a.status === "DECLINED" ||
        a.orderId === paused.id ||
        a.orderId === available.id
          ? ("REASSIGNED" as const)
          : orders.find((o) => o.id === a.orderId)?.status === "COMPLETED"
            ? ("COMPLETED" as const)
            : ("ACTIVE" as const),
      claimedAt: a.offeredAt,
      startedAt: a.respondedAt,
      endedAt:
        a.status === "DECLINED" ||
        a.orderId === paused.id ||
        a.orderId === available.id
          ? ago(20)
          : undefined,
      actor: "Minh",
    })),
    conversations: [
      ...mockConversations.map((c) => {
        const o = orders.find((o) => o.id === c.orderId)!;
        return {
          ...structuredClone(c),
          participant: {
            id: o.customer.id,
            name: o.customer.name,
            role: "CUSTOMER" as const,
          },
        };
      }),
      ...orders
        .filter(
          (o) =>
            o.employeeId && !mockConversations.some((c) => c.orderId === o.id),
        )
        .map((o) => ({
          id: `chat-${o.id}`,
          orderId: o.id,
          participant: {
            id: o.customer.id,
            name: o.customer.name,
            role: "CUSTOMER" as const,
          },
          unread: 0,
          archived: false,
          updatedAt: o.updatedAt,
        })),
    ],
    messages: structuredClone(mockMessages),
    complaints: [
      {
        id: "KN-1001",
        orderId: disputed.id,
        customerId: disputed.customer.id,
        employeeId: disputed.employeeId,
        reason: "RANK_LOST",
        description:
          "Sau phiên chơi gần nhất, thứ hạng giảm. Tôi cần đội ngũ kiểm tra và đề xuất hướng xử lý.",
        status: "OPEN",
        priority: "HIGH",
        createdAt: ago(45),
        adminNote: "Kiểm tra tiến độ và trao đổi trước khi quyết định.",
        evidence: [
          "Ảnh lịch sử trận đấu · kết quả giảm hạng",
          "Trao đổi với nhân viên trong cuộc trò chuyện",
        ],
        actions: [],
      },
    ],
    sessions: employees.flatMap((e) => [
      {
        id: `session-${e.id}`,
        employeeId: e.id,
        ip: e.currentIp,
        device: e.device,
        userAgent: e.userAgent,
        loginAt: e.lastLogin,
        lastActivityAt: e.lastActivity,
        status: "ACTIVE" as const,
      },
      {
        id: `old-session-${e.id}`,
        employeeId: e.id,
        ip: e.lastIp,
        device: "Windows · Edge",
        userAgent: "Mozilla/5.0 Windows Edge/139.0",
        loginAt: ago(1440),
        lastActivityAt: ago(1300),
        status: "REVOKED" as const,
      },
    ]),
    transactions: employees.map((e) => ({
      id: `earning-${e.id}`,
      employeeId: e.id,
      type: "EARNING" as const,
      amount: 1450000,
      reason: "Dịch vụ đã hoàn thành",
      admin: "ASCEND",
      at: ago(1440),
      orderId: e.id === "emp-zero" ? "ASC-1039" : undefined,
    })),
    activities: mockProgressEvents.map((e) => ({
      ...e,
      employeeId: orders.find((o) => o.id === e.orderId)?.employeeId,
    })),
    issues: [],
  };
}
