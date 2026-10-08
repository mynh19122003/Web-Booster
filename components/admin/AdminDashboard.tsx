"use client";
import { useLanguage } from "@/components/ui/LanguageProvider";
import { intlLocales, translateText } from "@/lib/i18n";
import { UiText } from "@/components/ui/UiText";

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
  CheckCircle2,
  Moon,
  Sun,
  Plus,
  ExternalLink,
  Pencil,
} from "lucide-react";
import { AscendLogo } from "@/components/ui/AscendLogo";
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
  useStaff,
  addStaff,
  updateStaff,
  deleteStaff,
  assignRequest,
  type StaffRole,
} from "@/lib/local-records";
import { useMoney } from "@/components/ui/Currency";
type Tab = "overview" | "requests" | "applications" | "staff";
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
function date(value: string, locale = "en-GB") {
  return new Date(value).toLocaleDateString(locale);
}
export function AdminDashboard() {
  const { language } = useLanguage();
  const applications = useApplications();
  const requests = useRequests();
  const staff = useStaff();
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
  const [darkMode, setDarkMode] = useState(() => typeof window !== "undefined" && localStorage.getItem("ascend-admin-theme") === "dark");
  const [staffName, setStaffName] = useState("");
  const [staffEmail, setStaffEmail] = useState("");
  const [staffRole, setStaffRole] = useState<StaffRole>("employee");
  const [editingStaff, setEditingStaff] = useState<string | null>(null);
  function toggleTheme() {
    setDarkMode((current) => { const next = !current; localStorage.setItem("ascend-admin-theme", next ? "dark" : "light"); return next; });
  }
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
    <div className={`admin-shell ${darkMode ? "admin-dark" : ""}`}>
      <aside className="admin-sidebar">
        <Link href="/" className="admin-brand flex items-center gap-2">
          <AscendLogo variant="horizontal" size="sm" showTagline={false} />
        </Link>
        <span className="admin-caption"><UiText english={"WORKSPACE"} /></span>
        <nav aria-label={translateText(language, "Admin navigation")}>
          {(
            [
              { id: "overview", label: "Overview", Icon: LayoutDashboard },
              {
                id: "requests",
                label: "Service requests",
                Icon: ClipboardList,
              },
              { id: "applications", label: "Recruitment", Icon: Users },
              { id: "staff", label: "Staff", Icon: Users },
            ] as const
          ).map(({ id, label, Icon }) => (
            <button
              key={id}
              aria-current={tab === id ? "page" : undefined}
              onClick={() => navigate(id)}
            >
              <Icon size={18} />
              <UiText english={label} />
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
        <Link href="/" className="admin-back"><UiText english={"View website"} /><ArrowUpRight size={16} />
        </Link>
      </aside>
      <div className="admin-content">
        <header className="admin-topbar">
          <span><UiText english={"Admin /"} /><UiText english={title} /></span>
          <div>
            <button className="admin-theme-toggle" type="button" onClick={toggleTheme} aria-label={darkMode ? "Use light mode" : "Use dark mode"} title={darkMode ? "Light mode" : "Dark mode"}>{darkMode ? <Sun size={16} /> : <Moon size={16} />}</button>
          </div>
        </header>
        <div className="admin-body">
          <div className="admin-heading">
            <div>
              <h1>{title}</h1>
              <p><UiText english={"Manage applications, requests and your team."} /></p>
            </div>
            <button
              className="admin-button"
              onClick={exportData}
              title={translateText(language, "Export records as JSON")}
            >
              <Download size={16} /><UiText english={"Export"} /></button>
          </div>
          {tab === "staff" ? (
            <section className="admin-staff-panel">
              <div className="admin-section-heading"><div><h2><UiText english={"Team members"} /></h2><p><UiText english={"Assign requests without sharing customer game credentials."} /></p></div></div>
              <div className="staff-metrics"><div><span><UiText english={"Total staff"} /></span><strong>{staff.length}</strong></div><div><span><UiText english={"Admins"} /></span><strong>{staff.filter((member) => member.role === "admin").length}</strong></div><div><span><UiText english={"Employees"} /></span><strong>{staff.filter((member) => member.role === "employee").length}</strong></div></div>
              <form className="staff-form" onSubmit={(event) => { event.preventDefault(); if (!staffName.trim() || !staffEmail.trim()) return; if (editingStaff) updateStaff(editingStaff, { name: staffName.trim(), email: staffEmail.trim(), role: staffRole }); else addStaff({ name: staffName.trim(), email: staffEmail.trim(), role: staffRole }); setStaffName(""); setStaffEmail(""); setStaffRole("employee"); setEditingStaff(null); setNotice(editingStaff ? "Staff member updated." : "Staff member added."); }}>
                <input aria-label={translateText(language, "Staff name")} value={staffName} onChange={(event) => setStaffName(event.target.value)} placeholder={translateText(language, "Full name")} required />
                <input aria-label={translateText(language, "Staff email")} type="email" value={staffEmail} onChange={(event) => setStaffEmail(event.target.value)} placeholder={translateText(language, "Email address")} required />
                <select aria-label={translateText(language, "Staff role")} value={staffRole} onChange={(event) => setStaffRole(event.target.value as StaffRole)}><option value="employee"><UiText english={"Employee"} /></option><option value="admin"><UiText english={"Admin"} /></option></select>
                <button className="admin-button" type="submit">{editingStaff ? "Save changes" : <><Plus size={16} /><UiText english={"Add staff"} /></>}</button>
              </form>
              <div className="staff-list">{staff.map((member) => <div className="staff-row" key={member.id}><span className="user-avatar">{member.name.charAt(0).toUpperCase()}</span><span><strong>{member.name}</strong><small>{member.email} · {member.role}</small></span><div className="staff-actions"><button type="button" aria-label={`Edit ${member.name}`} title={translateText(language, "Edit staff member")} onClick={() => { setEditingStaff(member.id); setStaffName(member.name); setStaffEmail(member.email); setStaffRole(member.role); }}><Pencil size={15} /></button><button type="button" aria-label={`Delete ${member.name}`} title={translateText(language, "Delete staff member")} disabled={member.id === "staff-admin"} onClick={() => { if (window.confirm(`Delete ${member.name}?`)) { deleteStaff(member.id); setNotice("Staff member deleted."); } }}><Trash2 size={15} /></button></div></div>)}</div>
              {editingStaff && <button className="text-link" type="button" onClick={() => { setEditingStaff(null); setStaffName(""); setStaffEmail(""); setStaffRole("employee"); }}><UiText english={"Cancel editing"} /></button>}
            </section>
          ) : tab === "overview" ? (
            <>
              <div className="admin-metrics">
                <div>
                  <ClipboardList size={21} />
                  <span><UiText english={"Service requests"} /></span>
                  <strong>{requests.length}</strong>
                </div>
                <div>
                  <Users size={21} />
                  <span><UiText english={"Applications"} /></span>
                  <strong>{applications.length}</strong>
                </div>
                <div>
                  <CheckCircle2 size={21} />
                  <span><UiText english={"Needs review"} /></span>
                  <strong>
                    {requests.filter((r) => r.status === "New").length +
                      applications.filter((a) => a.status === "New").length}
                  </strong>
                </div>
              </div>
              <div className="admin-overview">
                <section>
                  <div className="admin-section-heading">
                    <h2><UiText english={"Recent service requests"} /></h2>
                    <button onClick={() => navigate("requests")}><UiText english={"View all"} /><ArrowUpRight size={15} />
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
                        <span className="record-status"><UiText english={r.status} /></span>
                      </button>
                    ))
                  ) : (
                    <div className="admin-empty">
                      <ClipboardList size={30} />
                      <h3><UiText english={"No service requests yet"} /></h3>
                      <Link href="/services"><UiText english={"Browse services"} /><ArrowUpRight size={15} />
                      </Link>
                    </div>
                  )}
                </section>
                <section>
                  <div className="admin-section-heading">
                    <h2><UiText english={"Recent applications"} /></h2>
                    <button onClick={() => navigate("applications")}><UiText english={"View all"} /><ArrowUpRight size={15} />
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
                      <h3><UiText english={"No applications yet"} /></h3>
                      <Link href="/careers"><UiText english={"Open recruitment"} /><ArrowUpRight size={15} />
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
                    aria-label={translateText(language, "Search records")}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={translateText(language, "Search name, email or reference")}
                  />
                </label>
                <select
                  aria-label={translateText(language, "Filter by game")}
                  value={game}
                  onChange={(e) => setGame(e.target.value)}
                >
                  <option value="All"><UiText english={"All games"} /></option>
                  {games.map((g) => (
                    <option key={g.slug} value={g.slug}>
                      {g.name}
                    </option>
                  ))}
                </select>
                <select
                  aria-label={translateText(language, "Filter by status")}
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="All"><UiText english={"All statuses"} /></option>
                  {statuses.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
                <span>{rows.length}<UiText english={"records"} /></span>
              </div>
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th><UiText english={"Applicant / customer"} /></th>
                      <th><UiText english={"Game"} /></th>
                      <th>
                        <UiText english={kind === "applications"
                          ? "Rank"
                          : "Service / estimate"} />
                      </th>
                      <th><UiText english={"Received"} /></th>
                      {kind === "requests" && <th><UiText english={"Assigned to"} /></th>}
                      <th><UiText english={"Status"} /></th>
                      <th><UiText english={"Actions"} /></th>
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
                              {r.categoryName ?? serviceName(r.service)}
                              <small>{r.quoteRequired ? "Quote pending" : money.format(r.priceUsd)}</small>
                            </>
                          )}
                        </td>
                        <td>{date(r.createdAt, intlLocales[language])}</td>
                        {kind === "requests" && <td><select aria-label={`Assignee for ${r.name}`} value={"rank" in r ? "" : r.assignedTo ?? ""} onChange={(event) => assignRequest(r.id, event.target.value)}><option value=""><UiText english={"Unassigned"} /></option>{staff.filter((member) => member.active).map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}</select></td>}
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
                            {kind === "requests" && <a className="admin-row-action-link" aria-label={`Open Riot login for ${r.name}`} title={translateText(language, "Open official Riot login")} href="https://authenticate.riotgames.com/" target="_blank" rel="noreferrer"><ExternalLink size={17} /></a>}
                            <button
                              aria-label={`View ${r.name}`}
                              title={translateText(language, "View details")}
                              onClick={() => setDetail(r)}
                            >
                              <Eye size={17} />
                            </button>
                            <button
                              aria-label={`Delete ${r.name}`}
                              title={translateText(language, "Delete record")}
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
                      <UiText english={all.length ? "No matching records" : "No records yet"} />
                    </h3>
                    <p>
                      <UiText english={all.length
                        ? "Try another search or filter."
                        : "New submissions will appear here."} />
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
            <p className="admin-local-footer"><UiText english={"Browser storage only · no shared database or authenticated admin\n            account"} /></p>
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
          <h2 id="delete-title"><UiText english={"Delete this record?"} /></h2>
          <p>
            {pendingDelete.name} · {pendingDelete.id}
          </p>
          <div className="admin-modal-actions">
            <button
              className="admin-button"
              onClick={() => setPendingDelete(null)}
            ><UiText english={"Cancel"} /></button>
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
              <Trash2 size={16} /><UiText english={"Delete"} /></button>
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
  const { language } = useLanguage();
  const money = useMoney();
  return (
    <>
      <button
        className="admin-modal-close"
        aria-label={translateText(language, "Close details")}
        onClick={onClose}
      >
        <X size={19} />
      </button>
      <span className="admin-caption">{record.id}</span>
      <h2 id="record-title">{record.name}</h2>
      <dl className="admin-details">
        <dt><UiText english={"Email"} /></dt>
        <dd>
          <a href={`mailto:${record.email}`}>{record.email}</a>
        </dd>
        <dt><UiText english={"Game"} /></dt>
        <dd>{gameName(record.game)}</dd>
        <dt><UiText english={"Received"} /></dt>
        <dd>{date(record.createdAt, intlLocales[language])}</dd>
        <dt><UiText english={"Status"} /></dt>
        <dd>{record.status}</dd>
        {"rank" in record ? (
          <>
            <dt><UiText english={"Phone"} /></dt>
            <dd>{record.phone}</dd>
            <dt><UiText english={"Rank"} /></dt>
            <dd>{record.rank}</dd>
            <dt><UiText english={"Experience"} /></dt>
            <dd>{record.message || "Not provided"}</dd>
          </>
        ) : (
          <>
            <dt><UiText english={"Service"} /></dt>
            <dd>{record.categoryName ?? serviceName(record.service)}</dd>
            <dt><UiText english={"Plan"} /></dt>
            <dd>
              {record.categoryName ? `${record.from} to ${record.to}` : record.service === "coaching"
                ? `${record.units} coaching hours`
                : record.service === "placements"
                  ? `${record.units} placement matches`
                  : `${record.from} to ${record.to}`}
            </dd>
            <dt><UiText english={"Estimate"} /></dt>
            <dd>{record.quoteRequired ? "Quote pending confirmation" : money.format(record.priceUsd)}</dd>
            <dt><UiText english={"Region / queue"} /></dt>
            <dd>
              {record.region} / {record.queue}
            </dd>
            <dt><UiText english={"Preferences"} /></dt>
            <dd>{record.champions || "None"}</dd>
            <dt><UiText english={"Game access"} /></dt>
            <dd><a className="admin-game-login" href="https://authenticate.riotgames.com/" target="_blank" rel="noreferrer"><ExternalLink size={14} /><UiText english={"Open Riot login"} /></a><small><UiText english={"Opens the official login page. Customer game passwords are never shown or stored."} /></small></dd>
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
