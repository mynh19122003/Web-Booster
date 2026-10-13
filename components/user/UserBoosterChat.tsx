"use client";
import { MessengerChat } from "@/components/account/MessengerChat";

export function UserBoosterChat({ compact = false, initialRequestId = "" }: { compact?: boolean; initialRequestId?: string }) {
  return <MessengerChat compact={compact} initialRequestId={initialRequestId} />;
}
