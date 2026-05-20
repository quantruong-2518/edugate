import { AlertTriangle } from "lucide-react";

import { Button } from "@ui/components/button";
import { EmptyState } from "@ui/components/empty-state";

export type ErrorStateProps = {
  title: string;
  description?: string;
  /** Retry handler — when provided with a label, renders a retry button. */
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
};

/**
 * Error variant of EmptyState: destructive-tinted icon plus an optional retry
 * button. Presentational / i18n-free — see EmptyState.
 */
export function ErrorState({
  title,
  description,
  onRetry,
  retryLabel,
  className,
}: ErrorStateProps) {
  return (
    <EmptyState
      icon={AlertTriangle}
      iconClassName="text-destructive"
      title={title}
      description={description}
      className={className}
      action={
        onRetry && retryLabel ? (
          <Button variant="outline" size="sm" onClick={onRetry}>
            {retryLabel}
          </Button>
        ) : undefined
      }
    />
  );
}
