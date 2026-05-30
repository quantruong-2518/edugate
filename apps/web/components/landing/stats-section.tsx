import type { StatsSection } from "@shared/landing";

// Bento discipline (tasteskill): N items fill N cells, never leave empty cells.
// Columns follow the item count instead of a fixed 4, so a tenant with 2 or 3
// stats doesn't render trailing empty cells on wider screens. Static class
// strings (Tailwind can't see interpolated class names).
const COLS: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-3",
  4: "grid-cols-2 sm:grid-cols-4",
};

export function StatsSection({ section }: { section: StatsSection }) {
  const count = section.items.length;
  // 5+ stats: 3 columns wrap cleanly without orphan cells for common counts.
  const cols = COLS[count] ?? "grid-cols-2 sm:grid-cols-3";

  return (
    <section className="px-4 py-10 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-5xl">
        <div
          className={`grid ${cols} gap-px overflow-hidden rounded-3xl border border-border bg-border`}
        >
          {section.items.map((item) => (
            <div
              key={item.label}
              className="bg-card px-4 py-8 text-center sm:px-6 sm:py-10"
            >
              <div className="text-4xl font-bold tracking-tight text-primary sm:text-5xl">
                {item.value}
              </div>
              <div className="mt-2 text-sm text-muted-foreground">
                {item.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
