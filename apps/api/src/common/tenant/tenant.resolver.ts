import { Inject, Injectable, Logger } from "@nestjs/common";
import { sql } from "drizzle-orm";

import type { DbPools } from "db";

import { DB_POOLS } from "../db.module.js";
import type { RequestTenant } from "../types.js";

/**
 * Looks up tenant metadata for the request middleware. Hot path — every
 * tenant-scoped request goes through here — so results are memoized in an
 * in-memory LRU keyed by tenant code. Pha 2.x can swap this for Redis
 * without touching callers; the resolver shape is stable.
 *
 * Invalidation: tenant config writes call `invalidate(code)` from the
 * settings controller. The TTL is the safety net for missed invalidations.
 */
@Injectable()
export class TenantResolverService {
  private readonly logger = new Logger("TenantResolver");
  private readonly cache = new Map<string, { value: RequestTenant; expiresAt: number }>();
  private readonly ttlMs = 60_000;
  private readonly maxEntries = 200;

  constructor(@Inject(DB_POOLS) private readonly pools: DbPools) {}

  async resolveByCode(code: string): Promise<RequestTenant | null> {
    const normalized = code.trim().toLowerCase();
    if (!normalized) return null;

    const cached = this.cache.get(normalized);
    if (cached && cached.expiresAt > Date.now()) return cached.value;

    const db = this.pools.db("platform");
    const rows = (await db.execute(sql`
      SELECT id, code, modules
        FROM tenants
       WHERE code = ${normalized}
         AND deleted_at IS NULL
         AND status = 'active'
       LIMIT 1
    `)) as unknown as { rows: Array<{ id: string; code: string; modules: string[] }> };

    const row = rows.rows[0];
    if (!row) {
      this.logger.debug(`miss: ${normalized}`);
      return null;
    }

    const value: RequestTenant = {
      id: row.id,
      code: row.code,
      modules: row.modules,
    };
    this.setCached(normalized, value);
    return value;
  }

  invalidate(code: string): void {
    this.cache.delete(code.trim().toLowerCase());
  }

  private setCached(code: string, value: RequestTenant): void {
    if (this.cache.size >= this.maxEntries) {
      const oldest = this.cache.keys().next().value;
      if (oldest !== undefined) this.cache.delete(oldest);
    }
    this.cache.set(code, { value, expiresAt: Date.now() + this.ttlMs });
  }
}
