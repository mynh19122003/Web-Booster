"use client";
import Link from "next/link";
import { SecurityPage } from "@/components/admin/portal/SecurityProfile";
import { DataTable } from "@/components/admin/portal/Ui";
import { useWorkflow } from "@/lib/workflow/store";
import { Panel, Badge, Timeline, useAllowed, date } from "./Shared";
export function AdminSecurity() {
  const s = useWorkflow();
  const view = useAllowed("employee.view");
  const orders = useAllowed("order.view");
  return (
    <>
      <SecurityPage />
      {view && (
        <Panel title="Phiên nhân viên">
          <DataTable
            label="Phiên nhân viên"
            rows={s.sessions}
            columns={[
              {
                label: "Nhân viên",
                render: (x) => (
                  <Link href={`/admin/employees/${x.employeeId}`}>
                    {s.employees.find((e) => e.id === x.employeeId)?.name} ↗
                  </Link>
                ),
              },
              { label: "IP", render: (x) => x.ip },
              { label: "Thiết bị", render: (x) => x.device },
              { label: "Đăng nhập", render: (x) => date(x.loginAt) },
              {
                label: "Hoạt động cuối",
                render: (x) => date(x.lastActivityAt),
              },
              {
                label: "Trạng thái",
                render: (x) => <Badge status={x.status} />,
              },
            ]}
          />
        </Panel>
      )}
      {orders && (
        <Panel title="Nhật ký vận hành">
          <Timeline />
        </Panel>
      )}
    </>
  );
}
