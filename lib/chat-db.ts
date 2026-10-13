import { randomUUID } from "node:crypto";
import type { AuthUser } from "@/lib/auth-db";
import type { CustomerRequest, SupportMessage } from "@/lib/chat-types";
import type { OrderRequestDetails, OrderRequestInput } from "@/lib/order-request-types";
import { decryptOrderDetails, encryptOrderDetails } from "@/lib/order-credentials";
import { storedEmployeePresence } from "@/lib/employee-presence";
import { mockState } from "@/lib/mock-state";

type StoredMessage = SupportMessage & { clientId?: string };
const requests = mockState.requests as Map<string, CustomerRequest>;
const messages = mockState.messages as Map<string, StoredMessage[]>;
const readKey = (userId: string, requestId: string) => `${userId}:${requestId}`;

function view(request: CustomerRequest): CustomerRequest {
  const last = messages.get(request.id)?.at(-1);
  const employee = request.employeeId ? mockState.users.get(request.employeeId) : undefined;
  return { ...request, employeeName: employee ? String(employee.name) : request.employeeName,
    employeeOnline: request.employeeId ? Number(storedEmployeePresence(request.employeeId) ?? false) : 0,
    lastMessage: last?.text ?? "" };
}
export function listRequests(user: AuthUser) {
  return [...requests.values()].filter(row => user.role === "employee" || row.customerId === user.id)
    .map(view).sort((a, b) => b.updatedAt - a.updatedAt || b.id.localeCompare(a.id));
}
export function getRequest(user: AuthUser, id: string) {
  const row = requests.get(id);
  return row && (user.role === "employee" || row.customerId === user.id) ? view(row) : null;
}
export function requestMessages(id: string): SupportMessage[] {
  return (messages.get(id) ?? []).map(message => ({ id: message.id, senderId: message.senderId,
    senderName: message.senderName, senderRole: message.senderRole, text: message.text, createdAt: message.createdAt }));
}
export function requestUnreadCounts(user: AuthUser) {
  const byRequest: Record<string, number> = {};
  for (const request of requests.values()) {
    if ((user.role === "employee" ? request.employeeId : request.customerId) !== user.id) continue;
    const seen = mockState.messageReads.get(readKey(user.id, request.id)) ?? 0;
    const count = (messages.get(request.id) ?? []).slice(seen).filter(message => message.senderId !== user.id).length;
    if (count) byRequest[request.id] = count;
  }
  return { total: Object.values(byRequest).reduce((total, count) => total + count, 0), byRequest };
}
export function markRequestRead(user: AuthUser, id: string, messageId: string) {
  const request = getRequest(user, id);
  if (!request || (user.role === "employee" && request.employeeId !== user.id)) return "forbidden" as const;
  const position = (messages.get(id) ?? []).findIndex(message => message.id === messageId);
  if (position < 0) return "invalid-request" as const;
  const key = readKey(user.id, id);
  mockState.messageReads.set(key, Math.max(mockState.messageReads.get(key) ?? 0, position + 1));
  return requestUnreadCounts(user);
}
function addMessage(request: CustomerRequest, user: AuthUser, text: string, clientId?: string) {
  const now = Date.now();
  const message: StoredMessage = { id: randomUUID(), senderId: user.id, senderName: user.name,
    senderRole: user.role === "employee" ? "employee" : "customer", text, createdAt: now, ...(clientId ? { clientId } : {}) };
  messages.get(request.id)?.push(message);
  request.updatedAt = now;
}
export function createRequest(user: AuthUser, subject: string, game: string, text: string) {
  const id = randomUUID();
  const request: CustomerRequest = { id, subject, game, status: "open", customerId: user.id,
    customerName: user.name, employeeId: null, employeeName: null, employeeOnline: 0, updatedAt: Date.now(), lastMessage: "" };
  requests.set(id, request); messages.set(id, []);
  addMessage(request, user, text);
  return view(request);
}
export function createOrderRequest(user: AuthUser, subject: string, game: string, input: OrderRequestInput) {
  const existing = [...mockState.orderDetails.entries()].find(([, row]) => row.customerId === user.id && row.submissionId === input.submissionId);
  if (existing) return { request: getRequest(user, existing[0])!, orderNumber: existing[1].orderNumber };
  const id = randomUUID();
  const orderNumber = `ASC-${new Date().getFullYear()}-${randomUUID().toUpperCase()}`;
  const { submissionId, ...details } = input;
  const encrypted = encryptOrderDetails(id, { ...details, orderNumber });
  const request: CustomerRequest = { id, subject, game, status: "open", customerId: user.id,
    customerName: user.name, employeeId: null, employeeName: null, employeeOnline: 0, updatedAt: Date.now(), lastMessage: "" };
  requests.set(id, request); messages.set(id, []);
  mockState.orderDetails.set(id, { customerId: user.id, submissionId, orderNumber, encrypted });
  addMessage(request, user, "Order submitted through checkout preview. Waiting for an assigned booster.");
  return { request: view(request), orderNumber };
}
export function employeeOrderDetails(user: AuthUser, id: string): OrderRequestDetails | null {
  if (user.role !== "employee" || requests.get(id)?.employeeId !== user.id) return null;
  const row = mockState.orderDetails.get(id);
  return row ? decryptOrderDetails(id, row.encrypted) : null;
}
export function sendRequestMessage(user: AuthUser, id: string, text: string, clientId?: string) {
  const request = getRequest(user, id);
  if (!request) return "not-found" as const;
  if (request.status === "resolved" || (user.role === "employee" && request.employeeId !== user.id)) return "not-assigned" as const;
  if (clientId && messages.get(id)?.some(message => message.senderId === user.id && message.clientId === clientId)) return "sent" as const;
  const stored = requests.get(id)!;
  addMessage(stored, user, text, clientId);
  return "sent" as const;
}
export function updateRequest(user: AuthUser, id: string, action: "claim" | "resolve" | "reopen") {
  const request = requests.get(id);
  if (!request) return false;
  if (action === "claim" && user.role === "employee" && request.status === "open" && !request.employeeId) {
    request.employeeId = user.id; request.employeeName = user.name; request.status = "assigned";
  } else if (action === "resolve" && user.role === "employee" && request.employeeId === user.id && request.status === "assigned") {
    request.status = "resolved";
  } else if (action === "reopen" && user.role === "customer" && request.customerId === user.id && request.status === "resolved") {
    request.employeeId = null; request.employeeName = null; request.status = "open";
  } else return false;
  request.updatedAt = Date.now();
  return true;
}
