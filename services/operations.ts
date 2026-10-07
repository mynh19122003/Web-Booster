"use client";
import { useOperations as store } from "@/lib/admin/operations-store";
import { useAdminStore } from "@/lib/admin/store";
import { can } from "./admin";
import type { Permission } from "@/types/admin";
import type {
  Order,
  OrderStatus,
  OrderAssignment,
  ChatMessage,
} from "@/types/operations";
// TODO: Connect backend API. Frontend permission UI does not replace backend authorization.
// All writes are atomic local demo updates; no endpoint, token, password or upload is used.
const wait = () => new Promise<void>((resolve) => setTimeout(resolve, 220));
const uid = () => crypto.randomUUID();
const timestamp = () => new Date().toISOString();
function requireAccess(permission: Permission) {
  if (!can(permission))
    throw new Error("You don’t have permission for this action.");
}
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
function orderById(id: string) {
  const order = store.getState().orders.find((o) => o.id === id);
  if (!order) throw new Error("This order could not be found.");
  return order;
}
function event(
  order: Order,
  title: string,
  detail: string,
  actor = useAdminStore.getState().user?.displayName ?? "Staff",
) {
  const s = store.getState();
  store.setState({
    events: [
      ...s.events,
      { id: uid(), orderId: order.id, title, detail, at: timestamp(), actor },
    ],
    notifications: [
      {
        id: uid(),
        title,
        detail: `#${order.id} · ${detail}`,
        href: `/admin/orders/${order.id}`,
        at: timestamp(),
        scope: "order.view" as const,
      },
      ...s.notifications,
    ].slice(0, 30),
  });
}
function update(id: string, patch: Partial<Order>) {
  store.setState({
    orders: store
      .getState()
      .orders.map((o) => (o.id === id ? { ...o, ...patch } : o)),
  });
}
function resolveOffers(orderId: string, status: "REPLACED" | "CANCELLED") {
  store.setState({
    assignments: store
      .getState()
      .assignments.map((a) =>
        a.orderId === orderId && ["OFFERED", "ACCEPTED"].includes(a.status)
          ? { ...a, status, respondedAt: timestamp() }
          : a,
      ),
  });
}
async function offer(orderId: string, employeeId: string, reassign: boolean) {
  await wait();
  requireAccess("order.assign");
  requireAccess("order.view");
  const o = orderById(orderId);
  const s = store.getState();
  const employee = s.employees.find((e) => e.id === employeeId);
  if (
    ![
      "PENDING",
      "CONFIRMED",
      "WAITING_ASSIGNMENT",
      "OFFERED",
      "ACCEPTED",
      "IN_PROGRESS",
      "PAUSED",
    ].includes(o.status)
  )
    throw new Error("This order cannot be assigned in its current state.");
  if (o.employeeId && !reassign)
    throw new Error("Use reassign to replace the current staff.");
  if (
    !useAdminStore.getState().staff.some(s => s.id === employeeId && s.status === "ACTIVE") ||
    !employee ||
    !employee.games.includes(o.game) ||
    employee.type !== (o.service === "Coaching" ? "COACH" : "BOOSTER")
  )
    throw new Error("Choose an staff who supports this game and service.");
  if (employeeId === o.employeeId)
    throw new Error("Choose a different staff for reassignment.");
  if (workload(employeeId) >= employee.maxActiveOrders)
    throw new Error("This staff has reached their order limit.");
  resolveOffers(orderId, "REPLACED");
  const assignment: OrderAssignment = {
    id: uid(),
    orderId,
    employeeId,
    status: "OFFERED",
    offeredAt: timestamp(),
    expiresAt: new Date(Date.now() + 15 * 60000).toISOString(),
  };
  store.setState({
    assignments: [...store.getState().assignments, assignment],
  });
  update(orderId, { employeeId, status: "OFFERED" });
  event(o, "Offer sent", `${employee.name} · Waiting for employee response`);
  return assignment;
}
export const orderService = {
  async getOrders() {
    await wait();
    requireAccess("order.view");
    return store.getState().orders;
  },
  async getOrder(id: string) {
    await wait();
    requireAccess("order.view");
    return orderById(id);
  },
  async getIncomingOrders() {
    await wait();
    requireAccess("order.view");
    return store
      .getState()
      .orders.filter((o) => incomingStatuses.includes(o.status));
  },
  assignStaff: (id: string, employeeId: string) =>
    offer(id, employeeId, false),
  reassignStaff: (id: string, employeeId: string) =>
    offer(id, employeeId, true),
  async reviewOrder(id: string) {
    await wait();
    requireAccess("order.update");
    const o = orderById(id);
    if (!incomingStatuses.includes(o.status))
      throw new Error("This order has already been reviewed.");
    update(id, { status: "WAITING_ASSIGNMENT" });
    event(o, "Review completed", "Ready for staff assignment");
  },
  async pauseOrder(id: string) {
    await wait();
    requireAccess("order.update");
    const o = orderById(id);
    if (o.status !== "IN_PROGRESS")
      throw new Error("Only active work can be paused.");
    update(id, { status: "PAUSED" });
    event(o, "Order paused", "Work paused by admin");
  },
  async startOrder(id: string) {
    await wait();
    requireAccess("order.update");
    const o = orderById(id);
    if (!["ACCEPTED", "PAUSED"].includes(o.status))
      throw new Error("The staff must accept before work begins.");
    update(id, { status: "IN_PROGRESS" });
    event(o, "Work started", "Order is now in progress");
  },
  async cancelOrder(id: string, reason: string) {
    await wait();
    requireAccess("order.cancel");
    const o = orderById(id);
    if (["COMPLETED", "CANCELLED", "REFUNDED"].includes(o.status))
      throw new Error("This order is already closed.");
    if (reason.trim().length < 5)
      throw new Error("Add a cancellation reason (5+ characters).");
    resolveOffers(id, "CANCELLED");
    update(id, { status: "CANCELLED" });
    event(o, "Order cancelled", reason.trim());
  },
  async completeOrder(id: string) {
    await wait();
    requireAccess("order.update");
    const o = orderById(id);
    if (o.status !== "IN_PROGRESS")
      throw new Error("Only an in-progress order can be completed.");
    update(id, { status: "COMPLETED", progress: 100 });
    event(o, "Order completed", "Target reached · Ready for customer review");
  },
  async updateProgress(
    id: string,
    progress: number,
    currentLP: number,
    note: string,
  ) {
    await wait();
    requireAccess("order.update");
    const o = orderById(id);
    if (o.status !== "IN_PROGRESS")
      throw new Error("Progress can only change while work is in progress.");
    if (
      !Number.isFinite(progress) ||
      progress < o.progress ||
      progress > 99 ||
      !Number.isFinite(currentLP) ||
      currentLP < 0 ||
      currentLP > 100
    )
      throw new Error(
        "Progress must increase up to 99%; LP must be 0–100. Use Complete to finish.",
      );
    update(id, { progress, currentLP });
    event(
      o,
      "Rank updated",
      `${progress}% complete · ${currentLP} LP. ${note.trim()}`,
    );
  },
  async saveNotes(id: string, notes: string) {
    await wait();
    requireAccess("order.update");
    const o = orderById(id);
    update(id, { adminNotes: notes.trim().slice(0, 3000) });
    event(o, "Admin note updated", "Internal order notes saved");
  },
};
export const assignmentService = {
  async getAssignments() {
    await wait();
    requireAccess("order.view");
    return store.getState().assignments;
  },
  createAssignment: orderService.assignStaff,
  async getAvailableStaff() {
    await wait();
    requireAccess("order.assign");
    return store.getState().employees;
  },
  expireOffers() {
    const expired = store
      .getState()
      .assignments.filter(
        (a) => a.status === "OFFERED" && Date.parse(a.expiresAt) <= Date.now(),
      );
    for (const a of expired) {
      const o = orderById(a.orderId);
      store.setState({
        assignments: store
          .getState()
          .assignments.map((x) =>
            x.id === a.id
              ? { ...x, status: "EXPIRED", respondedAt: timestamp() }
              : x,
          ),
      });
      if (o.status === "OFFERED" && o.employeeId === a.employeeId) {
        update(o.id, { status: "WAITING_ASSIGNMENT", employeeId: undefined });
        event(o, "Offer expired", "Returned to the assignment queue");
      }
    }
  },
};
export const chatService = {
  async getConversations() {
    await wait();
    requireAccess("chat.view");
    return store.getState().conversations;
  },
  async getConversationMessages(id: string, channel: ChatMessage["channel"]) {
    await wait();
    requireAccess("chat.view");
    return store
      .getState()
      .messages.filter((m) => m.conversationId === id && m.channel === channel);
  },
  async ensureOrderConversation(orderId: string) {
    await wait();
    requireAccess("chat.view");
    const s = store.getState();
    const existing = s.conversations.find((c) => c.orderId === orderId);
    if (existing) return existing.id;
    const o = orderById(orderId);
    const c = {
      id: `chat-${orderId}`,
      orderId,
      participant: {
        id: o.customer.id,
        name: o.customer.name,
        role: "CUSTOMER" as const,
      },
      unread: 0,
      archived: false,
      updatedAt: timestamp(),
    };
    store.setState({ conversations: [c, ...s.conversations] });
    return c.id;
  },
  async sendMessage(
    conversationId: string,
    body: string,
    channel: ChatMessage["channel"],
    attachment?: ChatMessage["attachment"],
  ) {
    await wait();
    requireAccess("chat.view");
    requireAccess("chat.send");
    const s = store.getState();
    const c = s.conversations.find((x) => x.id === conversationId);
    if (!c || c.archived)
      throw new Error("Reopen this conversation before sending a message.");
    if ((!body.trim() && !attachment) || body.length > 4000)
      throw new Error("Enter a message up to 4,000 characters.");
    const user = useAdminStore.getState().user!;
    const message: ChatMessage = {
      id: uid(),
      conversationId,
      sender: { id: user.id, name: user.displayName, role: "ADMIN" },
      body: body.trim(),
      channel,
      at: timestamp(),
      read: false,
      attachment,
    };
    store.setState({
      messages: [...s.messages, message],
      conversations: s.conversations.map((x) =>
        x.id === c.id ? { ...x, updatedAt: message.at } : x,
      ),
    });
    return message;
  },
  async markAsRead(id: string) {
    await wait();
    requireAccess("chat.view");
    store.setState({
      conversations: store
        .getState()
        .conversations.map((c) => (c.id === id ? { ...c, unread: 0 } : c)),
    });
  },
  async archiveConversation(id: string, archived = true) {
    await wait();
    requireAccess("chat.send");
    store.setState({
      conversations: store
        .getState()
        .conversations.map((c) =>
          c.id === id ? { ...c, archived, unread: 0 } : c,
        ),
    });
  },
};
