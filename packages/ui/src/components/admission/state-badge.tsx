import { APPLICATION_STATES, type ApplicationState } from "@shared/admission";

import { cn } from "@ui/lib/utils";

import { TONE_BADGE_CLASS, TONE_DOT_CLASS } from "./state-tone";

export type StateBadgeProps = {
  state: ApplicationState;
  /** Show only the dot without the label. */
  iconOnly?: boolean;
  className?: string;
};

export function StateBadge({ state, iconOnly = false, className }: StateBadgeProps) {
  // APPLICATION_STATES is exhaustive over ApplicationState; the bang is safe.
  const meta = APPLICATION_STATES[state]!;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        TONE_BADGE_CLASS[meta.tone]!,
        className,
      )}
      title={meta.description}
    >
      <span
        className={cn("size-2 shrink-0 rounded-full", TONE_DOT_CLASS[meta.tone]!)}
        aria-hidden
      />
      {!iconOnly && <span>{meta.label}</span>}
    </span>
  );
}
