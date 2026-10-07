"use client";

import { useAdminText } from "@/lib/admin/use-admin-text";
import { adminText, adminError } from "@/lib/admin/vi";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
  type FormEvent,
} from "react";
import {
  Search,
  X,
  Inbox,
  ArrowUpRight,
  ShieldCheck,
  MoreHorizontal,
} from "lucide-react";
import type { Permission, AuditActivity } from "@/types/admin";
import { permissionOptions } from "@/lib/admin/config";
export const formatDate = (value: string) =>
  value
    ? new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      }).format(new Date(value))
    : "Chưa đăng nhập";
export function Avatar({ name, size = "" }: { name: string; size?: string }) {
  return (
    <span className={`ap-avatar ${size}`}>
      {name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")}
    </span>
  );
}
export function StatusBadge({ status }: { status: string }) {
  const text = useAdminText();
  return (
    <span className={`ap-badge ap-status-${status.toLowerCase()}`}>
      <i />
      {text("Cancel") === "Cancel"
        ? status.replaceAll("_", " ").toLowerCase()
        : text(status)}
    </span>
  );
}
export function PermissionBadgeGroup({
  permissions,
}: {
  permissions: Permission[];
}) {
  return (
    <div className="ap-permissions">
      {permissions.length ? (
        permissions.map((p) => (
          <span
            key={p}
            title={
              permissionOptions.find((option) => option.value === p)
                ?.description ?? p
            }
          >
            {permissionOptions.find((option) => option.value === p)?.label ?? p}
          </span>
        ))
      ) : (
        <span>Chưa có quyền</span>
      )}
    </div>
  );
}
export function PageHeader({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <header className="ap-page-header">
      <div>
        {eyebrow && <div className="ap-eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      <div className="ap-header-actions">{children}</div>
    </header>
  );
}
export function EmptyState({
  title = "Nothing here yet",
  text = "Try a different search or filter.",
  children,
}: {
  title?: string;
  text?: string;
  children?: ReactNode;
}) {
  const translate = useAdminText();
  return (
    <div className="ap-empty">
      <Inbox size={30} />
      <h3>{translate(title)}</h3>
      <p>{translate(text)}</p>
      {children}
    </div>
  );
}
export function AccessDenied() {
  return (
    <EmptyState
      title="Bạn không có quyền truy cập"
      text="Vai trò của bạn chưa được cấp quyền truy cập. Hãy liên hệ quản trị viên cấp cao."
    />
  );
}
export function SearchFilterBar({
  query,
  onQuery,
  status,
  onStatus,
  statuses,
  placeholder = "Tìm theo tên hoặc email…",
}: {
  query: string;
  onQuery: (s: string) => void;
  status: string;
  onStatus: (s: string) => void;
  statuses: string[];
  placeholder?: string;
}) {
  return (
    <div className="ap-filters">
      <label className="ap-search">
        <Search size={17} />
        <input
          aria-label="Tìm dữ liệu"
          placeholder={placeholder}
          value={query}
          onChange={(e) => onQuery(e.target.value)}
        />
        {query && (
          <button aria-label="Xóa tìm kiếm" onClick={() => onQuery("")}>
            <X size={15} />
          </button>
        )}
      </label>
      <label className="ap-filter-select">
        <span>Trạng thái</span>
        <select
          aria-label="Lọc trạng thái"
          value={status}
          onChange={(e) => onStatus(e.target.value)}
        >
          {["ALL", ...statuses].map((s) => (
            <option key={s} value={s}>
              {s === "ALL" ? "Tất cả trạng thái" : adminText(s)}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
export function DataTable<T extends { id: string }>({
  rows,
  columns,
  label,
}: {
  rows: T[];
  columns: { label: string; render: (row: T) => ReactNode }[];
  label: string;
}) {
  return (
    <div className="ap-table-wrap">
      <table aria-label={label}>
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.label}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {!rows.length && (
            <tr>
              <td colSpan={columns.length}>
                <EmptyState
                  title={
                    label === "Nhân sự"
                      ? "Chưa có nhân sự."
                      : label.toLowerCase().includes("phiên")
                        ? "Chưa có dữ liệu phiên đăng nhập."
                        : "Chưa có lời mời nhân sự."
                  }
                  text="Dữ liệu chưa khả dụng."
                />
              </td>
            </tr>
          )}
          {rows.map((row) => (
            <tr key={row.id}>
              {columns.map((c) => (
                <td key={c.label}>{c.render(row)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="ap-table-footer">
        {rows.length
          ? `Hiển thị ${rows.length} ${label.toLowerCase()}`
          : "Chưa có dữ liệu."}
        <span>
          {rows.length > 0 && (
            <>
              Đã tải dữ liệu <ShieldCheck size={13} />
            </>
          )}
        </span>
      </div>
    </div>
  );
}
export function ActionMenu({ children }: { children: ReactNode }) {
  return (
    <details className="ap-action-menu">
      <summary aria-label="Mở thao tác">
        <MoreHorizontal size={19} />
      </summary>
      <div
        onClick={(event) => {
          if ((event.target as HTMLElement).closest("button, a")) {
            event.currentTarget.closest("details")?.removeAttribute("open");
          }
        }}
      >
        {children}
      </div>
    </details>
  );
}
export function AdminStatCard({
  label,
  value,
  note,
  icon,
  index,
}: {
  label: string;
  value: number | null;
  note: string;
  icon: ReactNode;
  index: string;
}) {
  return (
    <article className="ap-stat">
      <div className="ap-stat-top">
        <span>{label}</span>
        <span className="ap-stat-icon">{icon}</span>
      </div>
      <strong>{value === null ? "—" : String(value).padStart(2, "0")}</strong>
      <div className="ap-stat-bottom">
        <span>{note}</span>
        <small>
          {index} <ArrowUpRight size={13} />
        </small>
      </div>
    </article>
  );
}
export function ActivityTimeline({
  activities,
}: {
  activities: AuditActivity[];
}) {
  return (
    <div className="ap-timeline">
      {!activities.length && <p>Chưa có hoạt động.</p>}
      {activities.map((a) => (
        <div className="ap-timeline-item" key={a.id}>
          <span className="ap-timeline-dot">
            <ShieldCheck size={14} />
          </span>
          <div>
            <p>{adminText(a.description)}</p>
            <small>
              {a.actor} <span>·</span> {formatDate(a.at)}
            </small>
          </div>
        </div>
      ))}
    </div>
  );
}
export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  const text = useAdminText();
  return (
    <label
      className="ap-field"
      onInvalidCapture={(event) => {
        if (text("Cancel") === "Cancel") return;
        const input = event.target;
        if (!(
          input instanceof HTMLInputElement ||
          input instanceof HTMLTextAreaElement ||
          input instanceof HTMLSelectElement
        ))
          return;
        const validity = input.validity;
        const message = validity.valueMissing
          ? "Trường này là bắt buộc."
          : validity.typeMismatch
            ? "Vui lòng nhập đúng định dạng."
            : validity.tooShort
              ? "Thông tin nhập quá ngắn."
              : validity.tooLong
                ? "Thông tin nhập quá dài."
                : validity.rangeUnderflow || validity.rangeOverflow
                  ? "Giá trị nằm ngoài phạm vi cho phép."
                  : "Vui lòng kiểm tra lại thông tin.";
        input.setCustomValidity(message);
      }}
      onInputCapture={(event) => {
        const input = event.target;
        if (
          input instanceof HTMLInputElement ||
          input instanceof HTMLTextAreaElement ||
          input instanceof HTMLSelectElement
        )
          input.setCustomValidity("");
      }}
    >
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}
export function PermissionFields({
  defaults = [],
}: {
  defaults?: Permission[];
}) {
  return (
    <fieldset className="ap-permission-fields">
      <legend>Quyền hạn nhân sự</legend>
      {permissionOptions.map((p) => (
        <label key={p.value}>
          <input
            type="checkbox"
            name="permissions"
            value={p.value}
            defaultChecked={defaults.includes(p.value)}
          />
          <span>
            <strong>{p.label}</strong>
            <small>{p.description}</small>
          </span>
        </label>
      ))}
    </fieldset>
  );
}
export function FormModal({
  title,
  description,
  submit = "Save changes",
  danger,
  onClose,
  onSubmit,
  children,
  className = "",
  disabled = false,
}: {
  title: string;
  description: string;
  className?: string;
  disabled?: boolean;
  submit?: string;
  danger?: boolean;
  onClose: () => void;
  onSubmit: (data: FormData) => Promise<void>;
  children?: ReactNode;
}) {
  const text = useAdminText();
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const submitting = useRef(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    const dialog = ref.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog?.showModal();
    return () => {
      dialog?.close();
      document.body.style.overflow = previousOverflow;
    };
  }, []);
  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (disabled || submitting.current) return;
    submitting.current = true;
    setPending(true);
    setError("");
    try {
      await onSubmit(new FormData(e.currentTarget));
      onClose();
    } catch (e) {
      setError(
        text("Cancel") === "Cancel"
          ? e instanceof Error
            ? e.message
            : "Something went wrong. Please try again."
          : adminError(e),
      );
    } finally {
      submitting.current = false;
      setPending(false);
    }
  }
  return (
    <dialog
      ref={ref}
      className={`ap-modal ${className}`}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        if (!pending) onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !pending) onClose();
      }}
    >
      <form onSubmit={save}>
        <header>
          <div>
            <h2 id={titleId}>{title}</h2>
            <p>{description}</p>
          </div>
          <button
            type="button"
            aria-label={text("Close dialog")}
            disabled={pending}
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </header>
        <div className="ap-modal-body">
          {children}
          {disabled && (
            <p className="ap-info-strip">
              Chức năng sẽ khả dụng sau khi kết nối API.
            </p>
          )}
          {error && (
            <p role="alert" className="ap-error">
              {text("Cancel") === "Cancel" ? error : adminError(error)}
            </p>
          )}
        </div>
        <footer>
          <button
            className="ap-button"
            type="button"
            onClick={onClose}
            disabled={pending}
          >
            {text("Cancel")}
          </button>
          <button
            className={`ap-button ${danger ? "danger" : "primary"}`}
            disabled={pending || disabled}
          >
            {pending ? text("Saving…") : text(submit)}
          </button>
        </footer>
      </form>
    </dialog>
  );
}
