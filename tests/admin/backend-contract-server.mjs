// Test-only server. Production code never imports or starts this fixture.
import http from "node:http";
const users = new Map();
const calls = [];
const server = http.createServer(async (request, response) => {
  if (request.url === "/health") {
    response.end("ok");
    return;
  }
  if (request.url === "/shutdown") {
    response.end("stopped");
    server.close();
    // Let Playwright own process cleanup after testing a closed backend port.
    setInterval(() => {}, 60000);
    return;
  }
  if (request.url === "/calls") {
    response.setHeader("Content-Type", "application/json");
    response.end(JSON.stringify(calls));
    return;
  }
  calls.push({ method: request.method, path: request.url });
  let input = "";
  for await (const part of request) input += part;
  const body = input ? JSON.parse(input) : {};
  const reply = (status, data) => {
    response.writeHead(status, { "Content-Type": "application/json" });
    response.end(JSON.stringify(data));
  };
  if (request.url === "/api/v1/auth/login") {
    if (body.email === "network@example.test") {
      request.socket.destroy();
      return;
    }
    const status = Number(body.email?.match(/^status(\d+)@/)?.[1]);
    if (status) {
      reply(status, { success: false, message: "Test response" });
      return;
    }
    if (body.password !== "ContractPass123!") {
      reply(401, { success: false });
      return;
    }
    const user = {
      id: 1,
      email: body.email,
      full_name: "Tài khoản kiểm thử",
      display_name: "Kiểm thử",
      role:
        body.email === "staff@example.test"
          ? "STAFF"
          : body.email === "customer@example.test"
            ? "CUSTOMER"
            : "SUPER_ADMIN",
      status: body.email === "inactive@example.test" ? "SUSPENDED" : "ACTIVE",
      permissions: ["order.view", "chat.view"],
      must_change_password: body.email === "initial@example.test",
    };
    const token = `contract-session-${users.size}`;
    users.set(token, user);
    reply(200, {
      success: true,
      data:
        body.email === "invalid@example.test"
          ? { user }
          : { user, access_token: token, expires_in: 3600 },
    });
    return;
  }
  if (request.url === "/api/v1/auth/staff/accept-invitation") {
    reply(422, { success: false });
    return;
  }
  const token = request.headers.authorization?.replace(/^Bearer /, "");
  const user = users.get(token);
  if (!user) {
    reply(401, { success: false });
    return;
  }
  if (request.url === "/api/v1/auth/me") {
    if (user.email === "lost@example.test") {
      request.socket.destroy();
      return;
    }
    reply(200, { success: true, data: user });
    return;
  }
  if (
    request.url === "/api/v1/auth/change-password" &&
    body.current_password !== "ContractPass123!"
  ) {
    reply(422, { success: false });
    return;
  }
  if (
    ["/api/v1/auth/logout", "/api/v1/auth/change-password"].includes(
      request.url,
    )
  ) {
    users.delete(token);
    reply(200, { success: true });
    return;
  }
  reply(404, { success: false });
});
server.listen(3109, "127.0.0.1");
