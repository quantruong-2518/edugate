import type { AbilityContext } from "@shared/auth";

/**
 * Pha 1 mock identity. Pha 2 derives this from the authenticated session +
 * `tenant_users` row for the active tenant (roles) and `tenant_modules`
 * (enabledModules). Shape is intentionally identical so the swap is local.
 */
export const MOCK_ABILITY_CONTEXT: AbilityContext = {
  userId: "u-admin",
  tenantId: "cva-edu",
  roles: ["ADMISSION_ADMIN"],
  enabledModules: ["admission", "platform"],
};
