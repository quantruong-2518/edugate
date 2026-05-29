import { SetMetadata } from "@nestjs/common";

/**
 * Tags a controller handler so AuditInterceptor writes an audit_log row on
 * successful completion. Tagging is opt-in — only mutations the product
 * cares about appear in the viewer (see specs/API_SPEC.md §1.10).
 *
 * Action is inferred from HTTP method if not provided:
 *   POST  → create
 *   PATCH → update
 *   PUT   → update
 *   DELETE→ delete
 *
 * Override via `action` for non-CRUD verbs ("approve", "state_change",
 * "export", "login", "settings_update").
 *
 * `omit` lists request-body field names whose values should be redacted in
 * the persisted payload. Use for password, code, token, secrets.
 */

export const AUDIT_KEY = "audit";

export type AuditAction =
  | "create"
  | "update"
  | "delete"
  | "approve"
  | "reject"
  | "login"
  | "export"
  | "state_change"
  | "settings_update";

export type AuditOptions = {
  resource: string;
  action?: AuditAction;
  /** Body field names to redact in the persisted payload. */
  omit?: readonly string[];
};

export const Audit = (options: AuditOptions): MethodDecorator =>
  SetMetadata(AUDIT_KEY, options);
