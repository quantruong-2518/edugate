import { Controller, Get, Inject, ServiceUnavailableException } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";

import type { DbPools } from "db";

import { DB_POOLS } from "../common/db.module.js";
import { SkipTenantTx } from "../common/tenant/skip-tenant-tx.decorator.js";

/**
 * Health endpoints per API_SPEC §2. `/health` is a cheap liveness probe;
 * `/health/ready` actually pings the DB so Coolify can flip the service out
 * of rotation when Postgres goes away. Both skip TenantTxInterceptor —
 * probes don't carry tenant context.
 */
@SkipTenantTx()
@ApiTags("health")
@Controller("health")
export class HealthController {
  constructor(@Inject(DB_POOLS) private readonly pools: DbPools) {}

  @Get()
  @ApiOperation({ summary: "Liveness probe" })
  live(): { status: "ok" } {
    return { status: "ok" };
  }

  @Get("ready")
  @ApiOperation({ summary: "Readiness probe — pings the database" })
  async ready(): Promise<{ status: "ok"; db: "up" }> {
    try {
      const client = await this.pools.platform.connect();
      try {
        await client.query("SELECT 1");
      } finally {
        client.release();
      }
    } catch (err) {
      throw new ServiceUnavailableException({
        code: "DB_UNAVAILABLE",
        message: "Database không phản hồi.",
        cause: (err as Error).message,
      });
    }
    return { status: "ok", db: "up" };
  }
}
