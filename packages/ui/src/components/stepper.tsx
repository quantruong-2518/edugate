import * as React from "react";
import { Check } from "lucide-react";

import { cn } from "@ui/lib/utils";

export type StepperStep = {
  id: string;
  label: string;
};

export type StepperProps = {
  steps: readonly StepperStep[];
  /** Zero-based index of the active step. */
  current: number;
  className?: string;
};

/**
 * Horizontal step indicator for multi-step flows (admission apply wizard,
 * task 12). Pure presentational — no internal state, parent owns `current`.
 * No extra dependency; built on the existing token palette.
 */
function Stepper({ steps, current, className }: StepperProps) {
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
                  isCurrent && "border-primary text-primary",
                  !isDone &&
                    !isCurrent &&
                    "border-border text-muted-foreground",
                )}
              >
                {isDone ? (
                  <Check className="size-4" aria-hidden />
                ) : (
                  index + 1
                )}
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
