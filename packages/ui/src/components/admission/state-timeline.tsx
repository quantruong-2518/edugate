import { APPLICATION_STATES, type ApplicationState } from "@shared/admission";

import { cn } from "@ui/lib/utils";

import { StateBadge } from "./state-badge";
import { TONE_DOT_CLASS } from "./state-tone";

export type TimelineEntry = {
  state: ApplicationState;
  /** ISO string or Date — serialized form survives RSC boundary. */
  at: string | Date;
  by?: { name: string; role?: string } | null;
  reason?: string | null;
};

export type StateTimelineProps = {
  /** Oldest first. Caller is responsible for ordering. */
  history: readonly TimelineEntry[];
  className?: string;
};

const DATE_FORMATTER = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function formatAt(value: string | Date): string {
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return String(value);
  return DATE_FORMATTER.format(d);
}

export function StateTimeline({ history, className }: StateTimelineProps) {
  if (history.length === 0) {
    return (
      <p className={cn("text-sm text-muted-foreground", className)}>
        Chưa có lịch sử trạng thái.
      </p>
    );
  }

  const lastIndex = history.length - 1;

  return (
    <ol
      className={cn("relative space-y-6 border-l border-border pl-6", className)}
    >
      {history.map((entry, i) => {
        const meta = APPLICATION_STATES[entry.state]!;
        const isCurrent = i === lastIndex;
        return (
          <li key={`${entry.state}-${i}`} className="relative">
            <span
              aria-hidden
              className={cn(
                "absolute -left-[33px] top-1.5 size-3 rounded-full ring-4 ring-background",
                TONE_DOT_CLASS[meta.tone]!,
                isCurrent && "size-3.5 -left-[34px] ring-[5px]",
              )}
            />
            <div className="flex flex-wrap items-center gap-2">
              <StateBadge state={entry.state} />
              <span className="text-xs text-muted-foreground">
                {formatAt(entry.at)}
              </span>
              {entry.by && (
                <span className="text-xs text-muted-foreground">
                  · {entry.by.name}
                  {entry.by.role && (
                    <span className="ml-1 opacity-70">({entry.by.role})</span>
                  )}
                </span>
              )}
            </div>
            {entry.reason && (
              <p className="mt-1 rounded-md bg-muted/60 px-3 py-2 text-sm text-foreground/80">
                {entry.reason}
              </p>
            )}
          </li>
        );
      })}
    </ol>
  );
}
