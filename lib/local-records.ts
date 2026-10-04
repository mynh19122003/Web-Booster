"use client";
import { useSyncExternalStore } from "react";
import { games } from "@/data/games";
import { services } from "@/data/services";
import { ranksFor } from "@/lib/service-options";

export type ApplicationStatus = "New" | "Reviewing" | "Accepted" | "Declined";
export type RequestStatus = "New" | "Contacted" | "Completed" | "Cancelled";
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
  status: RequestStatus;
};
const event = "ascend-records-changed";
const keys = {
  applications: "ascend-applications-v1",
  requests: "ascend-requests-v1",
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
    services.some((s) => s.slug === value.service) &&
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
