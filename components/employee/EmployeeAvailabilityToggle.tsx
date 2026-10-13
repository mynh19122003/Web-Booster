"use client";

import { useEffect, useState } from "react";
import { useWorkflow } from "@/lib/workflow/store";
import { publicMockMode } from "@/lib/public-data-source";
import employeeAccounts from "@/mocks/employee-accounts.json";
import { mockCoaches } from "@/mocks/public";
import { notifyCoachProfileUpdated } from "@/lib/coach-profile-events";

let presenceRevision = 0;

export function EmployeeAvailabilityToggle({ compact = false }: { compact?: boolean }) {
  const employeeId = useWorkflow(state => state.employeeId);
  const online = useWorkflow(state => state.employees.find(employee => employee.id === state.employeeId)?.online ?? false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const demo = publicMockMode && employeeAccounts.some(account => account.id === employeeId);
  const demoAccount = demo ? employeeAccounts.find(account => account.id === employeeId) : undefined;
  const demoCoachSlug = demoAccount && mockCoaches.some(coach => coach.slug === demoAccount.id.slice(4)) ? demoAccount.id.slice(4) : null;

  useEffect(() => {
    if (!employeeId || (demo && !demoCoachSlug)) return;
    const controller = new AbortController();
    const revision = presenceRevision;
    void fetch(demoCoachSlug ? `/api/coaches/${encodeURIComponent(demoCoachSlug)}` : "/api/employee/status", { cache: "no-store", signal: controller.signal })
      .then(async response => {
        if (!response.ok) return;
        const data = await response.json();
        const savedOnline = demoCoachSlug ? data.coach?.online : data.isOnline;
        if (!controller.signal.aborted && revision === presenceRevision && typeof savedOnline === "boolean") {
          useWorkflow.setState(state => ({ employees: state.employees.map(employee => employee.id === employeeId ? { ...employee, online: savedOnline } : employee) }));
        }
      })
      .catch(() => {});
    return () => controller.abort();
  }, [employeeId, demo, demoCoachSlug]);

  async function toggle() {
    if (!employeeId || busy) return;
    const next = !online;
    presenceRevision++;
    setBusy(true);
    setError("");
    try {
      if (!demo || demoCoachSlug) {
        const response = await fetch(demoCoachSlug ? "/api/mock/coach-presence" : "/api/employee/status", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(demoCoachSlug ? { employeeId, password: demoAccount?.password, isOnline: next } : { isOnline: next }),
        });
        const result = await response.json();
        if (!response.ok || result.isOnline !== next) throw new Error("Không thể lưu trạng thái.");
      }
      useWorkflow.setState(state => ({ employees: state.employees.map(employee => employee.id === employeeId ? { ...employee, online: next } : employee) }));
      notifyCoachProfileUpdated();
    } catch {
      setError("Không thể lưu trạng thái. Vui lòng thử lại.");
    } finally {
      setBusy(false);
    }
  }

  return <span className={`employee-availability-wrap ${compact ? "is-compact" : ""}`}>
    <button
      type="button"
      role="switch"
      aria-checked={online}
      aria-label="Trạng thái sẵn sàng nhận đơn"
      aria-busy={busy}
      disabled={busy}
      onClick={toggle}
      className={`employee-availability ${online ? "is-online" : "is-offline"}`}
    >
      <span className="employee-availability-dot" aria-hidden="true" />
      <span>{online ? "Online" : "Offline"}</span>
      <span className="employee-availability-track" aria-hidden="true"><i /></span>
    </button>
    {error && <span className="employee-availability-error" role="alert">{error}</span>}
  </span>;
}
