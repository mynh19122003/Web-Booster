"use client";
import { io } from "socket.io-client";
import accounts from "@/mocks/employee-accounts.json";

export function createChatSocket(demo: boolean, employee: boolean, employeeId = "emp-sofia") {
  let session = crypto.randomUUID() as string;
  try { session = sessionStorage.getItem("ascend-chat-session") ?? session; sessionStorage.setItem("ascend-chat-session", session); } catch { /* In-memory connection remains available. */ }
  const endpoint = new URL(window.location.origin);
  if (["3101", "3102"].includes(endpoint.port)) endpoint.port = "3101";
  return io(process.env.NEXT_PUBLIC_CHAT_SOCKET_URL ?? endpoint.origin, {
    auth: { demo, shared: demo, session, ...(demo && employee ? { employee: accounts.find(account => account.id === employeeId) ?? { email: "", password: "" } } : {}) },
    withCredentials: true, autoConnect: false,
  });
}
