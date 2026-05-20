import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@ui/lib/utils";

export type EmptyStateProps = {
  /** Optional leading icon. */
  icon?: LucideIcon;
  /** Override the icon tint (defaults to muted). */
  iconClassName?: string;
  title: string;
  description?: string;
  /** Optional action(s) — typically a Button or Link. */
  action?: ReactNode;
  className?: string;
};

/**
 * Presentational placeholder for "no data" / not-found / 403 / error screens.
 * Stays i18n-free — callers pass already-translated strings (the ui package
 * never depends on next-intl).
 */
export function EmptyState({
  icon: Icon,
  iconClassName,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "mx-auto flex max-w-md flex-col items-center gap-3 px-4 py-12 text-center",
        className,
      )}
    >
      {Icon && (
        <Icon
          className={cn("size-10 text-muted-foreground", iconClassName)}
          aria-hidden
        />
      )}
      <div className="space-y-1">
        <p className="text-base font-semibold">{title}</p>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
