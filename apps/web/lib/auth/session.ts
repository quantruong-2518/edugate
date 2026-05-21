import type { AbilityContext } from "@shared/auth";

/**
 * Pha 1 mock identity. Pha 2 derives this from the authenticated session +
 * `tenant_users` row for the active tenant (roles) and `tenant_modules`
 * (enabledModules). Shape is intentionally identical so the swap is local.
 *
 * Persona is TENANT_ADMIN: the admin console owner who can edit tenant
 * branding/landing (`update:tenant_config`). The role-switching ability demo on
 * the dashboard builds its own context, so it is unaffected by this choice.
 */
export const MOCK_ABILITY_CONTEXT: AbilityContext = {
  userId: "u-admin",
  tenantId: "cva-edu",
  roles: ["TENANT_ADMIN"],
  enabledModules: ["admission", "platform"],
};
