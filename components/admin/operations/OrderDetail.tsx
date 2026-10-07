"use client";

import { adminText } from "@/lib/admin/vi";
import Link from "next/link";
import { useCallback, useState } from "react";
import {
  ArrowLeft,
  Gamepad2,
  MessageSquare,
  TrendingUp,
  LockKeyhole,
} from "lucide-react";
import { useOperations } from "@/lib/admin/operations-store";
import { useServiceLoad } from "@/lib/admin/use-operations";
import { orderService, workload } from "@/services/operations";
import {
  PageHeader,
  StatusBadge,
  Avatar,
  AccessDenied,
  FormModal,
  Field,
} from "../portal/Ui";
import { useNotice } from "../portal/AdminShell";
import {
  OrderActions,
  OrderProgressBar,
  OrderTimeline,
  OfferCountdown,
  usePermission,
  LoadingPanel,
  ErrorPanel,
  money,
  dateTime,
} from "./OrderUi";
function Facts({ items }: { items: [string, string][] }) {
  return (
    <dl className="op-facts">
      {items.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{adminText(value)}</dd>
        </div>
      ))}
    </dl>
  );
}
export function OrderDetail({ id }: { id: string }) {
  const allowed = usePermission("order.view");
  const edit = usePermission("order.update");
  const chat = usePermission("chat.view");
  const { orders, employees, assignments, messages, conversations } =
    useOperations();
  const load = useServiceLoad(
    useCallback(() => orderService.getOrder(id), [id]),
  );
  const [dialog, setDialog] = useState<"progress" | "notes" | null>(null);
  const notice = useNotice();
  if (!allowed) return <AccessDenied />;
  if (load.loading) return <LoadingPanel />;
  if (load.error) return <ErrorPanel {...load} />;
  const order = orders.find((o) => o.id === id);
  if (!order)
    return (
      <ErrorPanel
        error={
          load.unavailable
            ? "Không tìm thấy dữ liệu đơn hàng. Dữ liệu chưa khả dụng."
            : "Không tìm thấy dữ liệu đơn hàng."
        }
        retry={load.retry}
      />
    );
  const employee = employees.find((e) => e.id === order.employeeId);
  const history = assignments.filter((a) => a.orderId === id).toReversed();
  const offer = history.find((a) => a.status === "OFFERED");
  const conversation = conversations.find((c) => c.orderId === id);
  const preview = messages
    .filter(
      (m) => m.conversationId === conversation?.id && m.channel === "CUSTOMER",
    )
    .slice(-3);
  const milestoneIndex = Math.min(
    order.milestones.length - 1,
    Math.floor((order.progress / 100) * (order.milestones.length - 1)),
  );
  return (
    <>
      <Link className="op-back" href="/admin/orders">
        <ArrowLeft size={15} />
        Tất cả đơn hàng{" "}
      </Link>
      <PageHeader
        eyebrow={`${order.game.toUpperCase()} · ${order.service.toUpperCase()}`}
        title={`Đơn hàng #${id}`}
        description={`Created ${dateTime(order.createdAt)} · ${order.customer.name}`}
      >
        <StatusBadge status={order.status} />
      </PageHeader>
      <OrderActions order={order} />
      <div className="op-detail-grid">
        <div className="op-detail-main">
          <section className="ap-panel">
            <div className="ap-panel-heading">
              <h2>
                <TrendingUp size={18} />
                Tiến độ hiện tại{" "}
              </h2>

              {edit && order.status === "IN_PROGRESS" && (
                <button
                  className="ap-button"
                  onClick={() => setDialog("progress")}
                >
                  Cập nhật tiến độ{" "}
                </button>
              )}
            </div>
            <div className="ap-panel-padding">
              <OrderProgressBar value={order.progress} />
              <ol className="op-milestones">
                {order.milestones.map((rank, i) => (
                  <li
                    className={i <= milestoneIndex ? "reached" : ""}
                    key={rank}
                  >
                    <span>
                      {i < milestoneIndex
                        ? "✓"
                        : String(i + 1).padStart(2, "0")}
                    </span>
                    <strong>{rank}</strong>
                    {i === milestoneIndex && (
                      <small>Mốc tiến độ hiện tại</small>
                    )}
                  </li>
                ))}
              </ol>
              <p>
                {order.currentLP} LP · Mục tiêu: {order.targetRank} · Tiến độ
                được cập nhật trong toàn hệ thống.{" "}
              </p>
            </div>
          </section>
          <div className="op-two-columns">
            <section className="ap-panel ap-prose">
              <h2>Thông tin khách hàng</h2>
              <div className="ap-person op-spaced">
                <Avatar name={order.customer.name} />
                <div>
                  <strong>{order.customer.name}</strong>
                  <small>Khách hàng · {order.customer.id}</small>
                </div>
              </div>
              <Facts
                items={[
                  ["Email", order.customer.email],
                  ["Quốc gia", order.customer.country],
                  ["Múi giờ", order.customer.timezone],
                ]}
              />
            </section>
            <section className="ap-panel ap-prose">
              <h2>
                <Gamepad2 size={18} />
                Tài khoản trò chơi{" "}
              </h2>
              <Facts
                items={[
                  ["Trò chơi", order.game],
                  ["Riot ID", order.riotId],
                  ["Khu vực", order.region],
                  ["Hạng bắt đầu", order.currentRank],
                  ["LP hiện tại", String(order.currentLP)],
                  ["Mục tiêu", order.targetRank],
                ]}
              />
              <small className="op-safe">
                <LockKeyhole size={12} />
                Không hiển thị thông tin đăng nhập trò chơi.{" "}
              </small>
            </section>
          </div>
          <section className="ap-panel ap-prose">
            <h2>Chi tiết dịch vụ</h2>
            <Facts
              items={[
                ["Loại dịch vụ", order.service],
                ["Chế độ chơi", order.queue],
                ["Hạng mục tiêu", order.targetRank],
                ["Mức ưu tiên", order.priority],
                ["Dự kiến hoàn thành", dateTime(order.deadline)],
                ["Giá", money(order.amount)],
              ]}
            />
            <div className="op-option-tags">
              {order.options.map((option) => (
                <span key={option}>{adminText(option)}</span>
              ))}
            </div>
            <p className="op-instructions">{adminText(order.instructions)}</p>
          </section>
          <section className="ap-panel">
            <div className="ap-panel-heading">
              <h2>Lịch sử đơn hàng</h2>
              <span className="ap-count">Nhật ký hoạt động</span>
            </div>
            <OrderTimeline orderId={id} />
          </section>
          <section className="ap-panel">
            <div className="ap-panel-heading">
              <h2>Ghi chú</h2>
              {edit && (
                <button
                  className="ap-button"
                  onClick={() => setDialog("notes")}
                >
                  Sửa ghi chú quản trị{" "}
                </button>
              )}
            </div>
            <div className="op-two-columns ap-panel-padding">
              <div className="op-note">
                <span>
                  <LockKeyhole size={13} />
                  Quản trị · Nội bộ{" "}
                </span>
                <p>
                  {adminText(order.adminNotes) || "Chưa có ghi chú quản trị."}
                </p>
              </div>
              <div className="op-note employee">
                <span>Ghi chú nhân sự</span>
                <p>
                  {adminText(order.employeeNotes) || "Chưa có ghi chú nhân sự."}
                </p>
              </div>
            </div>
          </section>
        </div>
        <aside className="op-detail-aside">
          <section className="ap-panel ap-prose">
            <h2>Nhân sự phụ trách</h2>
            {employee ? (
              <>
                <div className="ap-person op-spaced">
                  <Avatar name={employee.name} />
                  <div>
                    <strong>{employee.name}</strong>
                    <small>
                      {employee.id} · {adminText(employee.type)}
                    </small>
                  </div>
                  <span
                    className={employee.online ? "ap-online" : "op-offline"}
                  />
                </div>
                <Facts
                  items={[
                    [
                      "Khối lượng công việc",
                      `${workload(employee.id)} / ${employee.maxActiveOrders} đơn đang thực hiện`,
                    ],
                    ["Tỷ lệ thành công", `${employee.successRate}%`],
                    [
                      "Trạng thái",
                      employee.online ? "Trực tuyến" : "Ngoại tuyến",
                    ],
                    ["Hoạt động gần nhất", dateTime(employee.lastActivity)],
                  ]}
                />
                {offer && (
                  <div className="op-offer-state">
                    <strong>Đã gửi đề nghị · Đang chờ phản hồi</strong>
                    <OfferCountdown expiresAt={offer.expiresAt} />
                  </div>
                )}
              </>
            ) : (
              <p>
                Đơn đang chờ nhân sự phù hợp. Chọn Phân công nhân sự để gửi đề
                nghị.{" "}
              </p>
            )}
          </section>
          <section className="ap-panel ap-prose">
            <h2>Lịch sử phân công</h2>
            <div className="op-assignment-history">
              {history.length ? (
                history.map((a) => (
                  <article key={a.id}>
                    <strong>
                      {employees.find((e) => e.id === a.employeeId)?.name}
                    </strong>
                    <div>
                      <StatusBadge status="OFFERED" />
                      <small>{dateTime(a.offeredAt)}</small>
                    </div>
                    {a.status !== "OFFERED" && (
                      <div>
                        <StatusBadge status={a.status} />
                        <small>{dateTime(a.respondedAt ?? a.offeredAt)}</small>
                      </div>
                    )}
                    {a.reason && <p>Lý do: {a.reason}</p>}
                  </article>
                ))
              ) : (
                <p>Chưa gửi đề nghị nào.</p>
              )}
            </div>
          </section>
          {chat && (
            <section className="ap-panel">
              <div className="ap-panel-heading">
                <h2>
                  <MessageSquare size={17} />
                  Xem trước trò chuyện{" "}
                </h2>
              </div>
              <div className="ap-panel-padding op-chat-preview">
                {preview.length ? (
                  preview.map((m) => (
                    <div key={m.id}>
                      <strong>
                        {m.sender.name}{" "}
                        <small>{adminText(m.sender.role)}</small>
                      </strong>
                      <p>{adminText(m.body)}</p>
                    </div>
                  ))
                ) : (
                  <p>Chưa có tin nhắn. Hãy bắt đầu trò chuyện.</p>
                )}
                <Link
                  className="ap-button full"
                  href={`/admin/chat?order=${id}`}
                >
                  Mở trò chuyện đầy đủ <MessageSquare size={15} />
                </Link>
              </div>
            </section>
          )}
        </aside>
      </div>
      {dialog && (
        <FormModal
          disabled
          title={
            dialog === "progress"
              ? "Cập nhật tiến độ hiện tại"
              : "Sửa ghi chú nội bộ"
          }
          description={
            dialog === "progress"
              ? "Cập nhật tiến độ. Chọn Hoàn thành đơn khi đạt mục tiêu."
              : "Ghi chú quản trị chỉ hiển thị trong không gian vận hành."
          }
          submit="Lưu cập nhật"
          onClose={() => setDialog(null)}
          onSubmit={async (data) => {
            if (dialog === "notes")
              await orderService.saveNotes(id, String(data.get("notes")));
            else
              await orderService.updateProgress(
                id,
                Number(data.get("progress")),
                Number(data.get("lp")),
                String(data.get("note")),
              );
            notice("Đã lưu cập nhật đơn hàng.");
          }}
        >
          {dialog === "notes" ? (
            <Field label="Ghi chú quản trị">
              <textarea
                name="notes"
                rows={5}
                defaultValue={order.adminNotes}
                maxLength={3000}
              />
            </Field>
          ) : (
            <>
              <Field label="Phần trăm tiến độ">
                <input
                  name="progress"
                  type="number"
                  min={order.progress}
                  max={99}
                  defaultValue={Math.min(99, order.progress + 5)}
                  required
                />
              </Field>
              <Field label="LP hiện tại">
                <input
                  name="lp"
                  type="number"
                  min={0}
                  max={100}
                  defaultValue={order.currentLP}
                  required
                />
              </Field>
              <Field label="Ghi chú cập nhật">
                <textarea
                  name="note"
                  rows={3}
                  maxLength={1000}
                  placeholder="Phiên làm việc này có thay đổi gì?"
                />
              </Field>
            </>
          )}
        </FormModal>
      )}
    </>
  );
}
