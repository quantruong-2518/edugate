import type { LandingConfig } from "@shared/landing";
import type { TenantTheme } from "@shared/theme";

import { http } from "./http";

/**
 * Per-tenant appearance the admin UI edits at /admin/settings. Mirrors the
 * NestJS `TenantConfigResponse` (apps/api admin/tenant-config). Branding lives
 * on the `tenants` row, landing on `tenant_configs.landing`.
 */
export type TenantConfigPayload = {
  branding: { logoUrl: string | null; theme: TenantTheme };
  landing: LandingConfig;
};

export async function getTenantConfig(
  tenantCode: string,
): Promise<TenantConfigPayload> {
  const { data } = await http.get<TenantConfigPayload>(
    "/v1/admin/tenant-config",
    { headers: { "x-tenant-code": tenantCode } },
  );
  return data;
}

export async function updateTenantBranding(
  tenantCode: string,
  body: { logoUrl: string | null; theme: TenantTheme },
): Promise<TenantConfigPayload["branding"]> {
  const { data } = await http.patch<TenantConfigPayload["branding"]>(
    "/v1/admin/tenant-config/branding",
    body,
    { headers: { "x-tenant-code": tenantCode } },
  );
  return data;
}

export async function updateTenantLanding(
  tenantCode: string,
  landing: LandingConfig,
): Promise<{ landing: LandingConfig }> {
  const { data } = await http.patch<{ landing: LandingConfig }>(
    "/v1/admin/tenant-config/landing",
    { landing },
    { headers: { "x-tenant-code": tenantCode } },
  );
  return data;
}
