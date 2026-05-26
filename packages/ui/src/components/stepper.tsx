import * as React from "react";
import { Check } from "lucide-react";

import { cn } from "@ui/lib/utils";

export type StepperStep = {
  id: string;
  label: string;
  /** Optional one-line hint shown under the label (vertical only). */
  description?: string;
};

export type StepperProps = {
  steps: readonly StepperStep[];
  /** Zero-based index of the active step. */
  current: number;
  /** Layout direction. Horizontal for compact bars, vertical for side rails. */
  orientation?: "horizontal" | "vertical";
  className?: string;
};

/**
 * Step indicator for multi-step flows (admission apply wizard, task 12).
 * Pure presentational — no internal state, parent owns `current`. Built on
 * the token palette only. Horizontal suits narrow/top placement; vertical
 * suits a desktop side rail and shows per-step descriptions.
 */
function Stepper({
  steps,
  current,
  orientation = "horizontal",
  className,
}: StepperProps) {
  if (orientation === "vertical") {
    return (
      <ol className={cn("flex flex-col", className)} aria-label="Tiến trình">
        {steps.map((step, index) => {
          const isDone = index < current;
          const isCurrent = index === current;
          const isLast = index === steps.length - 1;

          return (
            <li
              key={step.id}
              className={cn("relative flex gap-3.5", !isLast && "pb-6")}
              aria-current={isCurrent ? "step" : undefined}
            >
              {!isLast && (
                <span
                  aria-hidden
                  className={cn(
                    "absolute left-4 top-9 -ml-px h-[calc(100%-2.25rem)] w-px transition-colors",
                    isDone ? "bg-primary" : "bg-border",
                  )}
                />
              )}
              <span
                className={cn(
                  "z-10 flex size-8 shrink-0 items-center justify-center rounded-full border text-sm font-medium transition-colors",
                  isDone && "border-primary bg-primary text-primary-foreground",
                  isCurrent &&
                    "border-primary text-primary ring-4 ring-primary/10",
                  !isDone &&
                    !isCurrent &&
                    "border-border bg-background text-muted-foreground",
                )}
              >
                {isDone ? <Check className="size-4" aria-hidden /> : index + 1}
              </span>
              <div className="pt-1">
                <p
                  className={cn(
                    "text-sm font-medium leading-tight transition-colors",
                    isCurrent || isDone
                      ? "text-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  {step.label}
                </p>
                {step.description && (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {step.description}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    );
  }

  return (
    <ol
      className={cn("flex w-full items-center", className)}
      aria-label="Tiến trình"
    >
      {steps.map((step, index) => {
        const isDone = index < current;
        const isCurrent = index === current;
        const isLast = index === steps.length - 1;

        return (
          <li
            key={step.id}
            className={cn("flex items-center", !isLast && "flex-1")}
            aria-current={isCurrent ? "step" : undefined}
          >
            <div className="flex flex-col items-center gap-1.5">
              <span
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full border text-sm font-medium transition-colors",
                  isDone && "border-primary bg-primary text-primary-foreground",
                  isCurrent &&
                    "border-primary text-primary ring-4 ring-primary/10",
                  !isDone &&
                    !isCurrent &&
                    "border-border text-muted-foreground",
                )}
              >
                {isDone ? <Check className="size-4" aria-hidden /> : index + 1}
              </span>
              <span
                className={cn(
                  "max-w-20 text-center text-xs leading-tight",
                  // On narrow screens only the active label shows (others would
                  // overlap); from `sm` up every label is visible.
                  isCurrent ? "block" : "hidden sm:block",
                  isCurrent
                    ? "font-medium text-foreground"
                    : "text-muted-foreground",
                )}
              >
                {step.label}
              </span>
            </div>
            {!isLast && (
              <span
                aria-hidden
                className={cn(
                  "mx-2 h-px flex-1 transition-colors",
                  isDone ? "bg-primary" : "bg-border",
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

export { Stepper };
