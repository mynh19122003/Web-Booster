import type { CoachingSession } from "@/types/workflow";

export type RiotAccountDetails = {
  riotUsername: string;
  riotPass: string;
  riotIdTag: string;
};

export type OrderRequestDetails = {
  orderNumber: string;
  service: string;
  currentRank: string;
  targetRank: string;
  region: string;
  queue: string;
  role: string;
  championPool: string;
  flashSlot: "D" | "F" | "no-preference";
  customerNotes: string;
  riotAccount: RiotAccountDetails | null;
};

export type OrderRequestInput = Omit<OrderRequestDetails, "orderNumber"> & {
  submissionId: string;
  coaching?: CoachingSession;
};

export function requiresRiotCredentials(service: string, queue: string) {
  return (
    service !== "duo-boost" &&
    service !== "coaching" &&
    !/^(duo(?: boost)?|coaching)$/i.test(queue.trim())
  );
}
