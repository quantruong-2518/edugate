/**
 * Tenant resolution primitives.
 *
 * Pure functions consumed by the Next.js middleware in apps/web. Kept here
 * (no Next imports) so the same rules can be reused by the future NestJS
 * backend, tests, and any tooling that needs to normalize a tenant code.
 *
 * Resolution order (see ADR-005):
 *   1. Subdomain — canonical for prod (cva-edu.app.com)
 *   2. Path prefix `/t/:code` — fallback for dev/staging without wildcard SSL
 */

export const TENANT_HEADER = "x-tenant-code";

/** Subdomains that map to the root site or infra, not a tenant. */
export const RESERVED_SUBDOMAINS: ReadonlySet<string> = new Set([
  "www",
  "app",
  "api",
  "admin",
  "static",
  "assets",
  "cdn",
]);

// Tenant code: lowercase DNS label. 1-63 chars, alnum + hyphen, no leading/
// trailing hyphen. Mirrors the subdomain shape we accept on the host.
const TENANT_CODE_RE = /^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/;

export function isValidTenantCode(code: string): boolean {
  return TENANT_CODE_RE.test(code);
}

/**
 * Resolve a tenant code from a `Host` header value.
 *
 * Returns the leftmost label when the hostname is a child of one of the
 * configured root domains. Reserved subdomains and the root domain itself
 * return `null`.
 *
 * Examples (rootHosts = ["app.com", "localhost"]):
 *   cva-edu.app.com    → "cva-edu"
 *   www.app.com        → null
 *   app.com            → null
 *   cva-edu.localhost  → "cva-edu"
 *   foo.bar.app.com    → "foo"   (only the leftmost label is treated as tenant)
 */
export function parseTenantFromHost(
  host: string | null | undefined,
  rootHosts: readonly string[],
): string | null {
  if (!host) return null;
  const hostname = (host.split(":")[0] ?? "").toLowerCase();
  if (!hostname) return null;

  for (const raw of rootHosts) {
    const root = (raw.split(":")[0] ?? "").toLowerCase();
    if (!root) continue;
    if (hostname === root) return null;
    if (!hostname.endsWith(`.${root}`)) continue;

    const prefix = hostname.slice(0, hostname.length - root.length - 1);
    const label = (prefix.split(".")[0] ?? "").toLowerCase();
    if (!label || RESERVED_SUBDOMAINS.has(label)) return null;
    if (!TENANT_CODE_RE.test(label)) return null;
    return label;
  }

  return null;
}

/**
 * Match `/t/:code(/rest)?`. Returns the tenant code plus the path with the
 * `/t/:code` prefix stripped (always leading slash). Code must match the
 * tenant code shape; bare `/t/` or invalid codes return `null`.
 */
export function parseTenantFromPath(
  pathname: string,
): { code: string; rest: string } | null {
  const m = /^\/t\/([^/]+)(\/.*)?$/.exec(pathname);
  if (!m) return null;
  const code = m[1];
  if (!code) return null;
  // Path codes are strict-lowercase. URLs are case-sensitive; silently
  // normalizing /t/UPPER → /t/upper would create two URLs for one tenant.
  if (!TENANT_CODE_RE.test(code)) return null;
  return { code, rest: m[2] ?? "/" };
}

/**
 * Parse the comma-separated `TENANT_ROOT_HOSTS` env var into a clean list.
 * Falls back to dev defaults when unset.
 */
export function resolveRootHosts(raw: string | undefined): string[] {
  if (!raw) return ["localhost", "127.0.0.1"];
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s.length > 0);
}
