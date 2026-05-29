import {
  type CallHandler,
  type ExecutionContext,
  Inject,
  Injectable,
  Logger,
  type NestInterceptor,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { sql } from "drizzle-orm";
import { mergeMap, type Observable } from "rxjs";

import type { AppRequest } from "../types.js";
import {
  AUDIT_KEY,
  type AuditAction,
  type AuditOptions,
} from "./audit.decorator.js";

/**
 * Writes an `audit_log` row inside the same transaction as the handler so
 * the audit and the change land atomically (rollback on handler error → no
 * audit row either). Reads `@Audit({resource, action?, omit?})` metadata;
 * non-tagged routes are a no-op.
 *
 * Actor: derived from `req.user` once auth is wired (Day 6+). Until then
 * actor is `SYSTEM` with no user id — matches the audit_log schema's
 * NULL-allowed `actor_user_id`.
 *
 * Target: best-effort extraction from the handler's return value
 * (`result.id` + `result.code|name|email`). Controllers can override via
 * a future `targetLabel` callback when the heuristic isn't enough.
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger("Audit");

  // Inject keeps the import alive at runtime — see TenantTxInterceptor.
  constructor(@Inject(Reflector) private readonly reflector: Reflector) {}

  intercept(ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    const opts = this.reflector.get<AuditOptions | undefined>(
      AUDIT_KEY,
      ctx.getHandler(),
    );
    if (!opts) return next.handle();

    const req = ctx.switchToHttp().getRequest<AppRequest>();
    const action = opts.action ?? inferAction(req.method);
    if (!action) return next.handle();

    return next.handle().pipe(
      mergeMap(async (result) => {
        try {
          await this.write(req, result, opts, action);
        } catch (err) {
          // Audit failure must not break the response. Log loud so on-call
          // can investigate; production also alerts on `audit_log` insert
          // failure via Loki metric (specs/THREAT_MODEL.md §9).
          this.logger.error(
            { requestId: (req.id as string | undefined) ?? "unknown" },
            `audit write failed: ${(err as Error).message}`,
          );
        }
        return result;
      }),
    );
  }

  private async write(
    req: AppRequest,
    result: unknown,
    opts: AuditOptions,
    action: AuditAction,
  ): Promise<void> {
    const tx = req.tx;
    if (!tx) {
      // Audited routes should always run under tenant tx. If they don't
      // (e.g. `@SkipTenantTx` + `@Audit` together), the audit row would
      // need a different pool — defer that to whenever a real case shows up.
      this.logger.warn(
        `audited handler ran without req.tx (route=${req.method} ${req.url})`,
      );
      return;
    }

    const tenantId = req.tenant?.id;
    if (!tenantId) return;

    const requestId = (req.id as string | undefined) ?? crypto.randomUUID();
    const actor = req.user;
    const targetId = inferTargetId(result);
    const targetLabel = inferTargetLabel(result);
    const payload = redact(req.body, opts.omit ?? []);
    const ip = req.ip ?? null;
    const userAgent = (req.headers["user-agent"] as string | undefined) ?? null;

    await (tx as { execute: (q: unknown) => Promise<unknown> }).execute(sql`
      INSERT INTO audit_log
        (tenant_id, actor_user_id, actor_role, action, resource,
         target_id, target_label, payload, request_id, ip, user_agent)
      VALUES
        (${tenantId}, ${actor?.id ?? null}, ${actor?.activeRole ?? "SYSTEM"},
         ${action}, ${opts.resource},
         ${targetId}, ${targetLabel},
         ${JSON.stringify(payload ?? {})}::jsonb,
         ${requestId}, ${ip}::inet, ${userAgent})
    `);
  }
}

function inferAction(method: string): AuditAction | null {
  switch (method.toUpperCase()) {
    case "POST":
      return "create";
    case "PATCH":
    case "PUT":
      return "update";
    case "DELETE":
      return "delete";
    default:
      return null;
  }
}

function inferTargetId(result: unknown): string | null {
  if (result && typeof result === "object" && "id" in result) {
    const id = (result as { id: unknown }).id;
    return typeof id === "string" ? id : null;
  }
  return null;
}

function inferTargetLabel(result: unknown): string | null {
  if (!result || typeof result !== "object") return null;
  const r = result as Record<string, unknown>;
  for (const key of ["code", "name", "email", "title"] as const) {
    const v = r[key];
    if (typeof v === "string" && v) return v;
  }
  return null;
}

function redact(
  body: unknown,
  omit: readonly string[],
): Record<string, unknown> | unknown {
  if (!body || typeof body !== "object" || omit.length === 0) return body;
  const out: Record<string, unknown> = { ...(body as Record<string, unknown>) };
  for (const key of omit) {
    if (key in out) out[key] = "[redacted]";
  }
  return out;
}
