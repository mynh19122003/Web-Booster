"use client";

import { adminText } from "@/lib/admin/vi";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Package,
  Clock3,
  Activity,
  CheckCircle2,
  ShieldAlert,
  X,
  ArrowLeft,
  ArrowRight,
  Search,
} from "lucide-react";
import { useOperations } from "@/lib/admin/operations-store";
import { useServiceLoad } from "@/lib/admin/use-operations";
import { orderService } from "@/services/operations";
import { orderStatuses, type Order } from "@/types/operations";
import {
  PageHeader,
  AdminStatCard,
  StatusBadge,
  Avatar,
  AccessDenied,
  EmptyState,
  Field,
} from "../portal/Ui";
import {
  usePermission,
  LoadingPanel,
  ErrorPanel,
  OrderProgressBar,
  OrderActions,
  money,
  dateTime,
} from "./OrderUi";
const defaults = {
  query: "",
  status: "ALL",
  game: "ALL",
  service: "ALL",
  employee: "ALL",
  from: "",
  to: "",
  sort: "newest",
};
export function OrderTable({ orders }: { orders: Order[] }) {
  const router = useRouter();
  const employees = useOperations((s) => s.employees);
  return (
    <div className="ap-table-wrap op-order-table">
      <table aria-label="Đơn hàng">
        <thead>
          <tr>
            {[
              "Mã đơn",
              "Khách hàng",
              "Trò chơi / Dịch vụ",
              "Hạng hiện tại",
              "Hạng mục tiêu",
              "Nhân sự",
              "Trạng thái",
              "Tiến độ",
              "Giá trị đơn",
              "Ngày tạo",
              "Thao tác",
            ].map((h) => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => {
            const employee = employees.find((e) => e.id === o.employeeId);
            return (
              <tr
                key={o.id}
                onClick={(event) => {
                  if (
                    !(event.target as HTMLElement).closest(
                      "a, button, details, input, select",
                    )
                  )
                    router.push(`/admin/orders/${o.id}`);
                }}
              >
                <td>
                  <Link className="op-order-id" href={`/admin/orders/${o.id}`}>
                    #{o.id}
                  </Link>
                </td>
                <td>
                  <strong>{o.customer.name}</strong>
                  <small className="op-block">{o.riotId}</small>
                </td>
                <td>
                  {o.game}
                  <small className="op-block">{adminText(o.service)}</small>
                </td>
                <td>{o.currentRank}</td>
                <td>{o.targetRank}</td>
                <td>
                  {employee ? (
                    <div className="ap-person">
                      <Avatar name={employee.name} />
                      <span>{employee.name}</span>
                    </div>
                  ) : (
                    <span className="op-muted">Chưa phân công</span>
                  )}
                </td>
                <td>
                  <StatusBadge status={o.status} />
                </td>
                <td>
                  <OrderProgressBar value={o.progress} />
                </td>
                <td>
                  <strong>{money(o.amount)}</strong>
                </td>
                <td>{dateTime(o.createdAt)}</td>
                <td>
                  <OrderActions order={o} compact />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
export function OrdersPage() {
  const allowed = usePermission("order.view");
  const { orders, employees } = useOperations();
  const load = useServiceLoad(orderService.getOrders);
  const [filters, setFilters] = useState(defaults);
  const [page, setPage] = useState(1);
  function filter(key: keyof typeof defaults, value: string) {
    setFilters((s) => ({ ...s, [key]: value }));
    setPage(1);
  }
  if (!allowed) return <AccessDenied />;
  if (load.loading) return <LoadingPanel />;
  if (load.error) return <ErrorPanel {...load} />;
  const filtered = orders
    .filter((o) => {
      const employee =
        employees.find((e) => e.id === o.employeeId)?.name ?? "unassigned";
      const date = o.createdAt.slice(0, 10);
      return (
        `${o.id} ${o.customer.name} ${o.customer.email} ${o.riotId} ${employee}`
          .toLowerCase()
          .includes(filters.query.toLowerCase()) &&
        (filters.status === "ALL" || o.status === filters.status) &&
        (filters.game === "ALL" || o.game === filters.game) &&
        (filters.service === "ALL" || o.service === filters.service) &&
        (filters.employee === "ALL" ||
          (filters.employee === "NONE"
            ? !o.employeeId
            : o.employeeId === filters.employee)) &&
        (!filters.from || date >= filters.from) &&
        (!filters.to || date <= filters.to)
      );
    })
    .sort((a, b) =>
      filters.sort === "highest"
        ? b.amount - a.amount
        : filters.sort === "lowest"
          ? a.amount - b.amount
          : filters.sort === "oldest"
            ? Date.parse(a.createdAt) - Date.parse(b.createdAt)
            : Date.parse(b.createdAt) - Date.parse(a.createdAt),
    );
  const totalPages = Math.max(1, Math.ceil(filtered.length / 6));
  const currentPage = Math.min(page, totalPages);
  const visible = filtered.slice((currentPage - 1) * 6, currentPage * 6);
  const stats = [
    { label: "Tổng đơn hàng", value: orders.length, icon: Package },
    {
      label: "Chờ xử lý",
      value: orders.filter((o) => o.status === "PENDING").length,
      icon: Clock3,
    },
    {
      label: "Đang thực hiện",
      value: orders.filter((o) => o.status === "IN_PROGRESS").length,
      icon: Activity,
    },
    {
      label: "Hoàn thành",
      value: orders.filter((o) => o.status === "COMPLETED").length,
      icon: CheckCircle2,
    },
    {
      label: "Tranh chấp",
      value: orders.filter((o) => o.status === "DISPUTED").length,
      icon: ShieldAlert,
    },
  ];
  const chips = Object.entries(filters).filter(
    ([k, v]) => k !== "sort" && v !== "" && v !== "ALL",
  );
  return (
    <>
      <PageHeader
        eyebrow="VẬN HÀNH ĐƠN HÀNG"
        title="Đơn hàng"
        description="Quản lý và theo dõi tất cả đơn hàng của khách."
      >
        <Link className="ap-button primary" href="/admin/incoming-orders">
          Mở hộp thư đơn hàng <ArrowRight size={16} />
        </Link>
      </PageHeader>
      <div className="ap-stats op-stats-five">
        {stats.map((s, i) => (
          <AdminStatCard
            key={s.label}
            label={s.label}
            value={s.value}
            icon={<s.icon size={18} />}
            note="Trong hệ thống"
            index={`0${i + 1}`}
          />
        ))}
      </div>
      <section className="ap-panel">
        <div className="op-order-filters">
          <label className="ap-search">
            <Search size={17} />
            <input
              aria-label="Tìm đơn hàng"
              placeholder="Mã đơn, khách hàng, Riot ID hoặc nhân sự…"
              value={filters.query}
              onChange={(e) => filter("query", e.target.value)}
            />
          </label>
          <div className="op-filter-grid">
            <Field label="Trạng thái">
              <select
                value={filters.status}
                onChange={(e) => filter("status", e.target.value)}
              >
                <option value="ALL">Tất cả trạng thái</option>
                {orderStatuses.map((s) => (
                  <option key={s} value={s}>
                    {adminText(s)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Trò chơi">
              <select
                value={filters.game}
                onChange={(e) => filter("game", e.target.value)}
              >
                <option value="ALL">Tất cả trò chơi</option>
                {[...new Set(orders.map((o) => o.game))].map((s) => (
                  <option key={s} value={s}>
                    {adminText(s)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Dịch vụ">
              <select
                value={filters.service}
                onChange={(e) => filter("service", e.target.value)}
              >
                <option value="ALL">Tất cả dịch vụ</option>
                {[...new Set(orders.map((o) => o.service))].map((s) => (
                  <option key={s} value={s}>
                    {adminText(s)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Nhân sự">
              <select
                value={filters.employee}
                onChange={(e) => filter("employee", e.target.value)}
              >
                <option value="ALL">Tất cả nhân sự</option>
                <option value="NONE">Chưa phân công</option>
                {employees.map((e) => (
                  <option value={e.id} key={e.id}>
                    {e.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Từ ngày">
              <input
                type="date"
                value={filters.from}
                max={filters.to || undefined}
                onChange={(e) => filter("from", e.target.value)}
              />
            </Field>
            <Field label="Đến ngày">
              <input
                type="date"
                min={filters.from || undefined}
                value={filters.to}
                onChange={(e) => filter("to", e.target.value)}
              />
            </Field>
            <Field label="Sắp xếp đơn hàng">
              <select
                value={filters.sort}
                onChange={(e) => filter("sort", e.target.value)}
              >
                <option value="newest">Mới nhất</option>
                <option value="oldest">Cũ nhất</option>
                <option value="highest">Giá trị cao nhất</option>
                <option value="lowest">Giá trị thấp nhất</option>
              </select>
            </Field>
          </div>
          {chips.length > 0 && (
            <div className="op-filter-chips">
              {chips.map(([k, v]) => (
                <button
                  key={k}
                  onClick={() =>
                    filter(
                      k as keyof typeof defaults,
                      defaults[k as keyof typeof defaults],
                    )
                  }
                >
                  {adminText(k)}: {adminText(v)}
                  <X size={12} />
                </button>
              ))}
              <button
                onClick={() => {
                  setFilters(defaults);
                  setPage(1);
                }}
              >
                Xóa bộ lọc{" "}
              </button>
            </div>
          )}
        </div>
        {visible.length ? (
          <OrderTable orders={visible} />
        ) : (
          <EmptyState
            title="Chưa có đơn hàng"
            text="Không có đơn phù hợp bộ lọc. Hãy thử tìm kiếm khác."
          />
        )}
        <div className="ap-table-footer">
          <span>
            {filtered.length ? (currentPage - 1) * 6 + 1 : 0}–
            {Math.min(currentPage * 6, filtered.length)} trên {filtered.length}{" "}
            đơn hàng{" "}
          </span>
          <div className="op-pagination">
            <button
              aria-label="Trang trước"
              disabled={currentPage === 1}
              onClick={() => setPage(currentPage - 1)}
            >
              <ArrowLeft size={16} />
            </button>
            <span>
              Trang {currentPage} trên {totalPages}
            </span>
            <button
              aria-label="Trang sau"
              disabled={currentPage === totalPages}
              onClick={() => setPage(currentPage + 1)}
            >
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>
    </>
  );
}
