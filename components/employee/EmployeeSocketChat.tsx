"use client";
import { useMemo } from "react";
import { useWorkflow } from "@/lib/workflow/store";
import { MessengerChat } from "@/components/account/MessengerChat";
import type { AuthUser } from "@/lib/auth-db";

export function EmployeeSocketChat({ initialRequestId = "", compact = false }: { initialRequestId?: string; compact?: boolean }) {
  const id = useWorkflow(state => state.employeeId);
  const employee = useWorkflow(state => state.employees.find(row => row.id === id));
  const viewer = useMemo<AuthUser | undefined>(() => employee ? { id: employee.id, name: employee.name, email: "", role: "employee" } : undefined, [employee]);
  if (!viewer) return <p role="status">Đang tải tin nhắn nhân viên…</p>;
  return <MessengerChat employeeUser={viewer} initialRequestId={initialRequestId} compact={compact} />;
}
