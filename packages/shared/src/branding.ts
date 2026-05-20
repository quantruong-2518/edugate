/**
 * Tenant branding contract.
 *
 * Returned by `getTenantBranding(code)` (pha 1: in-memory fixtures in
 * apps/web; pha 2: DB row from `tenants` table). Type lives here so the
 * NestJS API can return the same shape and FE can consume without
 * translation.
 */

import type { TenantTheme } from "./theme";

export type TenantBranding = {
  /** Canonical tenant code (lowercase DNS label). */
  code: string;
  /** Full display name, e.g. used in <title> and AppShell header. */
  name: string;
  /** Compact label for tight UI (badges, breadcrumbs). */
  shortName: string;
  /** Absolute or root-relative URL; null = fall back to text logo. */
  logoUrl: string | null;
  /** Color tokens + radius + font stacks. Serialized via `tenantThemeToCss`. */
  theme: TenantTheme;
};
