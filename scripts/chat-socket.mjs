import { Server } from "socket.io";

export function attachChatSocketServer(httpServer, { origin, fetchImpl = fetch, allowedOrigins = [] }) {
  const origins = [origin, ...allowedOrigins];
  const io = new Server(httpServer, {
    maxHttpBufferSize: 250_000,
    cors: { origin: origins, credentials: true },
    allowRequest: (request, done) => done(null, !request.headers.origin || origins.includes(request.headers.origin)),
  });

  async function api(socket, path, method = "GET", body) {
    const response = await fetchImpl(`${origin}${path}`, {
      method,
      headers: { cookie: socket.handshake.headers.cookie ?? "", origin, "Content-Type": "application/json" },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: AbortSignal.timeout(10000),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error ?? "connection");
    return data;
  }

  let checkingCoaches = false;
  let coachRevision = "";
  async function checkCoaches() {
    if (checkingCoaches || !io.sockets.adapter.rooms.get("public-coaches")?.size) return;
    checkingCoaches = true;
    try {
      const response = await fetchImpl(`${origin}/api/coaches`, { signal: AbortSignal.timeout(5000) });
      if (!response.ok) return;
      const data = await response.json();
      const revision = JSON.stringify((data.coaches ?? []).map((coach) => [coach.slug, coach.online, coach.riotProfile?.history?.updatedAt ?? 0]));
      if (revision !== coachRevision) {
        coachRevision = revision;
        io.to("public-coaches").emit("coach:changed");
      }
    } catch { /* Keep the last successful snapshot. */ }
    finally { checkingCoaches = false; }
  }
  const coachTimer = setInterval(checkCoaches, 2000);
  coachTimer.unref();

  async function unread(socket) {
    return (await api(socket, "/api/requests/unread")).unread;
  }
  async function pushUnread(ids) {
    const users = ids.filter(Boolean);
    await Promise.all([...io.sockets.sockets.values()].filter((socket) => users.includes(socket.data.user?.id)).map(async (socket) => {
      try { socket.emit("chat:unread", await unread(socket)); }
      catch { socket.disconnect(true); }
    }));
  }

  io.use(async (socket, next) => {
    try {
      if (socket.handshake.auth.publicCoaches === true) {
        socket.data.publicCoaches = true;
      } else {
        const data = await api(socket, "/api/requests");
        if (!data.user) throw new Error("unauthorized");
        socket.data.user = data.user;
      }
      next();
    } catch { next(new Error("unauthorized")); }
  });

  io.notifyRequestChanged = async (request, id) => {
    const data = await api({ handshake: { headers: request.headers } }, `/api/requests/${encodeURIComponent(id)}`);
    const update = { request: data.request, messages: data.messages };
    io.to([`user:${data.request.customerId}`, `user:${data.request.employeeId}`]).emit("chat:update", update);
    io.to(`user:${data.request.customerId}`).emit("chat:changed", { id });
    io.to("employees").emit("chat:changed", { id });
    await pushUnread([data.request.customerId, data.request.employeeId]);
  };

  io.on("connection", (socket) => {
    if (socket.data.publicCoaches) {
      socket.join("public-coaches");
      socket.emit("coach:changed");
      void checkCoaches();
      return;
    }
    const user = socket.data.user;
    socket.join(`user:${user.id}`);
    if (user.role === "employee") socket.join("employees");
    const safe = (handler) => async (payload, ack) => {
      if (typeof ack !== "function") return;
      try { ack({ ok: true, ...await handler(payload ?? {}) }); }
      catch (error) { ack({ ok: false, error: error.message ?? "connection" }); }
    };
    async function detail(id) {
      if (typeof id !== "string" || id.length > 120) throw new Error("invalid-request");
      const data = await api(socket, `/api/requests/${encodeURIComponent(id)}`);
      if (user.role === "employee" && data.request.employeeId !== user.id) throw new Error("forbidden");
      return data;
    }
    async function broadcast(data) {
      const update = { request: data.request, messages: data.messages };
      io.to([`user:${data.request.customerId}`, `user:${data.request.employeeId}`]).emit("chat:update", update);
      io.to(`user:${data.request.customerId}`).emit("chat:changed", { id: data.request.id });
      if (data.request.employeeId) io.to(`user:${data.request.employeeId}`).emit("chat:changed", { id: data.request.id });
      await pushUnread([data.request.customerId, data.request.employeeId]);
      return update;
    }
    socket.on("chat:unread:get", safe(async () => ({ unread: await unread(socket) })));
    socket.on("chat:read", safe(async ({ id, messageId }) => {
      await detail(id);
      if (typeof messageId !== "string" || !messageId || messageId.length > 120) throw new Error("invalid-request");
      await api(socket, `/api/requests/${encodeURIComponent(id)}/read`, "POST", { messageId });
      await pushUnread([user.id]);
      return { unread: await unread(socket) };
    }));
    socket.on("chat:list", safe(async () => {
      const data = await api(socket, "/api/requests");
      return { user: data.user, requests: data.requests.filter((request) => data.user.role !== "employee" || request.employeeId === data.user.id) };
    }));
    socket.on("chat:join", safe(async ({ id }) => {
      const data = await detail(id);
      if (socket.data.active) socket.leave(`request:${socket.data.active}`);
      socket.data.active = id;
      socket.join(`request:${id}`);
      return { request: data.request, messages: data.messages };
    }));
    socket.on("chat:send", safe(async ({ id, text, clientId }) => {
      if (typeof text !== "string" || !text.trim() || text.length > 2000) throw new Error("invalid-request");
      const data = await detail(id);
      if (data.request.status === "resolved") throw new Error("not-assigned");
      await api(socket, `/api/requests/${encodeURIComponent(id)}`, "POST", { text, clientId });
      return broadcast(await detail(id));
    }));
  });
  const close = io.close.bind(io);
  io.close = (callback) => {
    clearInterval(coachTimer);
    return close(callback);
  };
  return io;
}
