"use client";
import { SupportInbox } from "@/components/account/SupportInbox";

export function UserBoosterChat({ compact = false, initialRequestId = "" }: { compact?: boolean; initialRequestId?: string }) {
  return <SupportInbox direct compact={compact} initialRequestId={initialRequestId} />;
}
