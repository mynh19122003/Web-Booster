/** Indexing is an explicit launch step, including for self-hosted deployments. */
export function canIndexSite(origin: string, enabled?: string, deployment?: string): boolean {
  const url = new URL(origin);
  const host = url.hostname;
  return enabled === "true" && deployment !== "preview" && deployment !== "development" &&
    url.protocol === "https:" && host.includes(".") &&
    !/^(localhost|127\.|0\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host) &&
    !/\.(localhost|local|test|example|invalid)$/.test(host);
}
