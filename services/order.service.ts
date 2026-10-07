"use client";
import {
  orderService as adapterOrder,
  assignmentService as adapterAssignment,
} from "./operations";
import type { OrderService, AssignmentService } from "./contracts";
export const orderService = adapterOrder satisfies OrderService;
export const assignmentService = adapterAssignment satisfies AssignmentService;
