// ─── Public URL Resolution ──────────────────────────

const SERVER_BASE_URL = process.env.RAILWAY_PUBLIC_DOMAIN
  ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
  : `http://localhost:${process.env.PORT || 3001}`;

/** Convert relative paths (e.g. /uploads/...) to absolute public URLs */
export function resolveToPublicUrl(url: string): string {
  if (url.startsWith('/')) {
    return `${SERVER_BASE_URL}${url}`;
  }
  return url;
}
