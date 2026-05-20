import type { ProcessSection } from "@shared/landing";

export function ProcessSection({ section }: { section: ProcessSection }) {
  return (
    <section className="mx-auto max-w-5xl px-6 py-16">
      {section.title && (
        <h2 className="mb-10 text-center text-3xl font-semibold tracking-tight">
          {section.title}
        </h2>
      )}
      <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
        {section.steps.map((step, index) => (
          <li key={step.title} className="rounded-lg border bg-card p-5">
            <span className="flex size-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
              {index + 1}
            </span>
            <h3 className="mt-3 font-medium">{step.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {step.description}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
