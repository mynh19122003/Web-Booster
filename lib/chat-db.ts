import { randomUUID } from "node:crypto";
import type { AuthUser } from "@/lib/auth-db";
import type { CustomerRequest, SupportMessage } from "@/lib/chat-types";
import type { OrderRequestDetails, OrderRequestInput } from "@/lib/order-request-types";
import { decryptOrderDetails, encryptOrderDetails } from "@/lib/order-credentials";
import { employeePresenceDatabase } from "@/lib/employee-presence";

function database() {
  const db = employeePresenceDatabase();
  db.exec(`
    CREATE TABLE IF NOT EXISTS customer_requests (
      id TEXT PRIMARY KEY,
      customer_id TEXT NOT NULL REFERENCES users(id),
      employee_id TEXT REFERENCES users(id),
      subject TEXT NOT NULL,
      game TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'assigned', 'resolved')),
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS support_messages (
      id TEXT PRIMARY KEY,
      request_id TEXT NOT NULL REFERENCES customer_requests(id) ON DELETE CASCADE,
      sender_id TEXT NOT NULL REFERENCES users(id),
      sender_role TEXT NOT NULL CHECK (sender_role IN ('customer', 'employee')),
      text TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS requests_customer ON customer_requests(customer_id, updated_at);
    CREATE INDEX IF NOT EXISTS messages_request ON support_messages(request_id, created_at);
    CREATE TABLE IF NOT EXISTS request_order_details (
      request_id TEXT PRIMARY KEY REFERENCES customer_requests(id) ON DELETE CASCADE,
      customer_id TEXT NOT NULL REFERENCES users(id),
      submission_id TEXT NOT NULL,
      order_number TEXT NOT NULL UNIQUE,
      encrypted_details TEXT NOT NULL,
      UNIQUE(customer_id, submission_id)
    );
  `);
  return db;
}

const requestSelect = `SELECT r.id, r.subject, r.game, r.status,
  r.customer_id AS customerId, customer.name AS customerName,
  r.employee_id AS employeeId, employee.name AS employeeName,
  COALESCE(presence.is_online, 0) AS employeeOnline, r.updated_at AS updatedAt,
  COALESCE((SELECT text FROM support_messages WHERE request_id = r.id ORDER BY created_at DESC, rowid DESC LIMIT 1), '') AS lastMessage
  FROM customer_requests r JOIN users customer ON customer.id = r.customer_id
  LEFT JOIN users employee ON employee.id = r.employee_id
  LEFT JOIN employee_presence presence ON presence.user_id = r.employee_id`;

export function listRequests(user: AuthUser) {
  return database().prepare(`${requestSelect} ${user.role === "employee" ? "" : "WHERE r.customer_id = ?"}
    ORDER BY r.updated_at DESC, r.id DESC`).all(...(user.role === "employee" ? [] : [user.id])) as CustomerRequest[];
}

export function getRequest(user: AuthUser, id: string) {
  const row = database().prepare(`${requestSelect} WHERE r.id = ?`).get(id) as CustomerRequest | undefined;
  return row && (user.role === "employee" || row.customerId === user.id) ? row : null;
}

export function requestMessages(id: string) {
  return database().prepare(`SELECT m.id, m.sender_id AS senderId, u.name AS senderName,
    m.sender_role AS senderRole, m.text, m.created_at AS createdAt
    FROM support_messages m JOIN users u ON u.id = m.sender_id
    WHERE m.request_id = ? ORDER BY m.created_at, m.rowid`).all(id) as SupportMessage[];
}

export function createRequest(user: AuthUser, subject: string, game: string, text: string) {
  const db = database();
  const id = randomUUID();
  const now = Date.now();
  db.exec("BEGIN IMMEDIATE");
  try {
    db.prepare("INSERT INTO customer_requests (id, customer_id, subject, game, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)")
      .run(id, user.id, subject, game, now, now);
    db.prepare("INSERT INTO support_messages (id, request_id, sender_id, sender_role, text, created_at) VALUES (?, ?, ?, ?, ?, ?)")
      .run(randomUUID(), id, user.id, user.role === "employee" ? "employee" : "customer", text, now);
    db.exec("COMMIT");
  } catch (error) { db.exec("ROLLBACK"); throw error; }
  return getRequest(user, id)!;
}

export function createOrderRequest(user: AuthUser, subject: string, game: string, input: OrderRequestInput) {
  const db = database();
  db.exec("BEGIN IMMEDIATE");
  try {
    const existing = db.prepare("SELECT request_id AS id, order_number AS orderNumber FROM request_order_details WHERE customer_id = ? AND submission_id = ?")
      .get(user.id, input.submissionId) as { id: string; orderNumber: string } | undefined;
    if (existing) { db.exec("COMMIT"); return { request: getRequest(user, existing.id)!, orderNumber: existing.orderNumber }; }
    const id = randomUUID();
    const orderNumber = `ASC-${new Date().getFullYear()}-${randomUUID().toUpperCase()}`;
    const { submissionId, ...details } = input;
    const encrypted = encryptOrderDetails(id, { ...details, orderNumber });
    const now = Date.now();
    db.prepare("INSERT INTO customer_requests (id, customer_id, subject, game, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)")
      .run(id, user.id, subject, game, now, now);
    db.prepare("INSERT INTO request_order_details VALUES (?, ?, ?, ?, ?)").run(id, user.id, submissionId, orderNumber, encrypted);
    // Private specifications and credentials never enter the shared chat transcript.
    db.prepare("INSERT INTO support_messages (id, request_id, sender_id, sender_role, text, created_at) VALUES (?, ?, ?, 'customer', ?, ?)")
      .run(randomUUID(), id, user.id, "Order submitted through checkout preview. Waiting for an assigned booster.", now);
    db.exec("COMMIT");
    return { request: getRequest(user, id)!, orderNumber };
  } catch (error) { db.exec("ROLLBACK"); throw error; }
}

export function employeeOrderDetails(user: AuthUser, id: string): OrderRequestDetails | null {
  if (user.role !== "employee") return null;
  const row = database().prepare(`SELECT d.encrypted_details AS encrypted FROM request_order_details d
    JOIN customer_requests r ON r.id = d.request_id WHERE r.id = ? AND r.employee_id = ?`)
    .get(id, user.id) as { encrypted: string } | undefined;
  return row ? decryptOrderDetails(id, row.encrypted) : null;
}

export function sendRequestMessage(user: AuthUser, id: string, text: string) {
  const db = database();
  db.exec("BEGIN IMMEDIATE");
  try {
    const request = getRequest(user, id);
    if (!request) { db.exec("ROLLBACK"); return "not-found" as const; }
    if (request.status === "resolved" || (user.role === "employee" && request.employeeId !== user.id)) {
      db.exec("ROLLBACK"); return "not-assigned" as const;
    }
    const now = Date.now();
    db.prepare("INSERT INTO support_messages (id, request_id, sender_id, sender_role, text, created_at) VALUES (?, ?, ?, ?, ?, ?)")
      .run(randomUUID(), id, user.id, user.role === "employee" ? "employee" : "customer", text, now);
    db.prepare("UPDATE customer_requests SET updated_at = ? WHERE id = ?").run(now, id);
    db.exec("COMMIT");
    return "sent" as const;
  } catch (error) { db.exec("ROLLBACK"); throw error; }
}

export function updateRequest(user: AuthUser, id: string, action: "claim" | "resolve" | "reopen") {
  if ((action === "reopen" && user.role !== "customer") || (action !== "reopen" && user.role !== "employee")) return false;
  const db = database();
  // Conditional updates make claiming atomic, even when two employees act together.
  const result = action === "claim"
    ? db.prepare("UPDATE customer_requests SET employee_id = ?, status = 'assigned', updated_at = ? WHERE id = ? AND employee_id IS NULL AND status = 'open'").run(user.id, Date.now(), id)
    : action === "resolve"
      ? db.prepare("UPDATE customer_requests SET status = 'resolved', updated_at = ? WHERE id = ? AND employee_id = ? AND status = 'assigned'").run(Date.now(), id, user.id)
      : db.prepare("UPDATE customer_requests SET employee_id = NULL, status = 'open', updated_at = ? WHERE id = ? AND status = 'resolved' AND customer_id = ?").run(Date.now(), id, user.id);
  return result.changes > 0;
}
