import { cache } from "react";
import { headers } from "next/headers";

import type { TenantBranding } from "@shared/branding";
import { TENANT_HEADER, isValidTenantCode } from "@shared/tenant";

import { DEFAULT_BRANDING, TENANT_FIXTURES } from "./fixtures";

/**
 * Read the tenant code that middleware set on the request. Returns null
 * when the request did not resolve to a tenant (root site, reserved
 * subdomain, or invalid path).
 */
export async function getTenantCode(): Promise<string | null> {
  const h = await headers();
  const code = h.get(TENANT_HEADER);
  if (!code) return null;
  // Defense in depth: middleware already validates, but the header could in
  // theory leak through a misconfigured proxy. Re-check shape.
  if (!isValidTenantCode(code)) return null;
  return code;
}

/**
 * Per-request memoized branding fetcher. `cache()` dedupes calls within the
 * same RSC render so layout + page + metadata generators don't re-fetch.
 *
 * Pha 1: in-memory fixture lookup (no IO). Pha 2: replace the lookup with
 * a Drizzle query, keep the same signature. Unknown codes fall back to
 * `DEFAULT_BRANDING` rather than throwing — we never want a misconfigured
 * tenant to break the shell.
 */
export const getTenantBranding = cache(
  async (code: string | null): Promise<TenantBranding> => {
    if (!code) return DEFAULT_BRANDING;
    return TENANT_FIXTURES[code] ?? DEFAULT_BRANDING;
  },
);
