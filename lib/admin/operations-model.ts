import { useOperations as store } from "./operations-store";
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
export function workload(employeeId: string) {
  return store
    .getState()
    .orders.filter(
      (o) => o.employeeId === employeeId && activeStatuses.includes(o.status),
    ).length;
}
