"use client";
import { orderService as mockOrder, assignmentService as mockAssignment } from "./operations";
import type { OrderService, AssignmentService } from "./contracts";
export const orderService = mockOrder satisfies OrderService;
export const assignmentService = mockAssignment satisfies AssignmentService;
