import type { Conversation } from "@/types/operations";
import { orders, ago } from "./orders";
export const conversations: Conversation[] = [
  "ASC-1042",
  "ASC-1049",
  "ASC-1043",
  "ASC-1046",
  "ASC-1039",
].map((orderId, i) => {
  const o = orders.find((x) => x.id === orderId)!;
  return {
    id: `chat-${orderId}`,
    orderId,
    participant:
      i === 2
        ? { id: "emp-zen", name: "Zen", role: "EMPLOYEE" }
        : { id: o.customer.id, name: o.customer.name, role: "CUSTOMER" },
    unread: [2, 1, 1, 1, 0][i],
    archived: i === 4,
    updatedAt: ago(2 + i * 8),
  };
});
