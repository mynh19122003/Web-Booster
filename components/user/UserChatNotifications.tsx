"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { publicRequest } from "@/services/public";
import { createChatSocket } from "@/lib/chat-socket-client";

const UnreadContext = createContext(0);
export const useUserChatUnread = () => useContext(UnreadContext);

export function UserChatNotifications({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const [id, setId] = useState("");
  const [snapshot, setSnapshot] = useState({ id: "", total: 0 });
  useEffect(() => {
    let active = true;
    const load = () => {
      void publicRequest("/api/auth/me", { cache: "no-store" }).then(r => r.json()).then(data => {
        if (active) setId(data.user && data.user.role !== "employee" ? data.user.id : "");
      }).catch(() => { if (active) setId(""); });
    };
    load();
    window.addEventListener("ascend-profile-updated", load);
    return () => { active = false; window.removeEventListener("ascend-profile-updated", load); };
  }, [path]);
  useEffect(() => {
    if (!id) return;
    const socket = createChatSocket();
    const update = (data: { total: number }) => {
      if (Number.isSafeInteger(data?.total) && data.total >= 0) setSnapshot({ id, total: data.total });
    };
    socket.on("chat:unread", update);
    socket.on("connect", () => {
      socket.timeout(10000).emit("chat:unread:get", {}, (error: Error | null, result: { ok: boolean; unread: { total: number } }) => {
        if (!error && result?.ok) update(result.unread);
      });
    });
    socket.connect();
    return () => { socket.disconnect(); };
  }, [id]);
  return <UnreadContext.Provider value={id && snapshot.id === id ? snapshot.total : 0}>{children}</UnreadContext.Provider>;
}

export function UserChatBadge() {
  const total = useUserChatUnread();
  return total > 0 ? <b className="chat-unread-badge" role="status" aria-label={`${total} unread messages`}>{total > 99 ? "99+" : total}</b> : null;
}
