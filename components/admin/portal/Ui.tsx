"use client";
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
    ? new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      }).format(new Date(value))
    : "Not yet signed in";
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
  return (
    <span className={`ap-badge ap-status-${status.toLowerCase()}`}>
      <i />
      {status.replaceAll("_", " ").toLowerCase()}
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
          <span key={p} title={p}>
            {p.startsWith("employee.application")
              ? p.split(".").at(-1)
              : p.replace(".", " · ")}
          </span>
        ))
      ) : (
        <span>No permissions</span>
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
  return (
    <div className="ap-empty">
      <Inbox size={30} />
      <h3>{title}</h3>
      <p>{text}</p>
      {children}
    </div>
  );
}
export function AccessDenied() {
  return (
    <EmptyState
      title="This area is restricted"
      text="Your role doesn’t have access to this workspace. Ask your super admin to review your permissions."
    />
  );
}
export function SearchFilterBar({
  query,
  onQuery,
  status,
  onStatus,
  statuses,
  placeholder = "Search by name or email…",
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
          aria-label="Search records"
          placeholder={placeholder}
          value={query}
          onChange={(e) => onQuery(e.target.value)}
        />
        {query && (
          <button aria-label="Clear search" onClick={() => onQuery("")}>
            <X size={15} />
          </button>
        )}
      </label>
      <label className="ap-filter-select">
        <span>Status</span>
        <select
          aria-label="Filter status"
          value={status}
          onChange={(e) => onStatus(e.target.value)}
        >
          {["ALL", ...statuses].map((s) => (
            <option key={s} value={s}>
              {s === "ALL" ? "All statuses" : s[0] + s.slice(1).toLowerCase()}
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
  return rows.length ? (
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
        Showing {rows.length} {label.toLowerCase()}
        <span>
          All records loaded <ShieldCheck size={13} />
        </span>
      </div>
    </div>
  ) : (
    <EmptyState />
  );
}
export function ActionMenu({ children }: { children: ReactNode }) {
  return (
    <details className="ap-action-menu">
      <summary aria-label="Open actions">
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
  value: number;
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
      <strong>{String(value).padStart(2, "0")}</strong>
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
      {activities.map((a) => (
        <div className="ap-timeline-item" key={a.id}>
          <span className="ap-timeline-dot">
            <ShieldCheck size={14} />
          </span>
          <div>
            <p>{a.description}</p>
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
  return (
    <label className="ap-field">
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
      <legend>Staff permissions</legend>
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
}: {
  title: string;
  description: string;
  submit?: string;
  danger?: boolean;
  onClose: () => void;
  onSubmit: (data: FormData) => Promise<void>;
  children?: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError("");
    try {
      await onSubmit(new FormData(e.currentTarget));
      onClose();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Something went wrong. Please retry.",
      );
    } finally {
      setPending(false);
    }
  }
  return (
    <dialog
      ref={ref}
      className="ap-modal"
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
            aria-label="Close dialog"
            disabled={pending}
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </header>
        <div className="ap-modal-body">
          {children}
          {error && (
            <p role="alert" className="ap-error">
              {error}
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
            Cancel
          </button>
          <button
            className={`ap-button ${danger ? "danger" : "primary"}`}
            disabled={pending}
          >
            {pending ? "Saving…" : submit}
          </button>
        </footer>
      </form>
    </dialog>
  );
}
