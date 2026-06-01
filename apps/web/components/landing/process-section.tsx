import { type CSSProperties, Fragment } from "react";
import { ArrowRight } from "lucide-react";

import type { ProcessSection } from "@shared/landing";

export function ProcessSection({ section }: { section: ProcessSection }) {
  return (
    <section
      data-section="process"
      className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24"
    >
      {section.title && (
        <h2 className="mb-10 text-center text-3xl font-semibold tracking-tight sm:mb-14 sm:text-4xl">
          {section.title}
        </h2>
      )}
      {/* Mobile: a 2-up grid (steps read left→right, top→bottom); desktop: one
          row with arrows between. `data-reveal-item="x"` + a per-step
          `--reveal-index` makes the steps cascade left→right when a <Reveal>
          ancestor scrolls into view (tenants that opt in via CSS); inert otherwise. */}
      <ol className="grid grid-cols-2 gap-x-4 gap-y-10 sm:flex sm:flex-row sm:items-start sm:gap-2">
        {section.steps.map((step, index) => (
          <Fragment key={step.title}>
            <li
              data-reveal-item="x"
              style={{ "--reveal-index": index } as CSSProperties}
              className="flex flex-1 flex-col items-center text-center"
            >
              <span
                data-step-num=""
                className="font-display text-6xl font-bold leading-none text-primary/60 sm:text-8xl"
              >
                {index + 1}
              </span>
              <h3 className="mt-3 font-semibold">{step.title}</h3>
              <p className="mt-1.5 max-w-[16rem] text-sm leading-relaxed text-muted-foreground">
                {step.description}
              </p>
            </li>
            {index < section.steps.length - 1 && (
              <ArrowRight
                data-reveal-item="x"
                style={{ "--reveal-index": index + 0.5 } as CSSProperties}
                className="hidden size-6 shrink-0 self-start text-primary/40 sm:mt-10 sm:block"
                aria-hidden
              />
            )}
          </Fragment>
        ))}
      </ol>
    </section>
  );
}
