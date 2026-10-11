/** Employee access is always determined by the database, never by the login form. */
export function loginDestination(role: string, next?: unknown): string {
  if (role === "employee") return "/employee";
  if (typeof next !== "string" || !next.startsWith("/") || next.startsWith("//") || /[\\\x00-\x20]/.test(next)) return "/";
  try {
    const url = new URL(next, "https://ascend.invalid");
    const path = decodeURIComponent(url.pathname);
    if (url.origin !== "https://ascend.invalid" || /[\\\x00-\x20]/.test(path) || /^\/(employee|admin|api|login|register)(\/|$)/.test(path)) return "/";
    return `${url.pathname}${url.search}${url.hash}`;
  } catch { return "/"; }
}
