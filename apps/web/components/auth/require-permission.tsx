"use client";

import type { Action, Resource, Subject } from "@shared/auth";
import { ShieldX } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { EmptyState } from "@ui/components/empty-state";

import { useAbility } from "@/lib/auth/ability-provider";

export type RequirePermissionProps = {
  action: Action;
  /** Coarse resource-level gate (most common for routes). */
  resource?: Resource;
  /** Instance-level gate when the route concerns a specific record. */
  subject?: Subject;
  /** Rendered when denied. Defaults to a 403 panel. */
  fallback?: ReactNode;
  children: ReactNode;
};

function Forbidden() {
  const t = useTranslations("errors.forbidden");
  return (
    <EmptyState
      icon={ShieldX}
      iconClassName="text-destructive"
      title={t("title")}
      description={t("description")}
      className="py-16"
    />
  );
}

/**
 * Route/section gate. Renders children only when the ability permits, else a
 * 403 fallback. FE convenience for hiding whole pages — the BE still rejects
 * direct API calls.
 */
export function RequirePermission({
  action,
  resource,
  subject,
  fallback,
  children,
}: RequirePermissionProps) {
  const { can } = useAbility();
  const target = subject ?? resource;

  if (target === undefined) {
    throw new Error("<RequirePermission> requires `resource` or `subject`");
  }

  if (can(action, target)) {
    return <>{children}</>;
  }
  return <>{fallback ?? <Forbidden />}</>;
}
