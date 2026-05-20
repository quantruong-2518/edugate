import type { StatsSection } from "@shared/landing";

export function StatsSection({ section }: { section: StatsSection }) {
  return (
    <section className="border-y bg-card">
      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 px-6 py-12 sm:grid-cols-3">
        {section.items.map((item) => (
          <div key={item.label} className="text-center">
            <div className="text-4xl font-bold text-primary">{item.value}</div>
            <div className="mt-1 text-sm text-muted-foreground">
              {item.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
