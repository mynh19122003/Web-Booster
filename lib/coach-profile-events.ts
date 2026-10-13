import { io, type Socket } from "socket.io-client";
const eventName = "coach-profile-updated";
const storageKey = "ascend-coach-profile-revision";
let socket: Socket | undefined;
let subscribers = 0;
function startRealtime() {
  if (socket || typeof window === "undefined" || !window.location?.origin) return;
  const endpoint = new URL(window.location.origin);
  if (["3101", "3102"].includes(endpoint.port)) endpoint.port = "3101";
  socket = io(process.env.NEXT_PUBLIC_CHAT_SOCKET_URL ?? endpoint.origin, { auth: { publicCoaches: true }, withCredentials: true });
  socket.on("coach:changed", () => window.dispatchEvent(new Event(eventName)));
}

export function notifyCoachProfileUpdated() {
  window.dispatchEvent(new Event(eventName));
  try { localStorage.setItem(storageKey, crypto.randomUUID()); } catch {}
}

export function subscribeCoachProfileUpdates(refresh: () => void) {
  subscribers++;
  startRealtime();
  const onStorage = (event: StorageEvent) => {
    if (event.key === storageKey) refresh();
  };
  window.addEventListener(eventName, refresh);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(eventName, refresh);
    window.removeEventListener("storage", onStorage);
    if (--subscribers === 0) { socket?.disconnect(); socket = undefined; }
  };
}
