import type { StatsSection } from "@shared/landing";

import { Reveal } from "./reveal";

export function StatsSection({ section }: { section: StatsSection }) {
  return (
    <section className="px-4 py-10 sm:px-6 sm:py-12">
      <Reveal className="mx-auto max-w-5xl">
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-3xl bg-border/40 shadow-sm sm:grid-cols-4">
          {section.items.map((item) => (
            <div
              key={item.label}
              className="bg-card/80 px-4 py-8 text-center backdrop-blur transition-colors hover:bg-card sm:px-6 sm:py-10"
            >
              <div className="bg-gradient-to-br from-primary to-primary/60 bg-clip-text text-4xl font-bold text-transparent sm:text-5xl">
                {item.value}
              </div>
              <div className="mt-2 text-sm text-muted-foreground">
                {item.label}
              </div>
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
