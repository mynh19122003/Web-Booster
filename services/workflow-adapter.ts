"use client";
import {
  initializeWorkflow,
  employeeAuthMockService,
  orderMockService,
  employeeMockService,
  assignmentMockService,
  adminOrderMockService,
  chatMockService,
  complaintMockService,
  securityMockService,
  dashboardMockService,
} from "./workflow";

/** Adapter boundary: a future API implementation hydrates the shared projection
 * in load(), and applies successful command responses to the same projection.
 * Components stay on this interface; an API error must propagate to the UI. */
export interface WorkflowAdapter {
  load: typeof initializeWorkflow;
  auth: typeof employeeAuthMockService;
  order: typeof orderMockService;
  employee: typeof employeeMockService;
  assignment: typeof assignmentMockService;
  adminOrder: typeof adminOrderMockService;
  chat: typeof chatMockService;
  complaint: typeof complaintMockService;
  security: typeof securityMockService;
  dashboard: typeof dashboardMockService;
}
export const workflowSource = "mock" as const;
// Explicit mock selection. No HTTP endpoints and no automatic API fallback.
export const workflowServices: WorkflowAdapter = {
  load: initializeWorkflow,
  auth: employeeAuthMockService,
  order: orderMockService,
  employee: employeeMockService,
  assignment: assignmentMockService,
  adminOrder: adminOrderMockService,
  chat: chatMockService,
  complaint: complaintMockService,
  security: securityMockService,
  dashboard: dashboardMockService,
};
export const employeeAuthService = workflowServices.auth;
export const orderService = workflowServices.order;
export const employeeService = workflowServices.employee;
export const assignmentService = workflowServices.assignment;
export const adminOrderService = workflowServices.adminOrder;
export const chatService = workflowServices.chat;
export const complaintService = workflowServices.complaint;
export const securityService = workflowServices.security;
export const dashboardService = workflowServices.dashboard;
export {
  useWorkflowReady,
  isActive,
  workload,
  employeeActiveOrders,
  WorkflowError,
} from "./workflow";
