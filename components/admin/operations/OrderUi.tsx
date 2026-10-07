"use client";

import { useAdminText } from "@/lib/admin/use-admin-text";
import { adminText, adminError } from "@/lib/admin/vi";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  Clock3,
  Gamepad2,
  Check,
  ShieldCheck,
} from "lucide-react";
import { useOperations } from "@/lib/admin/operations-store";
import { useAdminStore } from "@/lib/admin/store";
import { can } from "@/services/admin";
import { orderService, workload } from "@/services/operations";
import type { Order, StaffCandidate } from "@/types/operations";
import type { Permission } from "@/types/admin";
import {
  Avatar,
  StatusBadge,
  EmptyState,
  FormModal,
  Field,
  ActionMenu,
} from "../portal/Ui";
import { useNotice } from "../portal/AdminShell";
export const money = (amount: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "USD" }).format(
    amount,
  );
export const dateTime = (date: string) =>
  new Intl.DateTimeFormat("vi-VN", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
export function usePermission(permission: Permission) {
  useAdminStore((s) => s.user);
  return can(permission);
}
export function LoadingPanel() {
  const text = useAdminText();
  return (
    <div
      className="op-loading"
      role="status"
      aria-label={text("Loading workspace data")}
    >
      {[0, 1, 2, 3].map((i) => (
        <div className="ap-skeleton" key={i} />
      ))}
      <span>{text("Loading your workspace…")}</span>
    </div>
  );
}
export function ErrorPanel({
  error,
  retry,
}: {
  error: string;
  retry: () => void;
}) {
  const text = useAdminText();
  return (
    <div className="ap-panel">
      <EmptyState
        title={text("We couldn’t load this workspace")}
        text={text("Cancel") === "Cancel" ? error : adminError(error)}
      >
        <button className="ap-button" onClick={retry}>
          {text("Try again")}{" "}
        </button>
      </EmptyState>
    </div>
  );
}
export function OrderProgressBar({
  value,
  label = "Order progress",
}: {
  value: number;
  label?: string;
}) {
  const text = useAdminText();
  return (
    <div className="op-progress">
      <div>
        <span>{text(label)}</span>
        <strong>{value}%</strong>
      </div>
      <div
        className="op-progress-track"
        role="progressbar"
        aria-label={text(label)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={value}
      >
        <span style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
export function OfferCountdown({ expiresAt }: { expiresAt: string }) {
  const text = useAdminText();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const seconds = Math.max(0, Math.floor((Date.parse(expiresAt) - now) / 1000));
  return (
    <span className="op-countdown">
      <Clock3 size={13} />
      {seconds
        ? `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")} ${text("remaining")}`
        : text("Offer expired")}
    </span>
  );
}
export function StaffCandidateCard({
  employee,
  selected,
  disabled,
  onSelect,
}: {
  employee: StaffCandidate;
  selected: boolean;
  disabled: boolean;
  onSelect: () => void;
}) {
  const active = workload(employee.id);
  return (
    <label
      className={`op-candidate ${selected ? "selected" : ""} ${disabled ? "unavailable" : ""}`}
    >
      <input
        type="radio"
        name="employee_id"
        value={employee.id}
        checked={selected}
        onChange={onSelect}
        disabled={disabled}
        required
      />
      <div className="ap-person">
        <Avatar name={employee.name} />
        <div>
          <strong>{employee.name}</strong>
          <small>
            {adminText(employee.type)} ·{" "}
            {employee.online ? "Trực tuyến" : "Ngoại tuyến"}
          </small>
        </div>
        <Check className="op-selected-check" size={18} />
      </div>
      <p>{employee.games.join(" · ")}</p>
      <div className="op-candidate-facts">
        <span>
          Khả năng xử lý hạng<strong>{employee.rank}</strong>
        </span>
        <span>
          Khối lượng công việc{" "}
          <strong>
            {active} / {employee.maxActiveOrders}
          </strong>
        </span>
        <span>
          Tỷ lệ thành công<strong>{employee.successRate}%</strong>
        </span>
        <span>
          Thời gian hoàn thành TB<strong>{employee.averageHours} giờ</strong>
        </span>
      </div>
      {disabled && (
        <small className="op-unavailable-badge">
          {active >= employee.maxActiveOrders
            ? "Đã đủ số đơn"
            : "Không phù hợp đơn này"}
        </small>
      )}
    </label>
  );
}
export function AssignStaffModal({
  order,
  onClose,
}: {
  order: Order;
  onClose: () => void;
}) {
  const employees = useOperations((s) => s.employees);
  useOperations((s) => s.orders);
  const [query, setQuery] = useState("");
  const [game, setGame] = useState(order.game as string);
  const [rank, setRank] = useState("ALL");
  const [availability, setAvailability] = useState("ALL");
  const [capacity, setCapacity] = useState("ALL");
  const [selected, setSelected] = useState("");
  const notice = useNotice();
  const candidates = employees.filter(
    (e) =>
      e.name.toLowerCase().includes(query.toLowerCase()) &&
      (game === "ALL" || e.games.includes(game as Order["game"])) &&
      (rank === "ALL" || e.rank === rank) &&
      (availability === "ALL" || e.online === (availability === "ONLINE")) &&
      (capacity === "ALL" || workload(e.id) < e.maxActiveOrders),
  );
  return (
    <FormModal
      disabled
      className="op-assign-modal"
      title={
        order.employeeId
          ? `Phân công lại #${order.id}`
          : `Phân công nhân sự · #${order.id}`
      }
      description={
        order.employeeId
          ? "Chọn nhân sự mới bên dưới. Phân công cũ sẽ kết thúc và đề nghị mới có hiệu lực 15 phút sẽ được gửi."
          : "Chọn nhân sự phù hợp. Nhân sự phải nhận đề nghị trước khi bắt đầu."
      }
      submit={order.employeeId ? "Xác nhận phân công lại" : "Gửi đề nghị"}
      onClose={onClose}
      onSubmit={async () => {
        if (!selected) throw new Error("Vui lòng chọn nhân sự trước.");
        await (order.employeeId
          ? orderService.reassignStaff(order.id, selected)
          : orderService.assignStaff(order.id, selected));
        notice("Đã gửi đề nghị. Đang chờ nhân sự phản hồi.");
      }}
    >
      <div className="op-assignment-target">
        <Gamepad2 size={20} />
        <span>
          {order.game}
          <strong>
            {order.currentRank} → {order.targetRank}
          </strong>
        </span>
        <StatusBadge status={order.status} />
      </div>
      <Field label="Tìm nhân sự">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tìm theo tên…"
        />
      </Field>
      <div className="op-filter-grid">
        <Field label="Trò chơi">
          <select value={game} onChange={(e) => setGame(e.target.value)}>
            <option value="ALL">Tất cả trò chơi</option>
            {["League of Legends", "Valorant", "Teamfight Tactics"].map((g) => (
              <option key={g}>{g}</option>
            ))}
          </select>
        </Field>
        <Field label="Khả năng xử lý hạng">
          <select value={rank} onChange={(e) => setRank(e.target.value)}>
            <option value="ALL">Tất cả hạng</option>
            {employees.map((e) => (
              <option key={e.id}>{e.rank}</option>
            ))}
          </select>
        </Field>
        <Field label="Tình trạng sẵn sàng">
          <select
            value={availability}
            onChange={(e) => setAvailability(e.target.value)}
          >
            <option value="ALL">Mọi tình trạng</option>
            <option value="ONLINE">Trực tuyến</option>
            <option value="OFFLINE">Ngoại tuyến</option>
          </select>
        </Field>
        <Field label="Khối lượng công việc">
          <select
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
          >
            <option value="ALL">Tất cả khối lượng công việc</option>
            <option value="OPEN">Còn khả năng nhận đơn</option>
          </select>
        </Field>
      </div>
      <div className="op-candidates">
        {candidates.map((e) => (
          <StaffCandidateCard
            key={e.id}
            employee={e}
            selected={selected === e.id}
            disabled={
              !e.games.includes(order.game) ||
              e.type !== (order.service === "Coaching" ? "COACH" : "BOOSTER") ||
              e.id === order.employeeId ||
              workload(e.id) >= e.maxActiveOrders
            }
            onSelect={() => setSelected(e.id)}
          />
        ))}
        {!candidates.length && (
          <EmptyState
            title="Không có dữ liệu nhân sự khả dụng."
            text="Điều chỉnh bộ lọc để xem thêm nhân sự."
          />
        )}
      </div>
    </FormModal>
  );
}
export function OrderActions({
  order,
  compact = false,
}: {
  order: Order;
  compact?: boolean;
}) {
  const assign = usePermission("order.assign");
  const edit = usePermission("order.update");
  const cancel = usePermission("order.cancel");
  const chat = usePermission("chat.view");
  const [action, setAction] = useState<
    "assign" | "pause" | "cancel" | "complete" | "start" | "review" | null
  >(null);
  const notice = useNotice();
  const terminal = ["COMPLETED", "CANCELLED", "REFUNDED", "DISPUTED"].includes(
    order.status,
  );
  const controls = (
    <>
      {compact && <Link href={`/admin/orders/${order.id}`}>Xem đơn hàng</Link>}
      {assign && !terminal && (
        <button
          className={!compact ? "ap-button primary" : ""}
          onClick={() => setAction("assign")}
        >
          {order.employeeId ? "Phân công lại" : "Phân công nhân sự"}
        </button>
      )}
      {chat && (
        <Link
          className={!compact ? "ap-button" : ""}
          href={`/admin/chat?order=${order.id}`}
        >
          Mở trò chuyện{" "}
        </Link>
      )}
      {edit && ["PENDING", "CONFIRMED"].includes(order.status) && (
        <button
          className={!compact ? "ap-button" : ""}
          onClick={() => setAction("review")}
        >
          Xác nhận đơn{" "}
        </button>
      )}
      {edit && order.status === "IN_PROGRESS" && (
        <>
          <button
            className={!compact ? "ap-button" : ""}
            onClick={() => setAction("pause")}
          >
            Tạm dừng{" "}
          </button>
          <button
            className={!compact ? "ap-button" : ""}
            onClick={() => setAction("complete")}
          >
            Hoàn thành{" "}
          </button>
        </>
      )}
      {edit && ["ACCEPTED", "PAUSED"].includes(order.status) && (
        <button
          className={!compact ? "ap-button" : ""}
          onClick={() => setAction("start")}
        >
          {order.status === "PAUSED" ? "Tiếp tục" : "Bắt đầu làm việc"}
        </button>
      )}
      {cancel &&
        !["COMPLETED", "CANCELLED", "REFUNDED"].includes(order.status) && (
          <button
            className={!compact ? "ap-button danger" : ""}
            onClick={() => setAction("cancel")}
          >
            Hủy đơn{" "}
          </button>
        )}
    </>
  );
  const labels = {
    pause: "Tạm dừng đơn",
    cancel: "Hủy đơn",
    complete: "Hoàn thành đơn",
    start: "Bắt đầu làm việc",
    review: "Xác nhận đơn",
  };
  return (
    <div
      className={compact ? "op-row-actions" : "op-order-actions"}
      onClick={(e) => e.stopPropagation()}
    >
      {compact ? <ActionMenu>{controls}</ActionMenu> : controls}
      {action === "assign" && (
        <AssignStaffModal order={order} onClose={() => setAction(null)} />
      )}
      {action && action !== "assign" && (
        <FormModal
          disabled
          title={`${labels[action]} #${order.id}?`}
          description={
            action === "cancel"
              ? "Thao tác có thể cần hoàn tiền. Kiểm tra trạng thái thanh toán trước khi xác nhận."
              : action === "pause"
                ? "Công việc sẽ tạm dừng cho tới khi quản trị viên tiếp tục đơn."
                : action === "complete"
                  ? "Xác nhận đã đạt mục tiêu và giải phóng khối lượng công việc của nhân sự."
                  : action === "review"
                    ? "Xác nhận thông tin đơn và chuyển sang hàng chờ phân công."
                    : "Chuyển phân công đã nhận sang trạng thái đang thực hiện."
          }
          submit={labels[action]}
          danger={action === "cancel"}
          onClose={() => setAction(null)}
          onSubmit={async (data) => {
            if (action === "cancel")
              await orderService.cancelOrder(
                order.id,
                String(data.get("reason")),
              );
            if (action === "pause") await orderService.pauseOrder(order.id);
            if (action === "complete")
              await orderService.completeOrder(order.id);
            if (action === "start") await orderService.startOrder(order.id);
            if (action === "review") await orderService.reviewOrder(order.id);
            notice("Đã cập nhật đơn hàng.");
          }}
        >
          {action === "review" ? (
            <dl className="op-review-summary">
              <div>
                <dt>Khách hàng</dt>
                <dd>
                  {order.customer.name}
                  <small>{order.customer.email}</small>
                </dd>
              </div>
              <div>
                <dt>Trò chơi</dt>
                <dd>{order.game}</dd>
              </div>
              <div>
                <dt>Dịch vụ</dt>
                <dd>{adminText(order.service)}</dd>
              </div>
              <div>
                <dt>Hiện tại</dt>
                <dd>{order.currentRank}</dd>
              </div>
              <div>
                <dt>Mục tiêu</dt>
                <dd>{order.targetRank}</dd>
              </div>
              <div>
                <dt>Khu vực</dt>
                <dd>{adminText(order.region)}</dd>
              </div>
              <div>
                <dt>Giá</dt>
                <dd>{money(order.amount)}</dd>
              </div>
              <div>
                <dt>Tùy chọn</dt>
                <dd>
                  {[order.priority, order.queue, ...order.options]
                    .map(adminText)
                    .join(" / ")}
                </dd>
              </div>
              <div>
                <dt>Ngày gửi</dt>
                <dd>{dateTime(order.createdAt)}</dd>
              </div>
            </dl>
          ) : (
            <dl className="op-review-summary">
              <div>
                <dt>Khách hàng</dt>
                <dd>{order.customer.name}</dd>
              </div>
              <div>
                <dt>Dịch vụ</dt>
                <dd>
                  {order.game} / {adminText(order.service)}
                </dd>
              </div>
              <div>
                <dt>Hiện tại</dt>
                <dd>{order.currentRank}</dd>
              </div>
              <div>
                <dt>Mục tiêu</dt>
                <dd>{order.targetRank}</dd>
              </div>
            </dl>
          )}
          {action === "cancel" && (
            <Field label="Lý do hủy đơn">
              <textarea
                name="reason"
                required
                minLength={5}
                maxLength={1000}
                rows={3}
              />
            </Field>
          )}
        </FormModal>
      )}
    </div>
  );
}
export function OrderTimeline({ orderId }: { orderId: string }) {
  const text = useAdminText();
  const events = useOperations((s) => s.events)
    .filter((e) => e.orderId === orderId)
    .toSorted((a, b) => Date.parse(b.at) - Date.parse(a.at));
  return (
    <div className="ap-timeline">
      {events.map((e) => (
        <div className="ap-timeline-item" key={e.id}>
          <span className="ap-timeline-dot">
            <ShieldCheck size={14} />
          </span>
          <div>
            <strong>{text(e.title)}</strong>
            <p>{text(e.detail)}</p>
            <small>
              {text(e.actor)} · {dateTime(e.at)}
            </small>
          </div>
        </div>
      ))}
    </div>
  );
}
export function OrderCard({
  order,
  children,
}: {
  order: Order;
  children?: React.ReactNode;
}) {
  return (
    <article className="ap-panel op-order-card">
      <div className="op-card-top">
        <Link href={`/admin/orders/${order.id}`}>
          #{order.id} <ArrowUpRight size={14} />
        </Link>
        <StatusBadge status={order.status} />
      </div>
      <div className="ap-person">
        <Avatar name={order.customer.name} />
        <div>
          <strong>{order.customer.name}</strong>
          <small>
            {order.game} · {adminText(order.service)}
          </small>
        </div>
      </div>
      <div className="op-rank-path">
        <span>{order.currentRank}</span>
        <span>→</span>
        <strong>{order.targetRank}</strong>
      </div>
      {children}
    </article>
  );
}
