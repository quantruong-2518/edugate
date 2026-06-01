import { headers } from "next/headers";

import {
  TENANT_HEADER,
  TENANT_SOURCE_HEADER,
  isValidTenantCode,
  type TenantSource,
} from "@shared/tenant";

/**
 * Resolve the prefix that internal `<Link>` hrefs need so a tenant-aware URL
 * survives a parent copy-pasting it into another browser. Returns:
 *
 *   • `""` — host carries the tenant (subdomain or mapped custom domain). The
 *     URL `tuyensinh.school.vn/register` is self-contained; no prefix needed.
 *   • `/t/:code` — tenant came from a path segment or the cookie fallback on a
 *     shared host. A bare `/register` would lose the tenant when shared (the
 *     receiver has no cookie); prepending `/t/:code/` makes the link portable.
 *
 * RSC-only — reads the request header set by the middleware. Pages that don't
 * resolve a tenant get back `""` so callers can ignore the distinction.
 */
export async function getTenantHrefPrefix(): Promise<string> {
  const h = await headers();
  const code = h.get(TENANT_HEADER);
  const source = h.get(TENANT_SOURCE_HEADER) as TenantSource | null;
  if (!code || !isValidTenantCode(code)) return "";
  if (source === "host" || source === "custom-domain") return "";
  return `/t/${code}`;
}

/**
 * Pure helper that prepends the prefix to an internal absolute href. Untouched
 * for external schemes (mailto:, http(s)://, tel:), hash links, and hrefs that
 * already carry the prefix. Safe to apply blindly to a config-driven CTA list.
 */
export function tenantHref(href: string, prefix: string): string {
  if (!prefix) return href;
  if (!href.startsWith("/")) return href;
  if (href.startsWith("/t/")) return href;
  // `/` is the tenant home; avoid a trailing slash on the prefix.
  if (href === "/") return prefix;
  return `${prefix}${href}`;
}
