/**
 * Tenant resolution primitives.
 *
 * Pure functions consumed by the Next.js middleware in apps/web. Kept here
 * (no Next imports) so the same rules can be reused by the future NestJS
 * backend, tests, and any tooling that needs to normalize a tenant code.
 *
 * Resolution order (see ADR-005 + ADR-012):
 *   1. Subdomain — canonical for prod (cva-edu.app.com)
 *   2. Custom domain — a host the school owns (a-tuyen-sinh.vn), mapped to a
 *      tenant code via an explicit domain map (data, not parseable)
 *   3. Path prefix `/t/:code` — fallback for dev/staging without wildcard SSL
 */

export const TENANT_HEADER = "x-tenant-code";

/**
 * Which signal the middleware used to resolve the tenant. The applicant
 * surfaces read this in RSC so internal links can re-prepend `/t/:code/` when
 * the host alone doesn't carry the tenant (path or cookie fallback). Otherwise
 * a parent who copies `/register` and shares it would land on a tenant-less
 * URL after their cookie is missing.
 */
export const TENANT_SOURCE_HEADER = "x-tenant-source";

export type TenantSource = "host" | "custom-domain" | "path" | "cookie";

/**
 * Cookie that persists the active tenant across tenant-less URLs on a shared
 * host (e.g. reloading `/register` on dev localhost). The URL always wins over
 * it; it is only a fallback. Host-scoped (no Domain attr) so prod subdomains
 * stay isolated. See ADR-014.
 */
export const TENANT_COOKIE = "EDUGATE_TENANT";

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
 * Resolve a tenant code from a custom domain the school owns (CNAME/A →
 * platform, e.g. "a-tuyen-sinh.vn"), via an explicit `domain → code` map.
 *
 * Unlike a subdomain, a custom domain carries no parseable tenant label —
 * the mapping is data, not derivable from the string. Pha 1 the map is a
 * static fixture; pha 2 it becomes a cached `tenant_domains` lookup where
 * only `verified` rows are present (see ADR-012). The host is lowercased and
 * port-stripped before matching; map keys must be exact hostnames (include
 * the `www.` variant explicitly if the school uses it).
 *
 * Examples (domainMap = { "a-tuyen-sinh.vn": "cva-edu" }):
 *   a-tuyen-sinh.vn       → "cva-edu"
 *   a-tuyen-sinh.vn:443   → "cva-edu"
 *   www.a-tuyen-sinh.vn   → null   (not in the map unless added)
 *   other.vn              → null
 */
export function parseTenantFromCustomDomain(
  host: string | null | undefined,
  domainMap: Readonly<Record<string, string>>,
): string | null {
  if (!host) return null;
  const hostname = (host.split(":")[0] ?? "").toLowerCase();
  if (!hostname) return null;

  const code = domainMap[hostname];
  if (!code) return null;
  // Defense in depth: a misconfigured map row must not inject a bad code.
  if (!TENANT_CODE_RE.test(code)) return null;
  return code;
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
