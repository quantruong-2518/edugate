"use client";

import type { Action, Resource, Subject } from "@shared/auth";
import type { ReactNode } from "react";

import { useAbility } from "@/lib/auth/ability-provider";

export type CanProps = {
  /** Action to check, e.g. `"approve"`. */
  I: Action;
  /** Concrete resource instance — enables scope + condition checks. */
  this?: Subject;
  /** Bare resource type for a coarse check (menu items, page-level gates). */
  a?: Resource;
  /** Alias of `a`, reads better for vowel-initial resources. */
  an?: Resource;
  /** Rendered when the user lacks the permission. Defaults to nothing. */
  fallback?: ReactNode;
  children: ReactNode;
};

/**
 * Conditionally renders children when the current ability allows `I` on the
 * subject. UX only — never the security boundary (BE guard + RLS are).
 *
 *   <Can I="approve" this={application}>...</Can>
 *   <Can I="read" a="campaign">...</Can>
 */
export function Can(props: CanProps) {
  const { can } = useAbility();
  const subject = props.this ?? props.an ?? props.a;

  if (subject === undefined) {
    throw new Error("<Can> requires either `this` (instance) or `a`/`an` (resource)");
  }

  return <>{can(props.I, subject) ? props.children : (props.fallback ?? null)}</>;
}
