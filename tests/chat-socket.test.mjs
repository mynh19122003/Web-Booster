import assert from "node:assert/strict";
import { test } from "node:test";
import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import { io as connect } from "socket.io-client";
import { attachChatSocketServer } from "../scripts/chat-socket.mjs";
import { workflowFixture } from "./helpers/workflow-fixture.mjs";

async function setup(t, options = {}) {
  const server = createServer();
  await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const io = attachChatSocketServer(server, { origin, mock: true, workflowSeed: workflowFixture(), demoDatabasePath: ":memory:", ...options });
  const clients = [];
  t.after(() => { clients.forEach(client => client.disconnect()); io.close(); });
  async function client(session = randomUUID(), extra = {}) {
    const socket = connect(origin, { auth: { demo: true, session }, transports: ["websocket"], reconnection: false, ...extra });
    clients.push(socket);
    await new Promise((resolve, reject) => { socket.once("connect", resolve); socket.once("connect_error", reject); });
    return socket;
  }
  return { client, io };
}
const fixture = status => ({ request: { id: "test-order", customerId: "customer", customerName: "Minh Anh", employeeId: "mira", employeeName: "Mira", status: status ?? "assigned", updatedAt: 1, lastMessage: "" }, messages: [] });
const join = (socket, seed = fixture()) => socket.timeout(1000).emitWithAck("chat:join", { id: "test-order", seed });

test("public coach viewers receive persisted rank changes and cannot use chat commands", async t => {
  let version = 1;
  const { client } = await setup(t, { fetchImpl: async () => Response.json({ coaches: [{ slug: "luna", riotProfile: { history: { updatedAt: version } } }] }) });
  const viewer = await client(undefined, { auth: { publicCoaches: true } });
  await assert.rejects(viewer.timeout(100).emitWithAck("chat:join", { id: "private-order" }));
  const change = new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("No realtime coach update")), 6000);
    viewer.once("coach:changed", () => { clearTimeout(timer); resolve(); });
  });
  version = 2;
  await change;
});

test("Socket.IO broadcasts to participants, uses the selected booster, and deduplicates demo retries", async t => {
  const { client } = await setup(t);
  const session = randomUUID();
  const first = await client(session), second = await client(session);
  assert.equal((await join(first)).ok, true);
  await join(second);
  const received = new Promise(resolve => second.once("chat:update", resolve));
  const payload = { id: "test-order", text: "Hello Mira", clientId: randomUUID() };
  const result = await first.timeout(1000).emitWithAck("chat:send", payload);
  const update = await received;
  assert.equal(result.ok, true);
  assert.equal(update.messages[0].text, "Hello Mira");
  assert.equal(update.messages[1].senderName, "Mira");
  assert.equal((await first.timeout(1000).emitWithAck("chat:send", payload)).messages.length, 2);
  first.disconnect();
  const reconnected = await client(session);
  assert.equal((await join(reconnected)).messages.length, 2);
});

test("demo sessions are isolated and reject closed conversations and invalid text", async t => {
  const { client } = await setup(t);
  const first = await client(), second = await client();
  await join(first);
  await join(second, fixture("resolved"));
  const closed = await second.timeout(1000).emitWithAck("chat:send", { id: "test-order", text: "hello", clientId: randomUUID() });
  assert.equal(closed.ok, false);
  assert.equal(closed.error, "not-assigned");
  const invalid = await first.timeout(1000).emitWithAck("chat:send", { id: "test-order", text: " ", clientId: randomUUID() });
  assert.equal(invalid.error, "invalid-request");
  await first.timeout(1000).emitWithAck("chat:send", { id: "test-order", text: "hello", clientId: randomUUID() });
  assert.equal((await join(second)).messages.length, 0);
});

test("API mode rejects demo authentication and expired membership before sending", async t => {
  let authorized = false, writes = 0;
  const { client } = await setup(t, { mock: false, fetchImpl: async (url, init) => {
    if (!authorized) return Response.json({ error: "unauthorized" }, { status: 401 });
    if (init.method === "POST") writes++;
    if (url.endsWith("/api/requests")) return Response.json({ user: { id: "customer", role: "customer" } });
    return Response.json(fixture());
  } });
  await assert.rejects(client(), /unauthorized/);
  authorized = true;
  const socket = await client();
  assert.equal((await join(socket)).ok, true);
  authorized = false;
  assert.equal((await socket.timeout(1000).emitWithAck("chat:send", { id: "test-order", text: "hello" })).error, "unauthorized");
  assert.equal(writes, 0);
});

test("customer and employee exchange real messages in the shared preview without simulated replies", async t => {
  const { client } = await setup(t, { allowedOrigins: ["http://127.0.0.1:3102"] });
  const customer = await client(undefined, { auth: { demo: true, shared: true, session: randomUUID() } });
  const employee = await client(undefined, { auth: { demo: true, shared: true, session: randomUUID(), employee: { email: "sofia@ascend.demo", password: "Ascend@123" } }, extraHeaders: { origin: "http://127.0.0.1:3102" } });
  const list = await employee.timeout(1000).emitWithAck("chat:list", {});
  assert.equal(list.user.role, "employee");
  assert.ok(list.requests.every(request => request.employeeId === "emp-sofia"));
  const id = "DEMO-1055";
  await customer.timeout(1000).emitWithAck("chat:join", { id });
  const initial = await employee.timeout(1000).emitWithAck("chat:join", { id });
  const incoming = new Promise(resolve => customer.once("chat:update", resolve));
  const payload = { id, text: "Sofia is ready", clientId: randomUUID(), senderRole: "customer" };
  const result = await employee.timeout(1000).emitWithAck("chat:send", payload);
  const update = await incoming;
  assert.equal(result.ok, true);
  assert.equal(update.messages.length, initial.messages.length + 1);
  assert.equal(update.messages.at(-1).senderRole, "employee");
  assert.equal(update.messages.at(-1).senderName, "Sofia");
  assert.equal((await employee.timeout(1000).emitWithAck("chat:send", payload)).messages.length, update.messages.length);
  const reply = new Promise(resolve => employee.once("chat:update", resolve));
  await customer.timeout(1000).emitWithAck("chat:send", { id, text: "Minh Anh is ready", clientId: randomUUID() });
  assert.equal((await reply).messages.at(-1).senderRole, "customer");
  const forbidden = await employee.timeout(1000).emitWithAck("chat:join", { id: "DEMO-1054" });
  assert.equal(forbidden.error, "forbidden");
  assert.equal((await employee.timeout(1000).emitWithAck("chat:send", { id: "DEMO-1054", text: "Wrong order", clientId: randomUUID() })).error, "forbidden");
  await assert.rejects(client(undefined, { auth: { demo: true, shared: true, session: randomUUID(), employee: { email: "sofia@ascend.demo", password: "wrong" } } }), /unauthorized/);
});

test("API employee cannot subscribe to a conversation assigned to someone else", async t => {
  const { client } = await setup(t, { mock: false, fetchImpl: async url => url.endsWith("/api/requests") ? Response.json({ user: { id: "different-employee", role: "employee" } }) : Response.json(fixture()) });
  const employee = await client();
  assert.equal((await join(employee)).error, "forbidden");
});

test("employee gets unread notifications without opening chat and reading clears all its sockets", async t => {
  const { client } = await setup(t);
  const customer = await client(undefined, { auth: { demo: true, shared: true, session: randomUUID() } });
  const auth = { demo: true, shared: true, session: randomUUID(), employee: { email: "sofia@ascend.demo", password: "Ascend@123" } };
  const notificationSocket = await client(undefined, { auth });
  const chatSocket = await client(undefined, { auth });
  assert.equal((await notificationSocket.timeout(1000).emitWithAck("chat:unread:get", {})).unread.total, 0);
  const notification = new Promise(resolve => notificationSocket.once("chat:unread", resolve));
  const sent = await customer.timeout(1000).emitWithAck("chat:send", { id: "DEMO-1055", text: "Notify Sofia", clientId: randomUUID() });
  assert.equal((await notification).total, 1);
  const cleared = new Promise(resolve => notificationSocket.once("chat:unread", resolve));
  const receipt = await chatSocket.timeout(1000).emitWithAck("chat:read", { id: "DEMO-1055", messageId: sent.messages.at(-1).id });
  assert.equal(receipt.ok, true);
  assert.equal((await cleared).total, 0);
  const reconnect = await client(undefined, { auth });
  assert.equal((await reconnect.timeout(1000).emitWithAck("chat:unread:get", {})).unread.total, 0);
});

test("customer receives employee unread counts outside chat and preserves them across reconnect", async t => {
  const { client } = await setup(t);
  const auth = { demo: true, shared: true, session: randomUUID() };
  const customer = await client(undefined, { auth });
  const employee = await client(undefined, { auth: { ...auth, employee: { email: "sofia@ascend.demo", password: "Ascend@123" } } });
  const notification = new Promise(resolve => customer.once("chat:unread", resolve));
  const sent = await employee.timeout(1000).emitWithAck("chat:send", { id: "DEMO-1055", text: "New booster update", clientId: randomUUID() });
  const unread = await notification;
  assert.equal(unread.total, 1);
  assert.deepEqual(unread.byRequest, { "DEMO-1055": 1 });
  const reconnected = await client(undefined, { auth });
  assert.deepEqual((await reconnected.timeout(1000).emitWithAck("chat:unread:get", {})).unread, unread);
  const unrelated = await customer.timeout(1000).emitWithAck("chat:join", { id: "DEMO-1054" });
  await customer.timeout(1000).emitWithAck("chat:read", { id: "DEMO-1054", messageId: unrelated.messages.at(-1).id });
  assert.equal((await customer.timeout(1000).emitWithAck("chat:unread:get", {})).unread.total, 1);
  await reconnected.timeout(1000).emitWithAck("chat:read", { id: "DEMO-1055", messageId: sent.messages.at(-1).id });
  assert.equal((await customer.timeout(1000).emitWithAck("chat:unread:get", {})).unread.total, 0);
});

test("placing and claiming an order links exactly one employee to its customer chat", async t => {
  const { client } = await setup(t);
  const customer = await client(undefined, { auth: { demo: true, shared: true, session: randomUUID() } });
  const auth = email => ({ demo: true, shared: true, session: randomUUID(), employee: { email, password: "Ascend@123" } });
  const zen = await client(undefined, { auth: auth("zero@ascend.demo") });
  const sofia = await client(undefined, { auth: auth("sofia@ascend.demo") });
  const input = { submissionId: randomUUID(), game: "valorant", service: "rank-boost", currentRank: "Gold IV", targetRank: "Platinum IV", region: "VN2", riotAccount: { riotPass: "must-not-persist" } };
  const created = await customer.timeout(2000).emitWithAck("workflow:create", input);
  assert.equal(created.ok, true);
  assert.equal(created.order.status, "OPEN");
  assert.equal(created.request.employeeId, null);
  assert.equal(JSON.stringify(created).includes("must-not-persist"), false);
  const id = created.request.id;
  assert.equal((await customer.timeout(1000).emitWithAck("workflow:create", input)).request.id, id);
  assert.equal((await customer.timeout(1000).emitWithAck("chat:send", { id, text: "Before claim", clientId: randomUUID() })).error, "not-assigned");
  const available = await zen.timeout(1000).emitWithAck("workflow:sync", {});
  assert.equal(available.workflow.orders.find(row => row.id === id).customer.name, "");
  const changed = new Promise(resolve => customer.once("chat:update", resolve));
  const claimed = await zen.timeout(1000).emitWithAck("workflow:claim", { id });
  assert.equal(claimed.ok, true);
  assert.equal(claimed.order.employeeId, "emp-zero");
  assert.equal((await changed).request.employeeName, "Zero");
  assert.equal(claimed.request.employeeId, claimed.order.employeeId);
  assert.equal((await sofia.timeout(1000).emitWithAck("workflow:claim", { id })).error, "ORDER_ALREADY_CLAIMED");
  assert.equal((await sofia.timeout(1000).emitWithAck("chat:join", { id })).error, "forbidden");
  const sent = await zen.timeout(1000).emitWithAck("chat:send", { id, text: "Zero is your booster", clientId: randomUUID() });
  assert.equal(sent.messages.at(-1).senderId, "emp-zero");
  const progress = await zen.timeout(1000).emitWithAck("workflow:update", { id, action: "progress", progress: 35 });
  assert.equal(progress.order.progress, 35);
  assert.equal((await customer.timeout(1000).emitWithAck("workflow:sync", {})).workflow.orders.find(row => row.id === id).employeeId, "emp-zero");
  const extra = await customer.timeout(1000).emitWithAck("workflow:create", { ...input, submissionId: randomUUID() });
  assert.equal((await zen.timeout(1000).emitWithAck("workflow:claim", { id: extra.request.id })).error, "ORDER_LIMIT");
  assert.equal((await customer.timeout(1000).emitWithAck("workflow:claim", { id: extra.request.id })).error, "forbidden");
});

test("concurrent eligible employee claims have one winner and matching chat ownership", async t => {
  const fixture = workflowFixture();
  fixture.employees.find(row => row.id === "emp-nova").maxActiveOrders = 2;
  fixture.employees.find(row => row.id === "emp-zen").maxActiveOrders = 3;
  const { client } = await setup(t, { workflowSeed: fixture });
  const customer = await client(undefined, { auth: { demo: true, shared: true, session: randomUUID() } });
  const employee = email => client(undefined, { auth: { demo: true, shared: true, session: randomUUID(), employee: { email, password: "Ascend@123" } } });
  const nova = await employee("nova@ascend.demo"), zen = await employee("zen@ascend.demo");
  const created = await customer.timeout(1000).emitWithAck("workflow:create", { submissionId: randomUUID(), game: "league-of-legends", service: "rank-boost" });
  const id = created.request.id;
  const results = await Promise.all([nova, zen].map(socket => socket.timeout(1000).emitWithAck("workflow:claim", { id })));
  assert.equal(results.filter(row => row.ok).length, 1);
  assert.equal(results.find(row => !row.ok).error, "ORDER_ALREADY_CLAIMED");
  const detail = await customer.timeout(1000).emitWithAck("chat:join", { id });
  assert.equal(detail.request.employeeId, results.find(row => row.ok).order.employeeId);
});
