import { APPLICATION_STATES, type ApplicationState } from "@shared/admission";

import { cn } from "@ui/lib/utils";

import { STATE_ICON } from "./state-icon";
import { TONE_BADGE_CLASS } from "./state-tone";

export type StateBadgeProps = {
  state: ApplicationState;
  /** Hide the icon (e.g. inside a dense table cell). */
  iconOnly?: boolean;
  className?: string;
};

export function StateBadge({ state, iconOnly = false, className }: StateBadgeProps) {
  // APPLICATION_STATES / STATE_ICON are exhaustive over ApplicationState; the
  // bang is safe under noUncheckedIndexedAccess.
  const meta = APPLICATION_STATES[state]!;
  const Icon = STATE_ICON[state]!;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        TONE_BADGE_CLASS[meta.tone]!,
        className,
      )}
      title={meta.description}
    >
      <Icon className="size-3.5" aria-hidden />
      {!iconOnly && <span>{meta.label}</span>}
    </span>
  );
}
