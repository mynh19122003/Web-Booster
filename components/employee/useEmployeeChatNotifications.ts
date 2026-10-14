"use client";
import { useEffect, useState } from "react";
import { createChatSocket } from "@/lib/chat-socket-client";

export function useEmployeeChatNotifications(id: string | undefined, enabled: boolean) {
  const [snapshot, setSnapshot] = useState<{ id: string; total: number }>({ id: "", total: 0 });
  useEffect(() => {
    if (!id || !enabled) return;
    const socket = createChatSocket();
    const update = (unread: { total: number }) => {
      if (Number.isSafeInteger(unread?.total) && unread.total >= 0) setSnapshot({ id, total: unread.total });
    };
    socket.on("chat:unread", update);
    socket.on("connect", () => {
      socket.timeout(10000).emit("chat:unread:get", {}, (error: Error | null, result: { ok: boolean; unread: { total: number } }) => {
        if (!error && result?.ok) update(result.unread);
      });
    });
    socket.connect();
    return () => { socket.disconnect(); };
  }, [id, enabled]);
  return enabled && snapshot.id === id ? snapshot.total : 0;
}
