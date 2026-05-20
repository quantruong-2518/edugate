/**
 * Ability matrix + evaluation.
 *
 * `ROLE_ABILITIES` mirrors the table in docs/PERMISSIONS.md exactly — flat
 * per-role rule lists, no role inheritance (a higher role re-declares the
 * lower role's rules). Keeping it explicit makes the BE guard and RLS
 * generators trivial to diff against this file.
 *
 * Adding a permission: edit the matrix here, then propagate to BE guard +
 * RLS policy (see "Defense in depth" in docs/PERMISSIONS.md). Never branch
 * the source of truth.
 */

import type { ApplicationState } from "../admission/states";
import {
  CORE_MODULES,
  moduleOf,
  type Action,
  type ModuleKey,
  type Resource,
  type Role,
  type Scope,
} from "./permissions";

/**
 * A concrete resource instance. Carries the fields needed to evaluate
 * instance-level scope (`own`/`tenant`) and state-conditioned rules.
 */
export type ResourceSubject = {
  resource: Resource;
  /** Owner user id — required to satisfy an `own`-scoped rule. */
  ownerId?: string | null;
  /** Tenant the resource belongs to — checked against the actor's tenant. */
  tenantId?: string | null;
  /** Application state — used by state-conditioned rules. */
  state?: ApplicationState;
};

/**
 * Either a bare resource type (coarse check for menus / route gates where no
 * instance exists) or a concrete instance (fine check with scope + condition).
 */
export type Subject = Resource | ResourceSubject;

export type AbilityRule = {
  action: Action | "*";
  resource: Resource | "*";
  scope: Scope;
  /**
   * Optional predicate on the subject instance. Evaluated only for concrete
   * instances; coarse (resource-string) checks ignore it and pass optimistically
   * — the BE guard re-checks with the real row.
   */
  when?: (subject: ResourceSubject) => boolean;
};

const CRUD: readonly Action[] = ["create", "read", "update", "delete"];

function rules(
  resource: Resource,
  scope: Scope,
  actions: readonly Action[],
): AbilityRule[] {
  return actions.map((action) => ({ action, resource, scope }));
}

export const ROLE_ABILITIES: Readonly<Record<Role, readonly AbilityRule[]>> = {
  APPLICANT: [
    { action: "create", resource: "application", scope: "own" },
    { action: "read", resource: "application", scope: "own" },
    {
      action: "update",
      resource: "application",
      scope: "own",
      when: (s) => s.state === "DRAFT" || s.state === "NEEDS_INFO",
    },
    { action: "confirm", resource: "application", scope: "own" },
    { action: "read", resource: "campaign", scope: "tenant" },
  ],
  REVIEWER: [
    { action: "read", resource: "application", scope: "tenant" },
    { action: "approve", resource: "application", scope: "tenant" },
    { action: "reject", resource: "application", scope: "tenant" },
    {
      action: "update",
      resource: "application",
      scope: "tenant",
      when: (s) => s.state === "UNDER_REVIEW",
    },
    { action: "read", resource: "campaign", scope: "tenant" },
    ...rules("review", "tenant", ["create", "read", "update"]),
    { action: "read", resource: "form_template", scope: "tenant" },
  ],
  ADMISSION_ADMIN: [
    ...rules("application", "tenant", CRUD),
    { action: "approve", resource: "application", scope: "tenant" },
    { action: "reject", resource: "application", scope: "tenant" },
    { action: "confirm", resource: "application", scope: "tenant" },
    { action: "export", resource: "application", scope: "tenant" },
    ...rules("campaign", "tenant", CRUD),
    ...rules("review", "tenant", CRUD),
    ...rules("form_template", "tenant", CRUD),
    { action: "read", resource: "tenant_config", scope: "tenant" },
    { action: "read", resource: "tenant_user", scope: "tenant" },
  ],
  TENANT_ADMIN: [
    ...rules("application", "tenant", CRUD),
    { action: "export", resource: "application", scope: "tenant" },
    ...rules("campaign", "tenant", CRUD),
    ...rules("review", "tenant", CRUD),
    ...rules("form_template", "tenant", CRUD),
    { action: "read", resource: "tenant_config", scope: "tenant" },
    { action: "update", resource: "tenant_config", scope: "tenant" },
    ...rules("tenant_user", "tenant", CRUD),
  ],
  SUPER_ADMIN: [{ action: "*", resource: "*", scope: "*" }],
};

/** Who's asking, in which tenant, with which roles + module entitlements. */
export type AbilityContext = {
  userId: string;
  tenantId: string;
  roles: readonly Role[];
  /** Modules the active tenant has purchased. */
  enabledModules: readonly ModuleKey[];
};

function matches<T extends string>(rulePart: T | "*", value: T): boolean {
  return rulePart === "*" || rulePart === value;
}

function scopeSatisfied(
  scope: Scope,
  ctx: AbilityContext,
  subject: ResourceSubject,
): boolean {
  switch (scope) {
    case "*":
      return true;
    case "tenant":
      // No tenant on the subject → can't disprove same-tenant; trust BE/RLS.
      return subject.tenantId == null || subject.tenantId === ctx.tenantId;
    case "own":
      return (
        subject.ownerId != null &&
        subject.ownerId === ctx.userId &&
        (subject.tenantId == null || subject.tenantId === ctx.tenantId)
      );
  }
}

/**
 * Can `ctx` perform `action` on `subject`?
 *
 * When `subject` is a bare resource string the check is coarse: scope and
 * `when` conditions are skipped (no instance to evaluate), so it answers
 * "could this user ever do X to a Y" — exactly what menu builders and route
 * gates want. Pass a `ResourceSubject` for a real, instance-level decision.
 */
export function can(
  ctx: AbilityContext,
  action: Action,
  subject: Subject,
): boolean {
  const isInstance = typeof subject !== "string";
  const resource: Resource = isInstance ? subject.resource : subject;

  const mod = moduleOf(resource);
  if (!CORE_MODULES.includes(mod) && !ctx.enabledModules.includes(mod)) {
    return false;
  }

  for (const role of ctx.roles) {
    for (const rule of ROLE_ABILITIES[role] ?? []) {
      if (!matches(rule.action, action)) continue;
      if (!matches(rule.resource, resource)) continue;
      if (isInstance) {
        if (rule.when && !rule.when(subject)) continue;
        if (!scopeSatisfied(rule.scope, ctx, subject)) continue;
      }
      return true;
    }
  }
  return false;
}

export type Ability = {
  context: AbilityContext;
  can: (action: Action, subject: Subject) => boolean;
  cannot: (action: Action, subject: Subject) => boolean;
};

/** Bind a context once and reuse `can`/`cannot` (FE provider, BE guard). */
export function createAbility(context: AbilityContext): Ability {
  return {
    context,
    can: (action, subject) => can(context, action, subject),
    cannot: (action, subject) => !can(context, action, subject),
  };
}
