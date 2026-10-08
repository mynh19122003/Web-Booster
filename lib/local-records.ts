"use client";
import { useSyncExternalStore } from "react";
import { games } from "@/data/games";
import { services } from "@/data/services";
import { ranksFor } from "@/lib/service-options";

export type ApplicationStatus = "New" | "Reviewing" | "Accepted" | "Declined";
export type RequestStatus = "New" | "Contacted" | "Completed" | "Cancelled";
export type StaffRole = "admin" | "employee";
export type StaffMember = { id: string; name: string; email: string; role: StaffRole; active: boolean };
export type Application = {
  id: string;
  createdAt: string;
  name: string;
  email: string;
  phone: string;
  game: string;
  rank: string;
  message: string;
  status: ApplicationStatus;
};
export type ServiceRequest = {
  lpGain?: string;
  addOns?: string[];
  pricingVersion?: string;
  categoryName?: string;
  quoteRequired?: boolean;
  coachBooking?: {
    coachId: string;
    coachName: string;
    coachSlug: string;
    packageId?: string;
    packageName?: string;
    format: "hourly" | "duo";
    quantity: number;
    unitPrice: number;
    total: number;
  };
  accountPurchase?: {
    accountId: string;
    title: string;
    game: string;
    price: number;
    server: string;
    rank: string;
    division?: string;
    level: number;
  };
  id: string;
  createdAt: string;
  name: string;
  email: string;
  game: string;
  service: string;
  from: string;
  to: string;
  units: number;
  priceUsd: number;
  currency: "USD" | "EUR";
  rate: number | null;
  queue: string;
  region: string;
  role: string;
  champions: string;
  assignedTo?: string;
  status: RequestStatus;
};
const event = "ascend-records-changed";
const keys = {
  applications: "ascend-applications-v1",
  requests: "ascend-requests-v1",
  staff: "ascend-staff-v1",
};
const empty: never[] = [];
const snapshots = new Map<string, { raw: string | null; value: unknown[] }>();
function read<T>(key: string, valid: (record: unknown) => boolean): T[] {
  try {
    const raw = localStorage.getItem(key);
    const previous = snapshots.get(key);
    if (previous?.raw === raw) return previous.value as T[];
    const parsed: unknown = JSON.parse(raw || "[]");
    const value = Array.isArray(parsed) ? parsed.filter(valid) : [];
    snapshots.set(key, { raw, value });
    return value as T[];
  } catch {
    return empty;
  }
}
function object(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
function common(value: Record<string, unknown>) {
  return (
    ["id", "createdAt", "name", "email", "game", "status"].every(
      (key) => typeof value[key] === "string",
    ) &&
    games.some((g) => g.slug === value.game) &&
    Number.isFinite(Date.parse(String(value.createdAt)))
  );
}
function validApplication(value: unknown) {
  return (
    object(value) &&
    common(value) &&
    typeof value.phone === "string" &&
    typeof value.message === "string" &&
    ranksFor(String(value.game)).includes(String(value.rank)) &&
    ["New", "Reviewing", "Accepted", "Declined"].includes(String(value.status))
  );
}
function validRequest(value: unknown) {
  return (
    object(value) &&
    common(value) &&
    (services.some((s) => s.slug === value.service) || value.service === "account-purchase") &&
    (value.categoryName === undefined || typeof value.categoryName === "string") &&
    (value.quoteRequired === undefined || typeof value.quoteRequired === "boolean") &&
    (value.lpGain === undefined || typeof value.lpGain === "string") &&
    (value.pricingVersion === undefined || typeof value.pricingVersion === "string") &&
    (value.addOns === undefined || (Array.isArray(value.addOns) && value.addOns.length <= 20 && value.addOns.every(item => typeof item === "string"))) &&
    (value.coachBooking === undefined || object(value.coachBooking)) &&
    (value.accountPurchase === undefined || object(value.accountPurchase)) &&
    ["from", "to", "queue", "region", "role", "champions"].every(
      (k) => typeof value[k] === "string",
    ) &&
    typeof value.priceUsd === "number" &&
    Number.isFinite(value.priceUsd) &&
    value.priceUsd >= 0 &&
    typeof value.units === "number" &&
    ["USD", "EUR"].includes(String(value.currency)) &&
    (value.rate === null ||
      (typeof value.rate === "number" &&
        Number.isFinite(value.rate) &&
        value.rate > 0)) &&
    ["New", "Contacted", "Completed", "Cancelled"].includes(
      String(value.status),
    )
  );
}
function validStaff(value: unknown): value is StaffMember {
  return object(value) && typeof value.id === "string" && typeof value.name === "string" && typeof value.email === "string" && ["admin", "employee"].includes(String(value.role)) && typeof value.active === "boolean";
}
const defaultStaff: StaffMember[] = [{ id: "staff-admin", name: "Admin", email: "admin@ascend.local", role: "admin", active: true }];
const readApplications = () =>
  read<Application>(keys.applications, validApplication);
const readRequests = () => read<ServiceRequest>(keys.requests, validRequest);
function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(event, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(event, callback);
  };
}
function write(key: string, records: unknown[]) {
  localStorage.setItem(key, JSON.stringify(records));
  window.dispatchEvent(new Event(event));
}
export function useApplications() {
  return useSyncExternalStore(subscribe, readApplications, () => empty);
}
export function useRequests() {
  return useSyncExternalStore(subscribe, readRequests, () => empty);
}
export function useStaff() {
  return useSyncExternalStore(subscribe, readStaff, () => defaultStaff);
}
function readStaff() {
  const stored = read<StaffMember>(keys.staff, validStaff);
  return stored.length ? stored : defaultStaff;
}
export function addStaff(value: Omit<StaffMember, "id" | "active">) {
  const member: StaffMember = { ...value, id: `STAFF-${crypto.randomUUID().slice(0, 8).toUpperCase()}`, active: true };
  if (!validStaff(member)) throw new Error("Invalid staff member");
  write(keys.staff, [member, ...readStaff()]);
  return member;
}
export function updateStaffRole(id: string, role: StaffRole) {
  write(keys.staff, readStaff().map((member) => member.id === id ? { ...member, role } : member));
}
export function updateStaff(id: string, value: Pick<StaffMember, "name" | "email" | "role">) {
  write(keys.staff, readStaff().map((member) => member.id === id ? { ...member, ...value } : member));
}
export function deleteStaff(id: string) {
  if (id === "staff-admin") throw new Error("The default admin cannot be deleted.");
  write(keys.staff, readStaff().filter((member) => member.id !== id));
}
export function assignRequest(id: string, assigneeId: string) {
  write(keys.requests, readRequests().map((request) => request.id === id ? { ...request, assignedTo: assigneeId || undefined } : request));
}
export function addApplication(
  value: Omit<Application, "id" | "createdAt" | "status">,
) {
  const record: Application = {
    ...value,
    id: `AP-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
    createdAt: new Date().toISOString(),
    status: "New",
  };
  if (!validApplication(record)) throw new Error("Invalid application");
  write(keys.applications, [record, ...readApplications()]);
  return record;
}
export function addRequest(
  value: Omit<ServiceRequest, "id" | "createdAt" | "status">,
) {
  const record: ServiceRequest = {
    ...value,
    id: `AS-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
    createdAt: new Date().toISOString(),
    status: "New",
  };
  if (!validRequest(record)) throw new Error("Invalid request");
  write(keys.requests, [record, ...readRequests()]);
  return record;
}
export function updateApplication(id: string, status: ApplicationStatus) {
  write(
    keys.applications,
    readApplications().map((r) => (r.id === id ? { ...r, status } : r)),
  );
}
export function updateRequest(id: string, status: RequestStatus) {
  write(
    keys.requests,
    readRequests().map((r) => (r.id === id ? { ...r, status } : r)),
  );
}
export function deleteRecord(kind: "applications" | "requests", id: string) {
  write(
    keys[kind],
    (kind === "applications" ? readApplications() : readRequests()).filter(
      (r) => r.id !== id,
    ),
  );
}
export function getRequestById(id: string): ServiceRequest | undefined {
  return readRequests().find((r) => r.id.toLowerCase() === id.toLowerCase());
}
