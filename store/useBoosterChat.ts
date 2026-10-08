"use client";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type ChatMessage = { id: string; sender: "customer" | "booster"; text: string; time: number };
type ChatState = { messages: Record<string, ChatMessage[]>; unread: Record<string, number>; send: (thread: string, text: string, sender?: ChatMessage["sender"]) => void; read: (thread: string) => void };
export const useBoosterChat = create<ChatState>()(persist((set) => ({
  messages: {}, unread: {},
  send: (thread, text, sender = "customer") => {
    const trimmed = text.trim().slice(0, 2000);
    if (!trimmed) return;
    set(state => ({ messages: { ...state.messages, [thread]: [...(state.messages[thread] ?? []), { id: crypto.randomUUID(), sender, text: trimmed, time: Date.now() }] }, unread: { ...state.unread, [thread]: sender === "booster" ? (state.unread[thread] ?? 0) + 1 : state.unread[thread] ?? 0 } }));
  },
  read: thread => set(state => state.unread[thread] ? { unread: { ...state.unread, [thread]: 0 } } : state),
}), { name: "ascend-demo-chat-v1", storage: createJSONStorage(() => localStorage), skipHydration: true }));
