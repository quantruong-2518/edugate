import { Module } from "@nestjs/common";

import { TenantResolverService } from "./tenant.resolver.js";
import { TenantTxInterceptor } from "./tenant-tx.interceptor.js";

/**
 * Tenant resolution lives inside TenantTxInterceptor (interceptor DI works
 * reliably across Nest + Fastify + middie). We attempted a NestMiddleware
 * but middie strips `this` binding from class middlewares — DI broke. The
 * interceptor path is also a single round-trip per request so there's no
 * performance reason to split.
 */
@Module({
  providers: [TenantResolverService, TenantTxInterceptor],
  exports: [TenantResolverService, TenantTxInterceptor],
})
export class TenantModule {}
