export const apiBaseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000/api/v1").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(message: string, public status: number, public details: unknown) {
    super(message);
    this.name = "ApiError";
  }
}

/** Transport only. Services opt in once the corresponding endpoint is verified. */
export async function apiRequest<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  if (!path.startsWith("/") || path.startsWith("//")) throw new Error("Use a relative API path.");
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  if (options.body && !(options.body instanceof FormData) && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const response = await fetch(`${apiBaseUrl}${path}`, { ...options, headers, cache: "no-store" });
  const raw = await response.text();
  let payload: unknown;
  try { payload = raw ? JSON.parse(raw) : undefined; } catch {
    throw new ApiError("API returned an invalid JSON response.", response.status, undefined);
  }
  if (!response.ok) {
    const message = payload && typeof payload === "object" && "message" in payload && typeof payload.message === "string" ? payload.message : "API request failed.";
    throw new ApiError(message, response.status, payload);
  }
  return payload as T;
}
