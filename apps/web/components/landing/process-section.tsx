import { Fragment } from "react";
import { ArrowRight } from "lucide-react";

import type { ProcessSection } from "@shared/landing";

export function ProcessSection({ section }: { section: ProcessSection }) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
      {section.title && (
        <h2 className="mb-10 text-center text-3xl font-semibold tracking-tight sm:mb-14 sm:text-4xl">
          {section.title}
        </h2>
      )}
      {/*
        Left-to-right step flow: numbered gradient nodes joined by arrows on wider
        screens, stacking vertically on mobile. Borderless for a lean look.
      */}
      <ol className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-2">
        {section.steps.map((step, index) => (
          <Fragment key={step.title}>
            <li className="flex flex-1 flex-col items-center text-center">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/60 text-lg font-bold text-primary-foreground shadow-sm">
                {index + 1}
              </span>
              <h3 className="mt-4 font-semibold">{step.title}</h3>
              <p className="mt-1.5 max-w-[16rem] text-sm leading-relaxed text-muted-foreground">
                {step.description}
              </p>
            </li>
            {index < section.steps.length - 1 && (
              <ArrowRight
                className="hidden size-6 shrink-0 self-start text-primary/40 sm:mt-3 sm:block"
                aria-hidden
              />
            )}
          </Fragment>
        ))}
      </ol>
    </section>
  );
}
