"use client";
import { dataSource } from "@/lib/admin/data-source";
import { useAdminStore } from "@/lib/admin/store";
import { useOperations } from "@/lib/admin/operations-store";
import {
  mockStaff,
  mockInvitations,
  mockSessions,
  mockActivities,
} from "@/mocks/admin";
import { mockOrders, mockStaffCandidates } from "@/mocks/orders";
import { mockAssignments, mockProgressEvents } from "@/mocks/orderAssignments";
import { mockConversations } from "@/mocks/conversations";
import { mockMessages } from "@/mocks/messages";
import { mockNotifications } from "@/mocks/notifications";
let initialization: Promise<void> | undefined;
export function initializeReviewData() {
  return (initialization ??= (async () => {
    await Promise.all([
      useAdminStore.persist.rehydrate(),
      useOperations.persist.rehydrate(),
    ]);
    if (!useAdminStore.getState().initialized)
      useAdminStore.setState({
        staff: dataSource.staff === "mock" ? structuredClone(mockStaff) : [],
        invitations:
          dataSource.staff === "mock" ? structuredClone(mockInvitations) : [],
        sessions:
          dataSource.security === "mock" ? structuredClone(mockSessions) : [],
        activities:
          dataSource.security === "mock" ? structuredClone(mockActivities) : [],
        initialized: true,
      });
    if (!useOperations.getState().initialized)
      useOperations.setState({
        orders: dataSource.orders === "mock" ? structuredClone(mockOrders) : [],
        employees:
          dataSource.assignments === "mock"
            ? structuredClone(mockStaffCandidates)
            : [],
        assignments:
          dataSource.assignments === "mock"
            ? structuredClone(mockAssignments)
            : [],
        events:
          dataSource.orders === "mock"
            ? structuredClone(mockProgressEvents)
            : [],
        conversations:
          dataSource.chat === "mock" ? structuredClone(mockConversations) : [],
        messages:
          dataSource.chat === "mock" ? structuredClone(mockMessages) : [],
        notifications:
          dataSource.notifications === "mock"
            ? structuredClone(mockNotifications)
            : [],
        initialized: true,
      });
    useAdminStore.setState({ ready: true });
    useOperations.setState({ ready: true });
  })());
}
