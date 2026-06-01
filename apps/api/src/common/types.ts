import type { FastifyRequest } from "fastify";

/**
 * Per-request data attached by middleware + interceptors. Exposed via a
 * module augmentation below so any handler can access `req.tenant` /
 * `req.tx` / `req.user` with full type safety.
 */
export type RequestTenant = {
  id: string;
  code: string;
  /** Display name shown in user-facing copy (emails, page titles). */
  name: string;
  /** Modules enabled for the tenant (see specs/PRD.md §6.4). */
  modules: readonly string[];
};

export type RequestUser = {
  id: string;
  activeRole: string;
  displayName?: string;
};

/**
 * Drizzle transaction handle. We use a structural shape rather than importing
 * the concrete `NodePgTransaction` type to keep this file free of pg-specific
 * generics — controllers only ever need `execute`, `query`, `select`, etc.
 */
export type RequestTx = {
  execute: (...args: unknown[]) => Promise<unknown>;
  [key: string]: unknown;
};

declare module "fastify" {
  interface FastifyRequest {
    tenant?: RequestTenant;
    user?: RequestUser;
    /** Drizzle transaction bound by TenantTxInterceptor. */
    tx?: RequestTx;
  }
}

export type AppRequest = FastifyRequest;
