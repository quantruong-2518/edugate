import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { sql } from "drizzle-orm";

import type { LandingConfig } from "shared/landing";
import type { TenantTheme } from "shared/theme";

import type { AppRequest } from "../../common/types.js";
import { TenantResolverService } from "../../common/tenant/tenant.resolver.js";
import type {
  UpdateBrandingInput,
  UpdateLandingInput,
} from "./tenant-config.dto.js";

/**
 * Reads and writes the editable tenant face: branding (logo + theme on the
 * `tenants` row, read by the resolver before tenant context exists) and
 * landing (content blob on `tenant_configs`, read by the public RSC layout).
 *
 * Branding writes need the new RLS policy from migration 0021 — without it
 * app_role can SELECT but not UPDATE tenants. After a branding write we
 * invalidate the resolver's in-memory cache so the next request reads fresh
 * theme; the 60s TTL is the safety net.
 */

type Tx = { execute: (q: unknown) => Promise<{ rows: unknown[] }> };

export type TenantConfigResponse = {
  branding: { logoUrl: string | null; theme: TenantTheme };
  landing: LandingConfig;
};

@Injectable()
export class TenantConfigService {
  constructor(
    @Inject(TenantResolverService) private readonly resolver: TenantResolverService,
  ) {}

  async get(req: AppRequest): Promise<TenantConfigResponse> {
    const tx = this.requireTx(req);

    const res = (await tx.execute(sql`
      SELECT t.logo_url, t.theme,
             COALESCE(tc.landing, '{"sections":[]}'::jsonb) AS landing
        FROM tenants t
        LEFT JOIN tenant_configs tc ON tc.tenant_id = t.id
       WHERE t.id = app_current_tenant()
       LIMIT 1
    `)) as {
      rows: Array<{
        logo_url: string | null;
        theme: TenantTheme | Record<string, never>;
        landing: LandingConfig;
      }>;
    };
    const row = res.rows[0];
    if (!row) {
      // RLS hid the row → caller's tenant header is wrong, treat as not found.
      throw new NotFoundException({
        code: "TENANT_NOT_FOUND",
        message: "Không tìm thấy cấu hình của trường.",
      });
    }

    return {
      branding: {
        logoUrl: row.logo_url,
        theme: row.theme as TenantTheme,
      },
      landing: row.landing,
    };
  }

  async updateBranding(
    req: AppRequest,
    body: UpdateBrandingInput,
  ): Promise<TenantConfigResponse["branding"]> {
    const tx = this.requireTx(req);

    const res = (await tx.execute(sql`
      UPDATE tenants
         SET logo_url = ${body.logoUrl},
             theme    = ${JSON.stringify(body.theme)}::jsonb,
             updated_at = now()
       WHERE id = app_current_tenant()
       RETURNING logo_url, theme
    `)) as { rows: Array<{ logo_url: string | null; theme: TenantTheme }> };
    const row = res.rows[0];
    if (!row) {
      throw new NotFoundException({
        code: "TENANT_NOT_FOUND",
        message: "Không tìm thấy cấu hình của trường.",
      });
    }

    // Resolver caches tenant metadata in-memory (60s TTL). Without this drop
    // the next request would still see the old theme. We invalidate inside
    // the tx — if it rolls back the cache miss self-heals with one extra
    // platform_role lookup, which is fine.
    if (req.tenant?.code) this.resolver.invalidate(req.tenant.code);

    return { logoUrl: row.logo_url, theme: row.theme };
  }

  async updateLanding(
    req: AppRequest,
    body: UpdateLandingInput,
  ): Promise<{ landing: LandingConfig }> {
    const tx = this.requireTx(req);

    const res = (await tx.execute(sql`
      INSERT INTO tenant_configs (tenant_id, landing, updated_at)
      VALUES (app_current_tenant(), ${JSON.stringify(body.landing)}::jsonb, now())
      ON CONFLICT (tenant_id) DO UPDATE
        SET landing = EXCLUDED.landing,
            updated_at = now()
      RETURNING landing
    `)) as { rows: Array<{ landing: LandingConfig }> };
    const row = res.rows[0];
    if (!row) {
      throw new Error("tenant_configs upsert returned no row");
    }
    return { landing: row.landing };
  }

  private requireTx(req: AppRequest): Tx {
    const tx = req.tx as Tx | undefined;
    if (!tx) {
      throw new Error("Missing tenant tx (TenantTxInterceptor)");
    }
    return tx;
  }
}
