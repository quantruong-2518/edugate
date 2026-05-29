import { Controller, Get, Req } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { sql } from "drizzle-orm";

import type { AppRequest } from "../common/types.js";

/**
 * Debug endpoints — registered only in non-production builds (see
 * app.module.ts). Used to validate the request pipeline end-to-end:
 *
 *   GET /v1/_debug/tenant
 *     1. Tenant middleware resolved x-tenant-code → req.tenant
 *     2. TenantTxInterceptor wrapped the handler in a tx with app_role
 *        + app.tenant_id set
 *     3. Handler reads app.tenant_id from the DB and returns it; if RLS
 *        machinery is right, this equals the tenant resolved at step 1.
 */
@ApiTags("_debug")
@Controller("_debug")
export class DebugController {
  @Get("tenant")
  @ApiOperation({
    summary: "Round-trip the tenant pin through the DB session for verification",
  })
  async tenant(
    @Req() req: AppRequest,
  ): Promise<{
    tenant: { id: string; code: string } | null;
    appTenantIdFromDb: string | null;
  }> {
    const tx = req.tx;
    if (!tx) {
      return {
        tenant: req.tenant
          ? { id: req.tenant.id, code: req.tenant.code }
          : null,
        appTenantIdFromDb: null,
      };
    }

    const res = (await (tx as { execute: (q: unknown) => Promise<unknown> }).execute(
      sql`SELECT current_setting('app.tenant_id', true) AS tid`,
    )) as { rows: Array<{ tid: string | null }> };

    return {
      tenant: req.tenant ? { id: req.tenant.id, code: req.tenant.code } : null,
      appTenantIdFromDb: res.rows[0]?.tid ?? null,
    };
  }
}
