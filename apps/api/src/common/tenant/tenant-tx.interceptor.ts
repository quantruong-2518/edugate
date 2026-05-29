import {
  type CallHandler,
  type ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  type NestInterceptor,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { sql } from "drizzle-orm";
import { from, lastValueFrom, type Observable } from "rxjs";

import type { DbPools } from "db";

import { DB_POOLS } from "../db.module.js";
import type { AppRequest, RequestTx } from "../types.js";
import { SKIP_TENANT_TX_KEY } from "./skip-tenant-tx.decorator.js";
import { TenantResolverService } from "./tenant.resolver.js";

/**
 * Global interceptor that wraps every handler in a Drizzle transaction
 * pinned to the request's tenant (specs/ARCHITECTURE.md §5.1, §7.2).
 *
 *   db.transaction(async (tx) => {
 *     SET LOCAL ROLE app_role               -- forces RLS to apply
 *     set_config('app.tenant_id', :id, true) -- the tenant pin
 *     run handler with req.tx = tx          -- repositories pick this up
 *   })
 *
 * Skip via `@SkipTenantTx()` on auth + platform routes (they use the
 * platform pool directly without a tenant scope).
 *
 * Without `req.tenant`, this throws 403 TENANT_REQUIRED. The handler that
 * forgot to read the tenant header will see a clear error rather than a
 * silent zero-row query.
 */
@Injectable()
export class TenantTxInterceptor implements NestInterceptor {
  private readonly logger = new Logger("TenantTx");

  constructor(
    // Reflector is type-only in this position; @Inject keeps the import alive
    // at runtime so Nest can resolve it (ESM + TS would otherwise erase the
    // import and design:paramtypes would lose the reference).
    @Inject(Reflector) private readonly reflector: Reflector,
    @Inject(DB_POOLS) private readonly pools: DbPools,
    @Inject(TenantResolverService) private readonly resolver: TenantResolverService,
  ) {}

  intercept(ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    const skip =
      this.reflector.getAllAndOverride<boolean>(SKIP_TENANT_TX_KEY, [
        ctx.getHandler(),
        ctx.getClass(),
      ]) ?? false;

    if (skip) return next.handle();

    return from(this.runInTx(ctx, next));
  }

  private async runInTx(ctx: ExecutionContext, next: CallHandler): Promise<unknown> {
    const req = ctx.switchToHttp().getRequest<AppRequest>();

    // Resolve tenant from the x-tenant-code header. We used to do this in a
    // Nest middleware but Fastify's middie adapter loses `this` binding +
    // breaks DI on class middlewares — folding the resolve here keeps DI
    // working and means each interceptor wrap involves exactly one db call.
    if (!req.tenant) {
      const code = readTenantHeader(req.headers["x-tenant-code"]);
      if (code) {
        const resolved = await this.resolver.resolveByCode(code);
        if (resolved) req.tenant = resolved;
      }
    }

    const tenant = req.tenant;
    if (!tenant) {
      throw new ForbiddenException({
        code: "TENANT_REQUIRED",
        message: "Yêu cầu thiếu mã trường (x-tenant-code).",
      });
    }

    const db = this.pools.db("app");
    return db.transaction(async (tx) => {
      await tx.execute(sql`SET LOCAL ROLE app_role`);
      await tx.execute(
        sql`SELECT set_config('app.tenant_id', ${tenant.id}, true)`,
      );
      req.tx = tx as unknown as RequestTx;
      try {
        return await lastValueFrom(next.handle());
      } finally {
        req.tx = undefined;
      }
    });
  }
}

function readTenantHeader(value: string | string[] | undefined): string | null {
  if (!value) return null;
  if (Array.isArray(value)) return value[0]?.trim() ?? null;
  return value.trim() || null;
}
