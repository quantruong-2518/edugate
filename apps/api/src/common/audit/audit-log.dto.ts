import { z } from "zod";

const AUDIT_ACTIONS = [
  "create",
  "update",
  "delete",
  "approve",
  "reject",
  "login",
  "export",
  "state_change",
  "settings_update",
] as const;

/**
 * Query for GET /v1/admin/audit-log. Mirrors the FE's `AuditLogFilters`
 * (@shared/audit) plus a cursor + page-size for pagination.
 *
 * Cursor uses the row's `at` timestamp because audit_log is already indexed
 * `(tenant_id, at DESC)` — keyset pagination is correct against that index
 * and avoids the off-by-one drift OFFSET pagination has under concurrent
 * inserts. The viewer is read-only so eventual consistency at the boundary
 * is fine.
 */
export const auditLogQuerySchema = z.object({
  action: z.enum(AUDIT_ACTIONS).optional(),
  q: z.string().trim().min(1).max(200).optional(),
  /** ISO 8601 — return entries strictly older than this. */
  before: z.string().datetime({ offset: true }).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

export type AuditLogQuery = z.infer<typeof auditLogQuerySchema>;
