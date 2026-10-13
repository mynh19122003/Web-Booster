import { createServer } from "node:http";
import { parseArgs } from "node:util";
import next from "next";
import { attachChatSocketServer } from "./scripts/chat-socket.mjs";

const { values } = parseArgs({ options: { port: { type: "string" }, hostname: { type: "string" }, production: { type: "boolean" } } });
const dev = !values.production;
process.env.NODE_ENV = dev ? "development" : "production";
const hostname = values.hostname ?? "localhost";
const port = Number(values.port ?? process.env.PORT ?? 3000);
const app = next({ dev, hostname, port });
await app.prepare();
const handler = app.getRequestHandler();
const server = createServer((request, response) => {
  const match = request.url?.match(/^\/api\/requests\/([^/?]+)(?:\?|$)/);
  if (match && ["POST", "PATCH"].includes(request.method)) {
    response.on("finish", () => {
      if (response.statusCode < 400) void io.notifyRequestChanged(request, match[1]).catch(() => {});
    });
  }
  void handler(request, response);
});
const origin = process.env.CHAT_ORIGIN ?? `http://${hostname}:${port}`;
const previewOrigins = ["http://127.0.0.1:3101", "http://127.0.0.1:3102", "http://localhost:3101", "http://localhost:3102"];
const allowedOrigins = process.env.CHAT_ALLOWED_ORIGINS?.split(",").map(value => value.trim()).filter(Boolean) ?? (previewOrigins.includes(origin) ? previewOrigins : []);
const io = attachChatSocketServer(server, { origin, allowedOrigins, mock: process.env.NEXT_PUBLIC_PUBLIC_DATA_SOURCE !== "api" });
server.listen(port, hostname, () => console.log(`Ready on ${origin} (Socket.IO enabled)`));
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => {
  io.close();
  server.close(() => process.exit(0));
});
