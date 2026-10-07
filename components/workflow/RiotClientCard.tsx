"use client";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ExternalLink, LockKeyhole } from "lucide-react";
import { FormModal } from "@/components/admin/portal/Ui";
import { useWorkflow } from "@/lib/workflow/store";
import { Facts, Panel } from "./Shared";
import type { AvailableOrder } from "@/types/workflow";
import type { MouseEvent } from "react";

const launcherDownload = process.env.NEXT_PUBLIC_ASCEND_LAUNCHER_DOWNLOAD_URL ||
  "/downloads/AscendLauncher_0.1.0_x64-setup.exe";

const subscribe = () => () => {};
const windowsPlatform = () =>
  /Windows/i.test(navigator.userAgent) &&
  !/Android|iPhone|iPad|Mobile/i.test(navigator.userAgent);
export function RiotLauncherHelpModal({ onClose }: { onClose: () => void }) {
  return (
    <FormModal
      title="Thiết lập Riot Client"
      description="ASCEND Launcher 0.1.0 dành cho Windows 10/11 x64."
      submit="Đã hiểu"
      onClose={onClose}
      onSubmit={async () => {}}
    >
      <ol className="riot-help">
        <li>Cài Riot Client từ nguồn chính thức của Riot Games.</li>
        <li>
          Tải bộ cài bên dưới, mở file setup và chọn Cài đặt cho Windows user
          đang sử dụng. Chọn Mở launcher, rồi bấm CÀI GIAO THỨC.
          Không cần source code hay quyền Administrator.
        </li>
        <li>
          Launcher phải hiện “Giao thức ASCEND đã được cài”. Nếu liên kết bị
          hỏng, chọn SỬA GIAO THỨC. TEST LAUNCHER bên dưới chỉ kiểm tra kết nối,
          không mở Riot.
        </li>
        <li>
          Thử mở lại và chọn Mở ứng dụng nếu trình duyệt yêu cầu xác nhận.
          Launcher sẽ đếm ngược 60 giây; chọn MỞ NGAY để bỏ qua thời gian chờ.
        </li>
      </ol>
      <a className="ap-button primary full" href={launcherDownload} download>
        TẢI ASCEND LAUNCHER
      </a>
      <a className="ap-button full" href="ascendriot://test">TEST LAUNCHER</a>
      <p>
        Nếu launcher không tìm thấy Riot Client, chọn file RiotClientServices.exe
        trong hộp chọn file của launcher. Mỗi Windows account cần cài riêng.
      </p>
      <p>
        Sau khi gỡ giao thức, website không thể gọi launcher. Mở AscendLauncher.exe
        thủ công và bấm CÀI GIAO THỨC để kết nối lại.
      </p>
      <p>
        Bản phát triển chưa ký số có thể bị Windows chặn. Không thay đổi thiết
        lập bảo mật; gửi thông tin hiển thị trong bộ cài để được hỗ trợ.
      </p>
      <p>
        Website chưa thể xác minh máy đã cài handler hoặc client đã mở. Nếu bạn
        hủy prompt, trạng thái vẫn là Chưa xác minh.
      </p>
      {process.env.NODE_ENV === "development" && (
        <details>
          <summary>Thiết lập Riot Launcher (Development)</summary>
          <p>
            Protocol kiểm tra: <code>ascendriot://test</code>.
            Xem thông tin Registry và đường dẫn cài đặt trong bộ cài; website
            không thể đọc Registry hoặc xác minh launcher đã cài.
          </p>
        </details>
      )}
    </FormModal>
  );
}

export function RiotClientCard({ order }: { order: AvailableOrder }) {
  const [help, setHelp] = useState(false);
  const helpButton = useRef<HTMLButtonElement>(null);
  const wasHelpOpen = useRef(false);
  useEffect(() => {
    if (!help && wasHelpOpen.current) helpButton.current?.focus();
    wasHelpOpen.current = help;
  }, [help]);
  const [sentFor, setSentFor] = useState("");
  const s = useWorkflow();
  const employee = s.employees.find((e) => e.id === s.employeeId);
  const stored = s.orders.find((o) => o.id === order.id);
  const ready =
    stored?.status === "IN_PROGRESS" && stored.employeeId === s.employeeId;
  const windows = useSyncExternalStore(subscribe, windowsPlatform, () => false);
  const lockedMessage =
    order.status === "OPEN"
      ? "Bạn cần nhận đơn trước khi có thể sử dụng Riot Client."
      : stored?.employeeId !== s.employeeId
        ? "Đơn không thuộc phân công của bạn. Bạn không thể mở Riot Client cho đơn này."
        : "Chỉ đơn đang thực hiện mới cho phép mở Riot Client.";
  function launch(event: MouseEvent<HTMLAnchorElement>) {
    // Recheck the current projection and session synchronously inside the user click.
    const current = useWorkflow.getState();
    const o = current.orders.find((o) => o.id === order.id);
    const e = current.employees.find((e) => e.id === current.employeeId);
    if (
      !windowsPlatform() ||
      o?.status !== "IN_PROGRESS" ||
      o.employeeId !== e?.id ||
      e?.status !== "ACTIVE" ||
      !current.sessions.some(
        (x) => x.id === current.employeeSessionId && x.status === "ACTIVE",
      )
    ) {
      event.preventDefault();
      return;
    }
    // Browser follows the plain anchor in the same user gesture.
    setSentFor(order.id);
  }
  return (
    <Panel title="RIOT CLIENT">
      <div className="riot-card">
        <p>Mở Riot Client để bắt đầu xử lý đơn hàng.</p>
        <Facts
          items={[
            ["Riot ID mock", employee?.riotId ?? "MockPlayer#VN2"],
            ["Region", order.region],
            ["Game", order.game],
            ["Quyền thao tác", ready ? "Ready" : "Locked"],
            ["Yêu cầu mở", ready ? "Sẵn sàng mở" : "Chưa nhận đơn"],
            ["Trạng thái client", "Chưa xác minh"],
          ]}
        />
        <small>
          Riot ID là tên hiển thị mock, không phải thông tin đăng nhập. Ready
          chỉ thể hiện điều kiện của đơn.
        </small>
        {!ready && (
          <p className="wf-banner">
            <LockKeyhole size={16} /> {lockedMessage}
          </p>
        )}
        {!windows && (
          <p className="wf-banner">
            Tính năng mở client hiện chỉ hỗ trợ Windows.
          </p>
        )}
        {ready && windows ? (
          <a className="ap-button primary full" href="ascendriot://open/league" onClick={launch}>
            <ExternalLink size={17} /> MỞ RIOT CLIENT
          </a>
        ) : (
          <button className="ap-button primary full" disabled>
            <ExternalLink size={17} /> MỞ RIOT CLIENT
          </button>
        )}
        {ready && sentFor === order.id && (
          <div role="status" className="wf-banner">
            <p>Đã gửi yêu cầu mở Riot Client.</p>
            <p>Nếu trình duyệt yêu cầu xác nhận, hãy chọn Mở ứng dụng.</p>
            <p>ASCEND Launcher không mở? Nếu launcher không xuất hiện, hãy cài ASCEND Launcher.</p>
            <a className="ap-button full" href="ascendriot://open/league" onClick={launch}>THỬ LẠI</a>
          </div>
        )}
        <p>
          Bạn cần cài ASCEND Launcher trên máy này để mở Riot Client từ trình duyệt.
        </p>
        <a className="ap-button full" href={launcherDownload} download>TẢI ASCEND LAUNCHER</a>
        <small>
          ASCEND Launcher 0.1.0 • Windows x64. Website chưa thể xác minh launcher đã được cài.
        </small>
        <p>Gặp vấn đề khi mở Riot Client?</p>
        <button
          ref={helpButton}
          className="ap-button full"
          onClick={() => setHelp(true)}
        >
          Hướng dẫn thiết lập
        </button>
      </div>
      {help && <RiotLauncherHelpModal onClose={() => setHelp(false)} />}
    </Panel>
  );
}
