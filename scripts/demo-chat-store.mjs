import preview from "../mocks/chat-preview.json" with { type: "json" };

const mockStores = new Map();

export function createDemoChatStore(key = "preview") {
  const state = key === ":memory:" ? { chats: new Map(), reads: new Map(), orders: new Map(), employees: new Map() }
    : mockStores.get(key) ?? { chats: new Map(), reads: new Map(), orders: new Map(), employees: new Map() };
  if (key !== ":memory:") mockStores.set(key, state);
  const { chats, reads, orders, employees } = state;
  for (const request of preview.requests) {
    const rows = [
      ["customer", "Mình muốn trao đổi về lịch chơi và mục tiêu của mình."],
      ["employee", "Chào Minh Anh 👋"], ["employee", "Bạn muốn bắt đầu lúc mấy giờ?"],
      ["employee", "Mình sẽ chuẩn bị kế hoạch theo mục tiêu của bạn."],
      ["customer", "Khoảng 20:00 tối nay nhé 😊"], ["employee", "Được nhé! Hẹn gặp bạn lúc 20:00."],
      ["customer", "Cảm ơn bạn 👍"], ["employee", request.lastMessage],
    ];
    const messages = rows.map(([role, text], index) => ({ id: `${request.id}-seed-${index}`, senderId: role === "employee" ? request.employeeId : request.customerId, senderName: role === "employee" ? request.employeeName : request.customerName, senderRole: role, text, createdAt: request.updatedAt - (7 - index) * 10000 }));
    if (!chats.has(request.id)) chats.set(request.id, { request, messages });
  }
  const accessible = (request, user) => user.role === "employee" ? request.employeeId === user.id : request.customerId === user.id;
  const read = id => chats.has(id) ? structuredClone(chats.get(id)) : null;
  function get(id, user) {
    const data = read(id);
    if (!data || !accessible(data.request, user)) throw new Error("forbidden");
    return data;
  }
  const cursor = (id, user, data) => reads.get(`${user.id}:${id}`) ?? data.messages.reduce((last, message, index) => message.id.startsWith(`${id}-seed-`) ? index + 1 : last, 0);
  const allOrders = () => [...orders.values()].map(row => structuredClone(row));
  const order = id => { const row = orders.get(id); if (!row) throw new Error("not-found"); return structuredClone(row); };
  const saveOrder = row => orders.set(row.id, structuredClone(row));
  const saveChat = data => chats.set(data.request.id, structuredClone(data));
  const active = row => ["CLAIMED", "IN_PROGRESS", "PAUSED", "PENDING_REVIEW", "DISPUTED"].includes(row.status);
  function syncOrderChat(row, employee) {
    const service = row.service === "Rank Boost" && /duo/i.test(row.queue) ? "Duo boost" : row.service;
    const data = read(row.id) ?? { request: { id: row.id, customerId: row.customer.id, customerName: row.customer.name, game: row.game, subject: `${service} · ${row.game}`, lastMessage: "" }, messages: [] };
    Object.assign(data.request, { employeeId: row.employeeId ?? null, employeeName: employee?.name ?? null, employeeOnline: employee ? 1 : 0, status: ["COMPLETED", "CANCELLED", "REFUNDED"].includes(row.status) ? "resolved" : row.employeeId ? "assigned" : "open", updatedAt: Date.parse(row.updatedAt) });
    saveChat(data);
    return data;
  }
  return {
    get,
    seedWorkflow(fixture, cached = []) {
      for (const employee of fixture.employees) if (!employees.has(employee.id)) employees.set(employee.id, structuredClone(employee));
      const fixtureEmployees = fixture.employees;
      for (const base of fixture.orders) {
        if (base.id === "ASC-1054") continue; // Old Sofia placeholder is replaced by its existing customer conversation.
        if (orders.has(base.id)) continue;
        const saved = cached.find(row => row?.id === base.id);
        const valid = saved && ["OPEN", "PENDING_PAYMENT", "CLAIMED", "IN_PROGRESS", "PAUSED", "PENDING_REVIEW", "COMPLETED", "CANCELLED", "DISPUTED", "REFUNDED"].includes(saved.status) && (!active(saved) || saved.employeeId) && (!saved.employeeId || fixtureEmployees.some(e => e.id === saved.employeeId));
        const row = valid ? { ...base, status: saved.status, employeeId: saved.employeeId, progress: Number.isFinite(saved.progress) && saved.progress >= 0 && saved.progress <= 100 ? saved.progress : base.progress, updatedAt: Number.isFinite(Date.parse(saved.updatedAt)) ? saved.updatedAt : base.updatedAt } : base;
        saveOrder(row);
        syncOrderChat(row, fixtureEmployees.find(e => e.id === row.employeeId));
      }
      const template = fixture.orders.find(row => row.id === "ASC-1054") ?? fixture.orders[0];
      for (const request of preview.requests) {
        if (orders.has(request.id)) continue;
        const data = read(request.id);
        const existing = data.request;
        const row = { ...template, id: existing.id, game: existing.game === "valorant" ? "Valorant" : existing.game === "teamfight-tactics" ? "Teamfight Tactics" : "League of Legends", service: existing.subject.toLowerCase().includes("coaching") ? "Coaching" : "Rank Boost", customer: { id: existing.customerId, name: existing.customerName, email: "", country: "VN", timezone: "Asia/Ho_Chi_Minh" }, employeeId: existing.employeeId ?? undefined, status: existing.status === "resolved" ? "COMPLETED" : existing.employeeId ? "IN_PROGRESS" : "OPEN", progress: existing.status === "resolved" ? 100 : 0, updatedAt: new Date(existing.updatedAt).toISOString() };
        const saved = cached.find(saved => saved?.id === existing.id || (existing.employeeId === preview.employee.id && saved?.id === "ASC-1054"));
        if (saved?.employeeId === existing.employeeId && Number.isFinite(saved.progress) && saved.progress >= 0 && saved.progress <= 100) row.progress = saved.progress;
        saveOrder(row);
      }
    },
    workflow(user) {
      const rows = allOrders();
      const viewer = employees.get(user.id) ?? null;
      const orders = rows.filter(row => user.role === "employee" ? row.employeeId === user.id || (row.status === "OPEN" && !row.employeeId && viewer?.games.includes(row.game) && viewer.type === (row.service === "Coaching" ? "COACH" : "BOOSTER")) : row.customer.id === user.id).map(row => user.role === "employee" && row.employeeId !== user.id ? { ...row, customer: { id: "", name: "", email: "", country: "", timezone: "" }, riotId: "", instructions: "", adminNotes: "", employeeNotes: "" } : row);
      return { orders, ids: rows.map(row => row.id) };
    },
    createOrder(user, input) {
      if (user.role !== "customer" || typeof input?.submissionId !== "string" || !/^[a-f0-9-]{36}$/.test(input.submissionId)) throw new Error("invalid-request");
      const id = `ASC-${input.submissionId}`;
      const existing = orders.has(id);
      if (existing) { const row = order(id); if (row.customer.id !== user.id) throw new Error("forbidden"); return { order: row, ...get(id, user) }; }
      const games = { "league-of-legends": "League of Legends", valorant: "Valorant", "teamfight-tactics": "Teamfight Tactics" };
      const services = { "rank-boost": "Rank Boost", "duo-boost": "Rank Boost", placements: "Placement Matches", "placement-matches": "Placement Matches", coaching: "Coaching" };
      if (!games[input.game] || !services[input.service]) throw new Error("invalid-request");
      const text = key => typeof input[key] === "string" ? input[key].slice(0, 2000) : "";
      const now = new Date().toISOString();
      const amount = Number.isFinite(input.amount) && input.amount >= 0 && input.amount <= 100000 ? input.amount : 0;
      // Explicit whitelist: account passwords and billing details never enter the mock projection.
      const row = { id, customer: { id: user.id, name: user.name, email: user.email, country: "VN", timezone: "Asia/Ho_Chi_Minh" }, game: games[input.game], service: services[input.service], region: text("region"), currentRank: text("currentRank"), targetRank: text("targetRank"), queue: text("queue"), instructions: text("customerNotes"), riotId: "", currentLP: 0, milestones: [], options: [], priority: "Standard", status: "OPEN", progress: 0, amount: 0, reward: 0, createdAt: now, updatedAt: now, deadline: new Date(Date.now()+86400000).toISOString(), estimatedDuration: "12–16 giờ", difficulty: "Tiêu chuẩn", refundedAmount: 0, adminNotes: "", employeeNotes: "" };
      row.amount = amount; row.reward = Math.round(amount * 5000);
      row.paymentStatus = "PAID";
      if (input.service === "coaching") {
        const booking = input.coaching ?? {};
        const quantity = Number.isSafeInteger(booking.quantity) && booking.quantity >= 1 && booking.quantity <= 10 ? booking.quantity : 1;
        const clean = key => typeof booking[key] === "string" ? booking[key].slice(0, 120) : "";
        row.coaching = { coachId: clean("coachId"), coachName: clean("coachName"), quantity, sessionFormat: booking.sessionFormat === "vod" ? "vod" : "live", date: clean("date"), time: clean("time"), timeZone: clean("timeZone") };
        row.estimatedDuration = `${quantity} giờ`;
        row.options = [row.coaching.coachName && `Coach ${row.coaching.coachName}`, row.coaching.sessionFormat === "vod" ? "VOD review" : "Live session", row.estimatedDuration].filter(Boolean);
      }
      if (input.service === "duo-boost") row.options.push("Duo boost");
      saveOrder(row);
      return { order: row, ...syncOrderChat(row) };
    },
    claimOrder(id, user) {
      if (user.role !== "employee") throw new Error("forbidden");
      try {
        const row = order(id);
        const employee = employees.get(user.id);
        if (row.status !== "OPEN" || row.employeeId) throw new Error("ORDER_ALREADY_CLAIMED");
        if (!employee || employee.status !== "ACTIVE" || !employee.games.includes(row.game) || employee.type !== (row.service === "Coaching" ? "COACH" : "BOOSTER")) throw new Error("FORBIDDEN");
        if (allOrders().filter(row => row.employeeId === user.id && active(row)).length >= employee.maxActiveOrders) throw new Error("ORDER_LIMIT");
        row.employeeId = user.id; row.status = "IN_PROGRESS"; row.startedAt = row.updatedAt = new Date().toISOString();
        saveOrder(row);
        const chat = syncOrderChat(row, employee);
        return { order: row, ...chat };
      } catch(error) { throw error; }
    },
    updateOrder(id, user, action, progress) {
      const row = order(id);
      if (user.role !== "employee" || row.employeeId !== user.id || row.status !== "IN_PROGRESS") throw new Error("forbidden");
      if (action === "complete") { row.status = "PENDING_REVIEW"; row.progress = 100; }
      else if (action === "progress" && Number.isFinite(progress) && progress >= row.progress && progress <= 100) row.progress = progress;
      else throw new Error("invalid-request");
      row.updatedAt = new Date().toISOString(); saveOrder(row);
      return { order: row, ...syncOrderChat(row, user) };
    },
    unread(user) {
      const byRequest = {};
      for (const data of chats.values()) {
        if (!accessible(data.request, user)) continue;
        const count = data.messages.slice(cursor(data.request.id, user, data)).filter(message => message.senderId !== user.id).length;
        if (count) byRequest[data.request.id] = count;
      }
      return { total: Object.values(byRequest).reduce((total, count) => total + count, 0), byRequest };
    },
    markRead(id, user, messageId) {
      const data = get(id, user);
      const index = data.messages.findIndex(message => message.id === messageId);
      if (index < 0) throw new Error("invalid-request");
      const seen = Math.max(cursor(id, user, data), index + 1);
      reads.set(`${user.id}:${id}`, Math.max(reads.get(`${user.id}:${id}`) ?? 0, seen));
      return this.unread(user);
    },
    list(user) { return [...chats.values()].map(data => structuredClone(data.request)).filter(request => accessible(request, user)).sort((a, b) => b.updatedAt - a.updatedAt); },
    register(id, seed, user) {
      if (read(id)) return;
      if (user.role !== "customer" || !/^DEMO-[a-f0-9-]{8,36}$/.test(id) || seed?.request?.id !== id || typeof seed.request.subject !== "string") throw new Error("forbidden");
      const request = { id, subject: seed.request.subject.slice(0,120), game: String(seed.request.game ?? "Other").slice(0,80), status: "open", customerId: user.id, customerName: user.name, employeeId: null, employeeName: null, employeeOnline: 0, updatedAt: Date.now(), lastMessage: "" };
      chats.set(id, { request, messages: [] });
    },
    send(id, user, text, clientId) {
      if (typeof clientId !== "string" || !/^[a-f0-9-]{36}$/.test(clientId)) throw new Error("invalid-request");
      try {
        const data = get(id, user);
        if (data.request.status !== "assigned" || !data.request.employeeId) throw new Error("not-assigned");
        if (!data.messages.some(message => message.id === clientId)) {
          const now = Date.now();
          data.messages.push({ id: clientId, senderId: user.id, senderName: user.name, senderRole: user.role, text: text.trim(), createdAt: now });
          data.request.updatedAt = now; data.request.lastMessage = text.trim();
          saveChat(data);
        }
        return data;
      } catch (error) { throw error; }
    },
    close() {},
  };
}
