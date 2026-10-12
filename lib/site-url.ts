/** Shared with client-rendered breadcrumbs; never infer canonicals from request headers. */
export function resolveSiteUrl(value: string | undefined): string {
  if (!value?.trim()) return "http://localhost:3000";
  const url = new URL(value.trim());
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password ||
      url.pathname !== '/' || url.search || url.hash) {
    throw new Error("NEXT_PUBLIC_SITE_URL must be an http(s) origin without a path, credentials, query or fragment.");
  }
  return url.origin;
}

export const siteUrl = resolveSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);

export function absoluteUrl(path: string): string {
  return `${siteUrl}${path === '/' ? '' : `/${path.replace(/^\/+/, '')}`}`;
}
