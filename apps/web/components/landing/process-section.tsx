import type { ProcessSection } from "@shared/landing";

export function ProcessSection({ section }: { section: ProcessSection }) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
      {section.title && (
        <h2 className="mb-10 text-center text-3xl font-semibold tracking-tight sm:mb-14 sm:text-4xl">
          {section.title}
        </h2>
      )}
      <ol className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
        {section.steps.map((step, index) => (
          <li
            key={step.title}
            className="h-full rounded-3xl border border-border bg-card p-6 transition-colors hover:border-primary/40"
          >
            <span className="flex size-11 items-center justify-center rounded-2xl bg-primary text-base font-bold text-primary-foreground">
              {index + 1}
            </span>
            <h3 className="mt-4 font-semibold">{step.title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              {step.description}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
