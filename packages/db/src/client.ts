import { Pool, type PoolConfig } from "pg";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";

import * as schema from "./schema/index.js";

/**
 * Three Postgres roles, three pools — see specs/DATA_MODEL.md §4.1.
 *
 *   app_role         — request handling. Subject to RLS. SET LOCAL app.tenant_id per tx.
 *   platform_role    — tenant resolver only. SELECT on tenants/tenant_users, bypasses RLS for those.
 *   maintenance_role — migrations + retention worker. BYPASSRLS. Never used by request handlers.
 *
 * Pha 1 deployment may collapse all three into a single superuser pool for
 * dev convenience; production must split them. The factory makes that
 * decision explicit at boot rather than scattered through the codebase.
 */

export type DbRole = "app" | "platform" | "maintenance";

export type DbConfig = {
  app: PoolConfig;
  platform: PoolConfig;
  maintenance: PoolConfig;
};

export type Db = NodePgDatabase<typeof schema>;

export type DbPools = {
  app: Pool;
  platform: Pool;
  maintenance: Pool;
  db: (role: DbRole) => Db;
  end: () => Promise<void>;
};

export function createPools(cfg: DbConfig): DbPools {
  const app = new Pool(cfg.app);
  const platform = new Pool(cfg.platform);
  const maintenance = new Pool(cfg.maintenance);

  const dbs: Record<DbRole, Db> = {
    app: drizzle(app, { schema }),
    platform: drizzle(platform, { schema }),
    maintenance: drizzle(maintenance, { schema }),
  };

  return {
    app,
    platform,
    maintenance,
    db: (role) => dbs[role],
    end: async () => {
      await Promise.all([app.end(), platform.end(), maintenance.end()]);
    },
  };
}

/**
 * Convenience factory for environments that use one connection string per
 * role (Coolify production). Each URL points at the same DB instance but
 * authenticates as a different Postgres role.
 */
export function poolsFromEnv(env: NodeJS.ProcessEnv): DbPools {
  const appUrl = env["DATABASE_URL_APP"] ?? env["DATABASE_URL"];
  const platformUrl = env["DATABASE_URL_PLATFORM"] ?? env["DATABASE_URL"];
  const maintenanceUrl =
    env["DATABASE_URL_MAINTENANCE"] ?? env["DATABASE_URL"];

  if (!appUrl) {
    throw new Error(
      "Missing DATABASE_URL (or DATABASE_URL_APP). Cannot create app pool.",
    );
  }

  return createPools({
    app: { connectionString: appUrl, max: 20 },
    platform: { connectionString: platformUrl, max: 5 },
    maintenance: { connectionString: maintenanceUrl, max: 2 },
  });
}
