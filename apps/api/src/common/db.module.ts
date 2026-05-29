import { Global, Module, type OnModuleDestroy } from "@nestjs/common";

import { poolsFromEnv, type DbPools } from "db";

/**
 * Holds the three Postgres pools for the request lifetime. The
 * TenantTxInterceptor runs each handler inside `db.transaction(...)` and
 * sets `app.tenant_id` via SET LOCAL. `@Global()` so interceptors and
 * sibling modules can `@Inject(DB_POOLS)` without redeclaring the import.
 */
export const DB_POOLS = Symbol("DB_POOLS");

@Global()
@Module({
  providers: [
    {
      provide: DB_POOLS,
      useFactory: (): DbPools => poolsFromEnv(process.env),
    },
  ],
  exports: [DB_POOLS],
})
export class DbModule implements OnModuleDestroy {
  constructor() {
    // No-op; OnModuleDestroy closes pools.
  }

  async onModuleDestroy(): Promise<void> {
    // The pools are managed via the DI factory; closing happens through the
    // process exit hook in main.ts in dev. For production graceful shutdown
    // we hook it here in Day 3 once the pool handle is injected.
  }
}
