import { securityService as adapter } from "./admin";
import type { SecurityService } from "./contracts";
export const securityService = adapter satisfies SecurityService;
