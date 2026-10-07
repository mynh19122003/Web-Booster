"use client";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ExternalLink, LockKeyhole } from "lucide-react";
import { FormModal } from "@/components/admin/portal/Ui";
import { useWorkflow } from "@/lib/workflow/store";
import { Facts, Panel } from "./Shared";
import type { AvailableOrder } from "@/types/workflow";

const subscribe = () => () => {};
const windowsPlatform = () =>
  /Windows/i.test(navigator.userAgent) &&
  !/Android|iPhone|iPad|Mobile/i.test(navigator.userAgent);
export function RiotLauncherHelpModal({ onClose }: { onClose: () => void }) {
  return (
    <FormModal
      title="Thiết lập Riot Client"
      description="ASCEND Launcher dành cho PoC trên Windows 10/11."
      submit="Đã hiểu"
      onClose={onClose}
      onSubmit={async () => {}}
    >
      <ol className="riot-help">
        <li>Cài Riot Client từ nguồn chính thức của Riot Games.</li>
        <li>
          Thiết lập ASCEND local protocol handler một lần trên máy thử theo
          README đi kèm dự án.
        </li>
        <li>
          Nếu không tìm thấy client, thiết lập đúng đường dẫn Riot Client theo
          README đi kèm dự án, rồi chọn Thử lại trong launcher.
        </li>
        <li>
          Thử mở lại và chọn Mở ứng dụng nếu trình duyệt yêu cầu xác nhận.
        </li>
      </ol>
      <p>
        Website chưa thể xác minh máy đã cài handler hoặc client đã mở. Nếu bạn
        hủy prompt, trạng thái vẫn là Chưa xác minh.
      </p>
      {process.env.NODE_ENV === "development" && (
        <details>
          <summary>Thiết lập Riot Launcher (Development)</summary>
          <p>
            Xem <code>tools/riot-launcher-poc/README.md</code>. Cài đặt là thao
            tác thủ công trên máy Windows thử; website không tải hoặc chạy
            script.
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
  const [error, setError] = useState("");
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
  function launch() {
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
    )
      return;
    try {
      window.location.href = "ascendriot://open/league";
      setSentFor(order.id);
      setError("");
    } catch {
      setError(
        "Trình duyệt không gửi được yêu cầu. Hãy xem hướng dẫn thiết lập.",
      );
    }
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
        <button
          className="ap-button primary full"
          disabled={!ready || !windows}
          onClick={launch}
        >
          <ExternalLink size={17} /> MỞ RIOT CLIENT
        </button>
        {ready && sentFor === order.id && (
          <div role="status" className="wf-banner">
            <p>Đã gửi yêu cầu mở Riot Client.</p>
            <p>Nếu trình duyệt yêu cầu xác nhận, hãy chọn Mở ứng dụng.</p>
          </div>
        )}
        {error && (
          <p role="alert" className="ap-error">
            {error}
          </p>
        )}
        <p>
          Để mở Riot Client từ website, máy Windows cần thiết lập ASCEND local
          protocol handler.
        </p>
        <small>
          ASCEND Launcher cho PoC trên Windows.
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
