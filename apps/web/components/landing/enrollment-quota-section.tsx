import { Globe, GraduationCap, type LucideIcon } from "lucide-react";

import type {
  EnrollmentQuotaIcon,
  EnrollmentQuotaSection as EnrollmentQuotaSectionType,
} from "@shared/landing";

/**
 * Static icon map so the bundle only pulls the icons the section can use (see
 * `ENROLLMENT_QUOTA_ICONS` in @shared/landing).
 */
const ICON_MAP: Record<EnrollmentQuotaIcon, LucideIcon> = {
  graduationCap: GraduationCap,
  globe: Globe,
};

/**
 * Admission targets band: a school-year banner above a row of program cards.
 * Each card states the number of classes / seats for one program (e.g. 6
 * high-quality + 2 Cambridge classes). The single accent is the tenant primary.
 */
export function EnrollmentQuotaSection({ section }: { section: EnrollmentQuotaSectionType }) {
  return (
    <section
      data-section="enrollmentQuota"
      className="bg-muted/40 px-4 py-16 sm:px-6 sm:py-20"
    >
      <div className="mx-auto max-w-4xl">
        {section.eyebrow && (
          <div className="flex items-center justify-center gap-4">
            <span aria-hidden className="h-px w-10 bg-primary/40 sm:w-16" />
            <span className="text-sm font-semibold uppercase tracking-[0.25em] text-primary">
              {section.eyebrow}
            </span>
            <span aria-hidden className="h-px w-10 bg-primary/40 sm:w-16" />
          </div>
        )}

        <p className="mt-4 text-center font-display text-5xl font-bold tracking-tight text-primary sm:text-6xl">
          {section.year}
        </p>

        {section.title && (
          <h2 className="mt-2 text-center text-base font-bold uppercase tracking-[0.15em] text-foreground sm:text-lg">
            {section.title}
          </h2>
        )}

        <div className="mt-10 grid gap-4 sm:grid-cols-2 sm:gap-5">
          {section.items.map((item) => {
            const Icon = item.icon ? ICON_MAP[item.icon] : null;
            return (
              <div
                key={item.label}
                className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6"
              >
                {Icon && (
                  <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground sm:size-14">
                    <Icon className="size-6 sm:size-7" aria-hidden />
                  </span>
                )}
                <span className="font-display text-5xl font-bold leading-none tracking-tight text-primary sm:text-6xl">
                  {item.value}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-bold uppercase leading-snug tracking-wide text-foreground sm:text-base">
                    {item.label}
                  </p>
                  {item.note && (
                    <p className="mt-1 text-xs leading-snug text-muted-foreground sm:text-sm">
                      {item.note}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
