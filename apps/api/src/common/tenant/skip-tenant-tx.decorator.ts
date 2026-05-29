import { SetMetadata } from "@nestjs/common";

/**
 * Marks a controller, method, or both as exempt from TenantTxInterceptor.
 * The handler runs without a tenant context — useful for:
 *   • /v1/auth/*           — login, password reset (uses platform pool)
 *   • /v1/platform/*       — SUPER_ADMIN cross-tenant routes
 *   • /v1/health, /v1/health/ready — no DB tenant binding required
 *
 * Routes still need to pick the right pool themselves (typically platform).
 */
export const SKIP_TENANT_TX_KEY = "skipTenantTx";

export const SkipTenantTx = (): ClassDecorator & MethodDecorator =>
  SetMetadata(SKIP_TENANT_TX_KEY, true);
