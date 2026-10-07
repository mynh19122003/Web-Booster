import { dataSource, selectDataSource } from "@/lib/admin/data-source";
import { unavailable } from "@/lib/api/errors";
import { mockSecurityService } from "./mock/admin.service";
import type { SecurityService } from "./contracts";
const apiSecurityAdapter = {
  getSecuritySessions: unavailable("security"),
  getAuditActivities: unavailable("security"),
  revokeSession: unavailable("security"),
} satisfies SecurityService;
export const securityService = selectDataSource<SecurityService>(
  dataSource.security,
  mockSecurityService,
  apiSecurityAdapter,
);
