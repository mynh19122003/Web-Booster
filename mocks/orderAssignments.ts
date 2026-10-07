// UI review fixtures only; never used as an API fallback.
import type { OrderAssignment, OrderProgressEvent } from "@/types/operations";
import { mockOrders, mockStaffCandidates, ago } from "./orders";
export const mockAssignments: OrderAssignment[] = [
  {
    id: "offer-declined",
    orderId: "ASC-1043",
    employeeId: "emp-nova",
    status: "DECLINED",
    offeredAt: ago(30),
    expiresAt: ago(15),
    respondedAt: ago(27),
    reason: "Currently unavailable",
  },
  ...mockOrders
    .filter((o) => o.employeeId)
    .map((o) => ({
      id: `offer-${o.id}`,
      orderId: o.id,
      employeeId: o.employeeId!,
      status:
        o.status === "OFFERED" ? ("OFFERED" as const) : ("ACCEPTED" as const),
      offeredAt: ago(o.status === "OFFERED" ? 2 : 80),
      expiresAt: new Date(Date.now() + 13 * 60000).toISOString(),
      ...(o.status !== "OFFERED" ? { respondedAt: ago(75) } : {}),
    })),
];
export const mockProgressEvents: OrderProgressEvent[] = mockOrders.flatMap(
  (o) => [
    {
      id: `created-${o.id}`,
      orderId: o.id,
      title: "Order created",
      detail: "Customer submitted their request.",
      at: o.createdAt,
      actor: o.customer.name,
    },
    ...(o.status !== "PENDING"
      ? [
          {
            id: `paid-${o.id}`,
            orderId: o.id,
            title: "Payment confirmed",
            detail: "Payment received.",
            at: o.createdAt,
            actor: "ASCEND",
          },
        ]
      : []),
    ...(o.employeeId
      ? [
          {
            id: `assigned-${o.id}`,
            orderId: o.id,
            title: `Assigned to ${mockStaffCandidates.find((e) => e.id === o.employeeId)?.name}`,
            detail: "Employee offer sent.",
            at: ago(o.status === "OFFERED" ? 2 : 80),
            actor: "Alex",
          },
        ]
      : []),
    ...(o.employeeId && o.status !== "OFFERED"
      ? [
          {
            id: `accepted-${o.id}`,
            orderId: o.id,
            title: `${mockStaffCandidates.find((e) => e.id === o.employeeId)?.name} accepted`,
            detail: "Assignment accepted and workload reserved.",
            at: ago(75),
            actor: "Employee",
          },
        ]
      : []),
    ...(o.progress > 0
      ? [
          {
            id: `started-${o.id}`,
            orderId: o.id,
            title: "Work started",
            detail: "First session began.",
            at: ago(70),
            actor: "Employee",
          },
        ]
      : []),
    ...(o.progress > 0
      ? [
          {
            id: `progress-${o.id}`,
            orderId: o.id,
            title: o.progress === 100 ? "Order completed" : "Rank updated",
            detail: `${o.progress}% of the journey complete.`,
            at: ago(10),
            actor: "Employee",
          },
        ]
      : []),
  ],
);
