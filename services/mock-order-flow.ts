"use client";
import type { Socket } from "socket.io-client";
import { createChatSocket } from "@/lib/chat-socket-client";
import { useWorkflow, type WorkflowState } from "@/lib/workflow/store";
import { persistDemoChat } from "@/services/public";
import type { CustomerRequest, SupportMessage } from "@/lib/chat-types";
import type { Order } from "@/types/workflow";

type Projection = { orders: Order[]; ids: string[] };
type Reply = { ok: boolean; error?: string; workflow?: Projection; order?: Order; request?: CustomerRequest; messages?: SupportMessage[] };
let client: Socket | undefined;
let identity = "";
let connecting: Promise<Socket> | undefined;

function apply(result: Reply) {
  if (result.request && result.messages) persistDemoChat(result.request, result.messages);
  if (!result.workflow) return;
  const { orders, ids } = result.workflow;
  const state = useWorkflow.getState();
  // Preserve unrelated saved records while replacing the shared order projection.
  const retained = state.orders.filter(row => row.id !== "ASC-1054" && !ids.includes(row.id));
  const assignments = state.assignments.filter(row => !ids.includes(row.orderId));
  const conversations = state.conversations.filter(row => !ids.includes(row.orderId) && row.orderId !== "ASC-1054");
  for (const row of orders) if (row.employeeId) assignments.push({ id: `shared-${row.id}`, orderId: row.id, employeeId: row.employeeId, status: row.status === "COMPLETED" ? "COMPLETED" : "ACTIVE", claimedAt: row.startedAt ?? row.updatedAt, startedAt: row.startedAt, actor: state.employees.find(e => e.id === row.employeeId)?.name ?? "ASCEND" });
  for (const row of orders) if (row.employeeId === state.employeeId) conversations.push({ id: `chat-${row.id}`, orderId: row.id, participant: { id: row.customer.id, name: row.customer.name, role: "CUSTOMER" }, unread: 0, archived: row.status === "COMPLETED", updatedAt: row.updatedAt });
  useWorkflow.setState({ orders: [...retained, ...orders], assignments, conversations });
}
function account(customer = false) {
  if (customer) return "customer";
  const id = useWorkflow.getState().employeeId;
  return id ? `employee:${id}` : "customer";
}
export function stopMockOrderFlow() {
  client?.disconnect(); client = undefined; identity = ""; connecting = undefined;
}
export async function connectMockOrderFlow(customer = false) {
  const next = account(customer);
  if (client && identity === next && connecting) return connecting;
  stopMockOrderFlow();
  identity = next;
  const socket = createChatSocket(true, next !== "customer", useWorkflow.getState().employeeId ?? undefined);
  client = socket;
  const sync = () => socket.timeout(10000).emit("workflow:sync", { cached: useWorkflow.getState().orders }, (error: Error | null, result: Reply) => { if (!error && result?.ok) apply(result); });
  socket.on("workflow:changed", sync);
  socket.on("chat:update", (result: Reply) => { if (result.request && result.messages) persistDemoChat(result.request, result.messages); });
  connecting = new Promise<Socket>((resolve, reject) => {
    let first = true;
    socket.on("connect", () => {
      socket.timeout(10000).emit("workflow:sync", { cached: useWorkflow.getState().orders }, (error: Error | null, result: Reply) => {
        if (error || !result?.ok) { if (first) { first = false; reject(new Error(result?.error ?? "connection")); } return; }
        apply(result);
        if (first) { first = false; resolve(socket); }
      });
    });
    socket.once("connect_error", () => { if (first) { first = false; reject(new Error("connection")); } });
  });
  socket.connect();
  connecting = connecting.catch(error => { if (client === socket) stopMockOrderFlow(); throw error; });
  return connecting;
}
export async function mockOrderCommand(event: "workflow:create" | "workflow:claim" | "workflow:update", payload: unknown) {
  const socket = await connectMockOrderFlow(event === "workflow:create");
  const result = await socket.timeout(10000).emitWithAck(event, payload) as Reply;
  if (!result.ok) throw new Error(result.error ?? "connection");
  apply(result);
  return result;
}
export async function mockWorkflowFallback(): Promise<Partial<WorkflowState>> {
  const response = await fetch("/api/mock/workflow", { cache: "no-store" });
  if (!response.ok) throw new Error("Không thể tải dữ liệu đơn hàng.");
  return (await response.json()).workflow;
}
