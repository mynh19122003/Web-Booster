"use client";

import { useState } from "react";
import { ClipboardList, Eye, EyeOff, LockKeyhole } from "lucide-react";
import { useLanguage } from "@/components/ui/LanguageProvider";
import { translateText } from "@/lib/i18n";
import type { OrderRequestDetails } from "@/lib/order-request-types";

export function CustomerOrderPanel({
  details,
  assigned,
}: {
  details: OrderRequestDetails | null;
  assigned: boolean;
}) {
  const { language } = useLanguage();
  const copy = (english: string, vietnamese: string) =>
    translateText(language, english, vietnamese);
  const [showPassword, setShowPassword] = useState(false);
  const empty = copy("No preference", "Không có tùy chọn");
  return (
    <aside
      className="employee-order-panel"
      aria-label={copy(
        "Customer Order & Requests",
        "Đơn hàng & yêu cầu khách hàng",
      )}
    >
      <header>
        <ClipboardList size={19} />
        <h2>
          {copy("Customer Order & Requests", "Đơn hàng & yêu cầu khách hàng")}
        </h2>
      </header>
      {details ? (
        <>
          <p className="employee-order-number">{details.orderNumber}</p>
          <dl>
            {[
              [copy("Service", "Dịch vụ"), ({
                "rank-boost": copy("Rank boost", "Boost rank"),
                "duo-boost": copy("Duo boost", "Boost duo"),
                placements: copy("Placements", "Trận phân hạng"),
                coaching: copy("Coaching", "Huấn luyện"),
              } as Record<string, string>)[details.service] ?? details.service],
              [copy("Current rank", "Rank hiện tại"), details.currentRank],
              [copy("Target rank", "Rank mục tiêu"), details.targetRank],
              [copy("Region", "Khu vực"), details.region],
              [copy("Queue", "Chế độ"), details.queue],
              [copy("Assigned role", "Vị trí yêu cầu"), details.role || empty],
              [
                copy("Champion pool", "Tướng ưu tiên"),
                details.championPool || empty,
              ],
              [
                copy("Flash slot", "Phím Tốc biến"),
                details.flashSlot === "no-preference"
                  ? empty
                  : details.flashSlot,
              ],
            ].map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <section className="employee-order-account">
            <h3>
              <LockKeyhole size={15} />
              {copy("Riot account", "Tài khoản Riot")}
            </h3>
            {details.riotAccount ? (
              <dl>
                <div>
                  <dt>Riot ID</dt>
                  <dd>{details.riotAccount.riotIdTag}</dd>
                </div>
                <div>
                  <dt>{copy("Login username", "Tên đăng nhập")}</dt>
                  <dd>{details.riotAccount.riotUsername}</dd>
                </div>
                <div>
                  <dt>{copy("Password", "Mật khẩu")}</dt>
                  <dd className="employee-order-password">
                    <span>
                      {showPassword
                        ? details.riotAccount.riotPass
                        : "••••••••••••"}
                    </span>
                    <button
                      type="button"
                      aria-pressed={showPassword}
                      aria-label={
                        showPassword
                          ? copy("Hide Riot password", "Ẩn mật khẩu Riot")
                          : copy("Show Riot password", "Hiện mật khẩu Riot")
                      }
                      onClick={() => setShowPassword((value) => !value)}
                    >
                      {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </dd>
                </div>
              </dl>
            ) : (
              <p>
                {copy(
                  "Account login is not required for this service.",
                  "Dịch vụ này không yêu cầu đăng nhập tài khoản.",
                )}
              </p>
            )}
          </section>
          <section className="employee-order-notes">
            <h3>{copy("Customer notes", "Ghi chú khách hàng")}</h3>
            <p>
              {details.customerNotes ||
                copy("No additional notes.", "Không có ghi chú thêm.")}
            </p>
          </section>
        </>
      ) : (
        <p className="employee-order-empty">
          <LockKeyhole size={22} />
          {assigned
            ? copy(
                "No checkout specifications are attached to this conversation.",
                "Hội thoại này chưa có thông tin đơn hàng từ trang thanh toán.",
              )
            : copy(
                "Accept an unassigned request to view its private order details. Details are available only to the assigned employee.",
                "Nhận yêu cầu chưa được phân công để xem thông tin riêng. Chỉ nhân viên được phân công có quyền truy cập.",
              )}
        </p>
      )}
    </aside>
  );
}
