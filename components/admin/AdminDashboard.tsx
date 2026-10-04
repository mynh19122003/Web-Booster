"use client";
import Link from "next/link";
import { useState, useEffect, useRef, type ReactNode } from "react";
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  ArrowUpRight,
  Search,
  Download,
  Eye,
  Trash2,
  X,
  Hexagon,
  CheckCircle2,
} from "lucide-react";
import { games } from "@/data/games";
import { services } from "@/data/services";
import {
  useApplications,
  useRequests,
  updateApplication,
  updateRequest,
  deleteRecord,
  type Application,
  type ServiceRequest,
  type ApplicationStatus,
  type RequestStatus,
} from "@/lib/local-records";
import { CurrencySwitch, useMoney } from "@/components/ui/Currency";
type Tab = "overview" | "requests" | "applications";
const applicationStatuses: ApplicationStatus[] = [
  "New",
  "Reviewing",
  "Accepted",
  "Declined",
];
const requestStatuses: RequestStatus[] = [
  "New",
  "Contacted",
  "Completed",
  "Cancelled",
];
function gameName(slug: string) {
  return games.find((g) => g.slug === slug)?.name || slug;
}
function serviceName(slug: string) {
  return services.find((s) => s.slug === slug)?.name || slug;
}
function date(value: string) {
  return new Date(value).toLocaleDateString("en-GB");
}
export function AdminDashboard() {
  const applications = useApplications();
  const requests = useRequests();
  const money = useMoney();
  const [tab, setTab] = useState<Tab>("overview");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");
  const [game, setGame] = useState("All");
  const [detail, setDetail] = useState<Application | ServiceRequest | null>(
    null,
  );
  const [pendingDelete, setPendingDelete] = useState<
    Application | ServiceRequest | null
  >(null);
  const [notice, setNotice] = useState("");
  const kind = tab === "applications" ? "applications" : "requests";
  const statuses =
    kind === "applications" ? applicationStatuses : requestStatuses;
  const all: (Application | ServiceRequest)[] =
    kind === "applications" ? applications : requests;
  const rows = all.filter(
    (r) =>
      `${r.id} ${r.name} ${r.email} ${gameName(r.game)}`
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (status === "All" || r.status === status) &&
      (game === "All" || r.game === game),
  );
  function navigate(next: Tab) {
    setTab(next);
    setQuery("");
    setStatus("All");
    setGame("All");
    setNotice("");
  }
  function changeStatus(record: Application | ServiceRequest, next: string) {
    try {
      if ("rank" in record)
        updateApplication(record.id, next as ApplicationStatus);
      else updateRequest(record.id, next as RequestStatus);
      setNotice(`Updated ${record.id}.`);
    } catch {
      setNotice("Unable to save. Check browser storage.");
    }
  }
  function exportData() {
    const data = tab === "overview" ? { applications, requests } : rows;
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ascend-${tab}-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }
  const title =
    tab === "overview"
      ? "Overview"
      : tab === "requests"
        ? "Service requests"
        : "Recruitment";
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link href="/" className="admin-brand">
          <Hexagon size={26} /> ASCEND
        </Link>
        <span className="admin-caption">WORKSPACE</span>
        <nav aria-label="Admin navigation">
          {(
            [
              { id: "overview", label: "Overview", Icon: LayoutDashboard },
              {
                id: "requests",
                label: "Service requests",
                Icon: ClipboardList,
              },
              { id: "applications", label: "Recruitment", Icon: Users },
            ] as const
          ).map(({ id, label, Icon }) => (
            <button
              key={id}
              aria-current={tab === id ? "page" : undefined}
              onClick={() => navigate(id)}
            >
              <Icon size={18} />
              {label}
              <span>
                {id === "applications"
                  ? applications.length
                  : id === "requests"
                    ? requests.length
                    : ""}
              </span>
            </button>
          ))}
        </nav>
        <Link href="/" className="admin-back">
          View website <ArrowUpRight size={16} />
        </Link>
      </aside>
      <div className="admin-content">
        <header className="admin-topbar">
          <span>Admin / {title}</span>
          <div>
            <span className="local-notice">Local preview</span>
            <CurrencySwitch compact />
          </div>
        </header>
        <div className="admin-body">
          <div className="admin-heading">
            <div>
              <h1>{title}</h1>
              <p>Manage records saved on this browser.</p>
            </div>
            <button
              className="admin-button"
              onClick={exportData}
              title="Export records as JSON"
            >
              <Download size={16} />
              Export
            </button>
          </div>
          {tab === "overview" ? (
            <>
              <div className="admin-metrics">
                <div>
                  <ClipboardList size={21} />
                  <span>Service requests</span>
                  <strong>{requests.length}</strong>
                </div>
                <div>
                  <Users size={21} />
                  <span>Applications</span>
                  <strong>{applications.length}</strong>
                </div>
                <div>
                  <CheckCircle2 size={21} />
                  <span>Needs review</span>
                  <strong>
                    {requests.filter((r) => r.status === "New").length +
                      applications.filter((a) => a.status === "New").length}
                  </strong>
                </div>
              </div>
              <div className="admin-overview">
                <section>
                  <div className="admin-section-heading">
                    <h2>Recent service requests</h2>
                    <button onClick={() => navigate("requests")}>
                      View all <ArrowUpRight size={15} />
                    </button>
                  </div>
                  {requests.length ? (
                    requests.slice(0, 5).map((r) => (
                      <button
                        className="activity-row"
                        onClick={() => setDetail(r)}
                        key={r.id}
                      >
                        <span>
                          <strong>{r.name}</strong>
                          <small>
                            {gameName(r.game)} · {serviceName(r.service)}
                          </small>
                        </span>
                        <span className="record-status">{r.status}</span>
                      </button>
                    ))
                  ) : (
                    <div className="admin-empty">
                      <ClipboardList size={30} />
                      <h3>No service requests yet</h3>
                      <Link href="/services">
                        Browse services <ArrowUpRight size={15} />
                      </Link>
                    </div>
                  )}
                </section>
                <section>
                  <div className="admin-section-heading">
                    <h2>Recent applications</h2>
                    <button onClick={() => navigate("applications")}>
                      View all <ArrowUpRight size={15} />
                    </button>
                  </div>
                  {applications.length ? (
                    applications.slice(0, 5).map((r) => (
                      <button
                        className="activity-row"
                        onClick={() => setDetail(r)}
                        key={r.id}
                      >
                        <span>
                          <strong>{r.name}</strong>
                          <small>
                            {gameName(r.game)} · {r.rank}
                          </small>
                        </span>
                        <span className="record-status">{r.status}</span>
                      </button>
                    ))
                  ) : (
                    <div className="admin-empty">
                      <Users size={30} />
                      <h3>No applications yet</h3>
                      <Link href="/careers">
                        Open recruitment <ArrowUpRight size={15} />
                      </Link>
                    </div>
                  )}
                </section>
              </div>
            </>
          ) : (
            <>
              <div className="admin-filters">
                <label className="admin-search">
                  <Search size={17} />
                  <input
                    aria-label="Search records"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search name, email or reference"
                  />
                </label>
                <select
                  aria-label="Filter by game"
                  value={game}
                  onChange={(e) => setGame(e.target.value)}
                >
                  <option value="All">All games</option>
                  {games.map((g) => (
                    <option key={g.slug} value={g.slug}>
                      {g.name}
                    </option>
                  ))}
                </select>
                <select
                  aria-label="Filter by status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="All">All statuses</option>
                  {statuses.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
                <span>{rows.length} records</span>
              </div>
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Applicant / customer</th>
                      <th>Game</th>
                      <th>
                        {kind === "applications"
                          ? "Rank"
                          : "Service / estimate"}
                      </th>
                      <th>Received</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.id}>
                        <td>
                          <strong>{r.name}</strong>
                          <small>{r.email}</small>
                          <small>{r.id}</small>
                        </td>
                        <td>{gameName(r.game)}</td>
                        <td>
                          {"rank" in r ? (
                            r.rank
                          ) : (
                            <>
                              {serviceName(r.service)}
                              <small>{money.format(r.priceUsd)}</small>
                            </>
                          )}
                        </td>
                        <td>{date(r.createdAt)}</td>
                        <td>
                          <select
                            aria-label={`Status for ${r.name}`}
                            value={r.status}
                            onChange={(e) => changeStatus(r, e.target.value)}
                          >
                            {statuses.map((s) => (
                              <option key={s}>{s}</option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <div className="admin-row-actions">
                            <button
                              aria-label={`View ${r.name}`}
                              title="View details"
                              onClick={() => setDetail(r)}
                            >
                              <Eye size={17} />
                            </button>
                            <button
                              aria-label={`Delete ${r.name}`}
                              title="Delete record"
                              onClick={() => setPendingDelete(r)}
                            >
                              <Trash2 size={17} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!rows.length && (
                  <div className="admin-empty">
                    <Search size={30} />
                    <h3>
                      {all.length ? "No matching records" : "No records yet"}
                    </h3>
                    <p>
                      {all.length
                        ? "Try another search or filter."
                        : "New submissions will appear here."}
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
          {notice && (
            <p className="admin-notice" role="status">
              {notice}
            </p>
          )}
          <p className="admin-local-footer">
            Browser storage only · no shared database or authenticated admin
            account
          </p>
        </div>
      </div>
      {detail && (
        <AdminModal onClose={() => setDetail(null)} labelledBy="record-title">
          <RecordDetails
            key={detail.id}
            record={detail}
            onClose={() => setDetail(null)}
          />
        </AdminModal>
      )}
      {pendingDelete && (
        <AdminModal
          onClose={() => setPendingDelete(null)}
          labelledBy="delete-title"
        >
          <h2 id="delete-title">Delete this record?</h2>
          <p>
            {pendingDelete.name} · {pendingDelete.id}
          </p>
          <div className="admin-modal-actions">
            <button
              className="admin-button"
              onClick={() => setPendingDelete(null)}
            >
              Cancel
            </button>
            <button
              className="admin-button danger"
              onClick={() => {
                try {
                  deleteRecord(
                    "rank" in pendingDelete ? "applications" : "requests",
                    pendingDelete.id,
                  );
                  setNotice("Record deleted.");
                  setPendingDelete(null);
                } catch {
                  setNotice("Unable to delete record.");
                }
              }}
            >
              <Trash2 size={16} />
              Delete
            </button>
          </div>
        </AdminModal>
      )}
    </div>
  );
}
function RecordDetails({
  record,
  onClose,
}: {
  record: Application | ServiceRequest;
  onClose: () => void;
}) {
  const money = useMoney();
  return (
    <>
      <button
        className="admin-modal-close"
        aria-label="Close details"
        onClick={onClose}
      >
        <X size={19} />
      </button>
      <span className="admin-caption">{record.id}</span>
      <h2 id="record-title">{record.name}</h2>
      <dl className="admin-details">
        <dt>Email</dt>
        <dd>
          <a href={`mailto:${record.email}`}>{record.email}</a>
        </dd>
        <dt>Game</dt>
        <dd>{gameName(record.game)}</dd>
        <dt>Received</dt>
        <dd>{date(record.createdAt)}</dd>
        <dt>Status</dt>
        <dd>{record.status}</dd>
        {"rank" in record ? (
          <>
            <dt>Phone</dt>
            <dd>{record.phone}</dd>
            <dt>Rank</dt>
            <dd>{record.rank}</dd>
            <dt>Experience</dt>
            <dd>{record.message || "Not provided"}</dd>
          </>
        ) : (
          <>
            <dt>Service</dt>
            <dd>{serviceName(record.service)}</dd>
            <dt>Plan</dt>
            <dd>
              {record.service === "coaching"
                ? `${record.units} coaching hours`
                : record.service === "placements"
                  ? `${record.units} placement matches`
                  : `${record.from} to ${record.to}`}
            </dd>
            <dt>Estimate</dt>
            <dd>{money.format(record.priceUsd)}</dd>
            <dt>Region / queue</dt>
            <dd>
              {record.region} / {record.queue}
            </dd>
            <dt>Preferences</dt>
            <dd>{record.champions || "None"}</dd>
          </>
        )}
      </dl>
    </>
  );
}

function AdminModal({
  children,
  onClose,
  labelledBy,
}: {
  children: ReactNode;
  onClose: () => void;
  labelledBy: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className="admin-modal"
      aria-labelledby={labelledBy}
      onCancel={onClose}
      onClick={(event) => {
        const bounds = event.currentTarget.getBoundingClientRect();
        if (
          event.target === event.currentTarget &&
          (event.clientX < bounds.left ||
            event.clientX > bounds.right ||
            event.clientY < bounds.top ||
            event.clientY > bounds.bottom)
        )
          onClose();
      }}
    >
      {children}
    </dialog>
  );
}
