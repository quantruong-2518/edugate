/**
 * Audit log model.
 *
 * Records who did what, when, on which resource — distinct from
 * `ApplicationHistoryEntry` (which tracks one application's state changes).
 * Shared between the pha 1 mock viewer and the pha 2 BE, which writes an entry
 * per mutation via a NestJS interceptor and isolates rows by `tenantId` (RLS).
 */

import type { Role } from "../auth/permissions";

export const AUDIT_ACTIONS = [
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

export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export type AuditActor = {
  id: string;
  name: string;
  role: Role;
};

export type AuditLogEntry = {
  id: string;
  tenantId: string;
  /** ISO 8601 timestamp. */
  at: string;
  actor: AuditActor;
  action: AuditAction;
  /** Resource/category the event concerns, e.g. "application", "tenant_config", "auth". */
  resource: string;
  /** Human label for the affected target (application code, page name, …). */
  targetLabel?: string;
};

export type AuditLogFilters = {
  action?: AuditAction;
  /** Free-text over actor name + target label (case-insensitive). */
  q?: string;
};
