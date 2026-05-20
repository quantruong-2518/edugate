import type { ProcessSection } from "@shared/landing";

import { Reveal } from "./reveal";

export function ProcessSection({ section }: { section: ProcessSection }) {
  return (
    <section className="mx-auto max-w-6xl px-6 py-24">
      {section.title && (
        <Reveal>
          <h2 className="mb-14 text-center text-3xl font-semibold tracking-tight sm:text-4xl">
            {section.title}
          </h2>
        </Reveal>
      )}
      <ol className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
        {section.steps.map((step, index) => (
          <Reveal key={step.title} delay={index * 80}>
            <li className="group h-full rounded-3xl bg-card/70 p-6 shadow-sm ring-1 ring-border/40 backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:ring-primary/30">
              <span className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/70 text-base font-bold text-primary-foreground shadow-md shadow-primary/20">
                {index + 1}
              </span>
              <h3 className="mt-4 font-semibold">{step.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {step.description}
              </p>
            </li>
          </Reveal>
        ))}
      </ol>
    </section>
  );
}
