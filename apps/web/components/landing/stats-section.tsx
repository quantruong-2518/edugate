import type { StatsSection } from '@shared/landing';

export function StatsSection({ section }: { section: StatsSection }) {
  return (
    <section className="px-4 py-10 sm:px-6 sm:py-12">
      {/*
        Big-typography stat: the number leads at display size with the label set
        right beside it. Borderless soft surfaces (gradient card → muted) keep the
        band lean; the figure carries a brand gradient. Capped at two columns so
        the oversized number always has room next to its label.
      */}
      <div className="mx-auto grid max-w-3xl gap-4 sm:grid-cols-2">
        {section.items.map((item) => (
          <div
            key={item.label}
            className="flex items-center gap-5 rounded-3xl bg-gradient-to-br from-card to-muted/40 p-6 sm:p-7"
          >
            <span className="shrink-0 bg-gradient-to-br from-primary to-primary/50 bg-clip-text text-5xl font-bold leading-none tracking-tight text-transparent sm:text-6xl">
              {item.value}
            </span>
            <span className="text-sm font-medium leading-snug text-muted-foreground sm:text-base">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
