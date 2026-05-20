import type { AboutSection } from "@shared/landing";

export function AboutSection({ section }: { section: AboutSection }) {
  return (
    <section className="mx-auto max-w-3xl px-6 py-16 text-center">
      <h2 className="text-3xl font-semibold tracking-tight">{section.title}</h2>
      <p className="mt-4 text-pretty leading-relaxed text-muted-foreground">
        {section.body}
      </p>
    </section>
  );
}
