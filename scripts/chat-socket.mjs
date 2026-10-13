import { randomUUID } from "node:crypto";
import { Server } from "socket.io";
import preview from "../mocks/chat-preview.json" with { type: "json" };
import employeeAccounts from "../mocks/employee-accounts.json" with { type: "json" };
import { createDemoChatStore } from "./demo-chat-store.mjs";

export function attachChatSocketServer(httpServer, { origin, mock = false, fetchImpl = fetch, allowedOrigins = [], workflowSeed, demoDatabasePath = "preview" }) {
  const sessions = new Map();
  let sharedStore;
  const store = () => sharedStore ??= createDemoChatStore(demoDatabasePath);
  let workflowInitialization;
  async function prepareWorkflow(cached) {
    if (!workflowInitialization) workflowInitialization = (async () => {
      const fixture = workflowSeed ?? await fetchImpl(`${origin}/api/mock/workflow`, { signal: AbortSignal.timeout(10000) }).then(async response => {
        if (!response.ok) throw new Error("connection");
        return (await response.json()).workflow;
      });
      store().seedWorkflow(fixture, cached);
    })().catch(error => { workflowInitialization = undefined; throw error; });
    await workflowInitialization;
  }
  const origins = [origin, ...allowedOrigins];
  const io = new Server(httpServer, {
    maxHttpBufferSize: 250_000,
    cors: { origin: origins, credentials: true },
    allowRequest: (req, done) => done(null, !req.headers.origin || origins.includes(req.headers.origin)),
  });
  let checkingCoaches = false;
  let coachRevision = "";
  async function checkCoaches() {
    if (checkingCoaches || !io.sockets.adapter.rooms.get("public-coaches")?.size) return;
    checkingCoaches = true;
    try {
      // Both preview ports share the database. Read persisted snapshots, never query Riot here.
      const response = await fetchImpl(`${origin}/api/coaches`, { signal: AbortSignal.timeout(5000) });
      if (!response.ok) return;
      const data = await response.json();
      const revision = JSON.stringify((data.coaches ?? []).map(coach => [coach.slug, coach.online, coach.riotProfile?.history?.updatedAt ?? 0]));
      if (revision !== coachRevision) { coachRevision = revision; io.to("public-coaches").emit("coach:changed"); }
    } catch { /* Recheck on the next tick; retain the last successful public snapshot. */ }
    finally { checkingCoaches = false; }
  }
  const coachTimer = setInterval(checkCoaches, 2000);
  coachTimer.unref();
  io.engine.on("close", () => clearInterval(coachTimer));
  async function api(socket, path, method = "GET", body) {
    const response = await fetchImpl(`${origin}${path}`, {
      method, headers: { cookie: socket.handshake.headers.cookie ?? "", origin, "Content-Type": "application/json" },
      ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(10000),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error ?? "connection");
    return data;
  }
  async function unread(socket) {
    if (socket.data.shared) return store().unread(socket.data.user);
    if (socket.data.demo) return { total: 0, byRequest: {} };
    return (await api(socket, "/api/requests/unread")).unread;
  }
  async function pushUnread(ids, shared) {
    const users = ids.filter(Boolean);
    await Promise.all([...io.sockets.sockets.values()].filter(socket => Boolean(socket.data.shared) === Boolean(shared) && users.includes(socket.data.user?.id)).map(async socket => {
      try { socket.emit("chat:unread", await unread(socket)); }
      catch { socket.disconnect(true); }
    }));
  }
  io.use(async (socket, next) => {
    try {
      if (socket.handshake.auth.publicCoaches === true) { socket.data.publicCoaches = true; next(); return; }
      if (mock && socket.handshake.auth.demo === true) {
        const key = socket.handshake.auth.session;
        if (typeof key !== "string" || !/^[a-f0-9-]{36}$/.test(key)) throw new Error("unauthorized");
        if (socket.handshake.auth.shared === true) {
          const employee = socket.handshake.auth.employee;
          const account = employee ? employeeAccounts.find(account => account.email === employee.email && account.password === employee.password) : preview.customer;
          if (!account) throw new Error("unauthorized");
          socket.data.shared = true;
          socket.data.user = { id: account.id, name: account.name, email: account.email, role: employee ? "employee" : "customer" };
        } else {
          socket.data.demo = key;
          if (!sessions.has(key)) sessions.set(key, new Map());
        }
      } else {
        const data = await api(socket, "/api/requests");
        socket.data.user = data.user;
        if (!data.user) throw new Error("unauthorized");
      }
      next();
    } catch { next(new Error("unauthorized")); }
  });
  io.notifyRequestChanged = async (request, id) => {
    const data = await api({ handshake: { headers: request.headers } }, `/api/requests/${id}`);
    const update = { request: data.request, messages: data.messages };
    io.to([`user:${data.request.customerId}`, `user:${data.request.employeeId}`]).emit("chat:update", update);
    io.to(`user:${data.request.customerId}`).emit("chat:changed", { id });
    io.to("employees").emit("chat:changed", { id });
    await pushUnread([data.request.customerId, data.request.employeeId], false);
  };
  io.on("connection", socket => {
    if (socket.data.publicCoaches) {
      socket.join("public-coaches");
      socket.emit("coach:changed");
      void checkCoaches();
      return; // Public viewers cannot invoke chat or employee commands.
    }
    const demo = socket.data.demo;
    const shared = socket.data.shared;
    if (shared) { socket.join(`preview-user:${socket.data.user.id}`); socket.join("preview-workflow"); }
    else if (!demo) {
      socket.join(`user:${socket.data.user.id}`);
      if (socket.data.user.role === "employee") socket.join("employees");
    }
    const room = id => shared ? `preview-request:${id}` : demo ? `demo:${demo}:${id}` : `request:${id}`;
    const safe = handler => async (payload, ack) => {
      if (typeof ack !== "function") return;
      try { ack({ ok: true, ...await handler(payload ?? {}) }); }
      catch (error) { ack({ ok: false, error: error.message ?? "connection" }); }
    };
    async function detail(id) {
      if (typeof id !== "string" || id.length > 120) throw new Error("invalid-request");
      if (shared) return store().get(id, socket.data.user);
      if (demo) {
        const result = sessions.get(demo)?.get(id);
        if (!result) throw new Error("not-found");
        return result;
      }
      // Recheck the cookie and membership for every operation, including after reconnect.
      const data = await api(socket, `/api/requests/${encodeURIComponent(id)}`);
      if (socket.data.user.role === "employee" && data.request.employeeId !== socket.data.user.id) throw new Error("forbidden");
      return data;
    }
    async function broadcast(data) {
      // Private order details are never broadcast to customer rooms.
      const update = { request: data.request, messages: data.messages };
      const rooms = shared ? [`preview-user:${data.request.customerId}`, `preview-user:${data.request.employeeId}`] : demo ? [room(data.request.id)] : [`user:${data.request.customerId}`, `user:${data.request.employeeId}`];
      io.to(rooms).emit("chat:update", update);
      if (!demo && !shared) io.to(`user:${data.request.customerId}`).emit("chat:changed", { id: data.request.id });
      if (!demo && !shared && data.request.employeeId) io.to(`user:${data.request.employeeId}`).emit("chat:changed", { id: data.request.id });
      if (!demo) await pushUnread([data.request.customerId, data.request.employeeId], shared);
      return update;
    }
    socket.on("workflow:sync", safe(async ({ cached }) => {
      if (!shared) throw new Error("forbidden");
      await prepareWorkflow(Array.isArray(cached) ? cached : []);
      return { workflow: store().workflow(socket.data.user) };
    }));
    const orderMutation = handler => safe(async payload => {
      if (!shared) throw new Error("forbidden");
      await prepareWorkflow();
      const result = handler(payload);
      await broadcast(result);
      // No customer details in the event; each viewer requests a scoped projection.
      io.to("preview-workflow").emit("workflow:changed");
      return { ...result, workflow: store().workflow(socket.data.user) };
    });
    socket.on("workflow:create", orderMutation(input => store().createOrder(socket.data.user, input)));
    socket.on("workflow:claim", orderMutation(({ id }) => store().claimOrder(id, socket.data.user)));
    socket.on("workflow:update", orderMutation(({ id, action, progress }) => store().updateOrder(id, socket.data.user, action, progress)));
    socket.on("chat:unread:get", safe(async () => ({ unread: await unread(socket) })));
    socket.on("chat:read", safe(async ({ id, messageId }) => {
      await detail(id);
      if (typeof messageId !== "string" || !messageId || messageId.length > 120) throw new Error("invalid-request");
      if (shared) store().markRead(id, socket.data.user, messageId);
      else if (!demo) await api(socket, `/api/requests/${encodeURIComponent(id)}/read`, "POST", { messageId });
      if (!demo) await pushUnread([socket.data.user.id], shared);
      return { unread: await unread(socket) };
    }));
    socket.on("chat:list", safe(async () => {
      if (shared) return { user: socket.data.user, requests: store().list(socket.data.user) };
      if (demo) return { user: preview.customer, requests: [...sessions.get(demo).values()].map(data => data.request) };
      const data = await api(socket, "/api/requests");
      return { user: data.user, requests: data.requests.filter(request => data.user.role !== "employee" || request.employeeId === data.user.id) };
    }));
    socket.on("chat:join", safe(async ({ id, seed }) => {
      if (shared) store().register(id, seed, socket.data.user);
      if (demo && !sessions.get(demo).has(id)) {
        if (!seed?.request || seed.request.id !== id || !Array.isArray(seed.messages) || seed.messages.length > 1000) throw new Error("invalid-request");
        sessions.get(demo).set(id, structuredClone(seed));
      }
      const data = await detail(id);
      if (socket.data.active) socket.leave(room(socket.data.active));
      socket.data.active = id;
      socket.join(room(id));
      return { request: data.request, messages: data.messages };
    }));
    socket.on("chat:send", safe(async ({ id, text, clientId }) => {
      if (typeof text !== "string" || !text.trim() || text.length > 2000) throw new Error("invalid-request");
      const data = await detail(id);
      if (data.request.status === "resolved") throw new Error("not-assigned");
      if (shared) {
        Object.assign(data, store().send(id, socket.data.user, text, clientId));
      } else if (demo) {
        if (typeof clientId !== "string" || clientId.length > 80) throw new Error("invalid-request");
        if (data.messages.some(message => message.id === clientId)) return { request: data.request, messages: data.messages };
        const now = Date.now();
        data.messages.push({ id: clientId, senderId: data.request.customerId, senderName: data.request.customerName, senderRole: "customer", text: text.trim(), createdAt: now });
        data.messages.push({ id: randomUUID(), senderId: data.request.employeeId ?? "demo-team", senderName: data.request.employeeName ?? "ASCEND", senderRole: "employee", text: "Mình đã nhận tin nhắn của bạn. Đây là phản hồi mẫu để bạn thử chat thời gian thực.", createdAt: now + 1 });
        data.request.updatedAt = now + 1;
        data.request.lastMessage = data.messages.at(-1).text;
      } else {
        await api(socket, `/api/requests/${encodeURIComponent(id)}`, "POST", { text, clientId });
        Object.assign(data, await detail(id));
      }
      return broadcast(data);
    }));
  });
  // Demo sessions are temporary; idle sessions expire to bound server memory.
  const cleanup = setInterval(() => {
    const active = new Set([...io.sockets.sockets.values()].map(socket => socket.data.demo));
    for (const key of sessions.keys()) if (!active.has(key)) sessions.delete(key);
  }, 60_000);
  cleanup.unref();
  const close = io.close.bind(io);
  io.close = callback => {
    clearInterval(cleanup);
    return close(() => { sharedStore?.close(); callback?.(); });
  };
  return io;
}
