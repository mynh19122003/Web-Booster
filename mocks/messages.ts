// UI review fixtures only; never used as an API fallback.
import type { ChatMessage } from "@/types/operations";
import { mockConversations } from "./conversations";
import { ago } from "./orders";
export const mockMessages: ChatMessage[] = mockConversations.flatMap((c) => [
  {
    id: `msg-${c.id}-1`,
    conversationId: c.id,
    sender: { id: "owner", name: "Alex", role: "ADMIN" },
    body: "Welcome to ASCEND. Your order is in good hands — we’ll keep you updated here.",
    at: ago(50),
    channel: "CUSTOMER",
    read: true,
  },
  {
    id: `msg-${c.id}-2`,
    conversationId: c.id,
    sender: c.participant,
    body:
      c.participant.role === "EMPLOYEE"
        ? "I’m checking my schedule for this offer."
        : "Can you check the progress? I’ll be available this evening.",
    at: c.updatedAt,
    channel: "CUSTOMER",
    read: false,
  },
  ...(c.orderId === "ASC-1042"
    ? [
        {
          id: "msg-nova",
          conversationId: c.id,
          sender: { id: "emp-nova", name: "Nova", role: "EMPLOYEE" as const },
          body: "We’re at 64% now. The next session is planned for tonight.",
          at: ago(1),
          channel: "CUSTOMER" as const,
          read: true,
        },
        {
          id: "note-1",
          conversationId: c.id,
          sender: { id: "owner", name: "Alex", role: "ADMIN" as const },
          body: "Customer requested faster completion. Please prioritize this order.",
          at: ago(5),
          channel: "INTERNAL" as const,
          read: true,
        },
      ]
    : []),
]);
