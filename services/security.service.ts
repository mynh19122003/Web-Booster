import { unavailable } from "@/lib/api/errors";
import type { SecurityService } from "./contracts";
const apiSecurityAdapter = {
  getSecuritySessions: unavailable("security"),
  getAuditActivities: unavailable("security"),
  revokeSession: unavailable("security"),
} satisfies SecurityService;
export const securityService = apiSecurityAdapter;
