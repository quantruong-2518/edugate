import { z } from "zod";

import { landingConfigSchema } from "shared/landing";
import { tenantThemeSchema } from "shared/theme";

/**
 * Bodies for PATCH /v1/admin/tenant-config/{branding,landing}.
 *
 * Branding writes the immutable side of a tenant's identity (logo + theme)
 * which lives on `tenants` (DATA_MODEL §3.1 — read by the resolver before
 * tenant context exists). Landing writes the per-page content the school
 * edits often, which lives on `tenant_configs.landing`.
 */

export const updateBrandingSchema = z.object({
  /** Absolute or root-relative URL; pass null to clear and fall back to text. */
  logoUrl: z.string().trim().max(1000).nullable(),
  theme: tenantThemeSchema,
});

export type UpdateBrandingInput = z.infer<typeof updateBrandingSchema>;

export const updateLandingSchema = z.object({
  landing: landingConfigSchema,
});

export type UpdateLandingInput = z.infer<typeof updateLandingSchema>;
