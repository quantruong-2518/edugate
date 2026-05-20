/**
 * Permission vocabulary for the ability layer.
 *
 * Source of truth shared by:
 *   - FE `<Can>` / `<RequirePermission>` gates (UX).
 *   - BE `@RequirePermission()` guard (pha 2, security).
 *   - Postgres RLS policy generation (pha 2, last line of defense).
 *
 * Permission string form: `${Action}:${Resource}` or `${Action}:${Resource}:${Scope}`.
 * See docs/PERMISSIONS.md.
 */

export const ACTIONS = [
  "create",
  "read",
  "update",
  "delete",
  "approve",
  "reject",
  "export",
  "confirm",
] as const;

export type Action = (typeof ACTIONS)[number];

export const RESOURCES = [
  "application",
  "campaign",
  "review",
  "form_template",
  "notification_template",
  "employee",
  "department",
  "position",
  "fee_item",
  "fee_sheet",
  "payment",
  "learner",
  "class",
  "service_item",
  "service_order",
  "tenant_config",
  "tenant_user",
  "article",
  "journal",
  "slider",
  "survey",
  "survey_response",
  "request",
] as const;

export type Resource = (typeof RESOURCES)[number];

/**
 * own    — only resources the user owns.
 * tenant — any resource inside the user's active tenant (default).
 * *      — cross-tenant, SUPER_ADMIN only.
 */
export const SCOPES = ["own", "tenant", "*"] as const;

export type Scope = (typeof SCOPES)[number];

/**
 * Real (human) roles. The admission state machine uses its own actor list
 * `ApplicationRole` which adds `SYSTEM` (cron) and omits the platform-level
 * TENANT_ADMIN / SUPER_ADMIN — those still satisfy admission transitions
 * here via the matrix below, but a transition actor is a narrower concept.
 */
export const ROLES = [
  "APPLICANT",
  "REVIEWER",
  "ADMISSION_ADMIN",
  "TENANT_ADMIN",
  "SUPER_ADMIN",
] as const;

export type Role = (typeof ROLES)[number];

/** Product modules a tenant can purchase. Gates resource access per tenant. */
export const MODULES = [
  "admission",
  "hrms",
  "fee",
  "lms",
  "pos",
  "content",
  "survey",
  "crm",
  "platform",
] as const;

export type ModuleKey = (typeof MODULES)[number];

const RESOURCE_MODULE: Readonly<Record<Resource, ModuleKey>> = {
  application: "admission",
  campaign: "admission",
  review: "admission",
  form_template: "admission",
  notification_template: "admission",
  employee: "hrms",
  department: "hrms",
  position: "hrms",
  fee_item: "fee",
  fee_sheet: "fee",
  payment: "fee",
  learner: "lms",
  class: "lms",
  service_item: "pos",
  service_order: "pos",
  tenant_config: "platform",
  tenant_user: "platform",
  article: "content",
  journal: "content",
  slider: "content",
  survey: "survey",
  survey_response: "survey",
  request: "crm",
};

export function moduleOf(resource: Resource): ModuleKey {
  return RESOURCE_MODULE[resource];
}

/**
 * Core modules are never gated by purchase — a tenant always has a config
 * and users, so `tenant_config` / `tenant_user` stay available everywhere.
 */
export const CORE_MODULES: readonly ModuleKey[] = ["platform"];
