"use client";

import type { Action, Resource, Subject } from "@shared/auth";
import type { ReactNode } from "react";

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
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-2 px-4 py-16 text-center">
      <p className="text-4xl font-semibold tracking-tight">403</p>
      <p className="text-sm text-muted-foreground">
        Bạn không có quyền truy cập khu vực này.
      </p>
    </div>
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
