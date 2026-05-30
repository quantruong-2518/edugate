import type { CSSProperties } from "react";

import type { TestimonialsSection } from "@shared/landing";

import { HighlightedText } from "./highlight-text";

type Item = TestimonialsSection["items"][number];

// Asymmetric radii + offset shadows give each card an organic, hand-placed feel.
const CARD_STYLES: CSSProperties[] = [
  {
    borderRadius: "2.5rem 0.75rem 2rem 0.75rem",
    boxShadow: "8px 14px 40px -6px rgba(0,0,0,0.13), -2px -2px 12px -2px rgba(0,0,0,0.05)",
  },
  {
    borderRadius: "0.75rem 2.5rem 0.75rem 2rem",
    boxShadow: "-6px 12px 36px -4px rgba(0,0,0,0.11), 3px -3px 14px -2px rgba(0,0,0,0.05)",
  },
  {
    borderRadius: "2rem 0.75rem 2.5rem 0.75rem",
    boxShadow: "6px 16px 44px -8px rgba(0,0,0,0.14), -3px 2px 10px -2px rgba(0,0,0,0.04)",
  },
];

function TestimonialCard({
  item,
  styleIndex = 0,
  featured = false,
}: {
  item: Item;
  styleIndex?: number;
  featured?: boolean;
}) {
  const cardStyle = CARD_STYLES[styleIndex % CARD_STYLES.length];

  return (
    <figure
      style={cardStyle}
      className="flex h-full flex-col bg-gradient-to-br from-card to-muted/40 p-6 sm:p-8"
    >
      <blockquote
        className={`flex-1 text-pretty italic leading-relaxed text-foreground/85 before:content-['"'] after:content-['"'] ${featured ? "text-sm sm:text-base" : "text-xs sm:text-sm"}`}
      >
        <HighlightedText text={item.quote} />
      </blockquote>
      <figcaption className="mt-5 text-sm">
        <span className="font-semibold">{item.name}</span>
        {item.role && (
          <span className="text-muted-foreground"> · {item.role}</span>
        )}
      </figcaption>
    </figure>
  );
}

export function TestimonialsSection({
  section,
}: {
  section: TestimonialsSection;
}) {
  if (section.items.length === 0) return null;

  let featuredIdx = 0;
  section.items.forEach((item, i) => {
    if (item.quote.length > section.items[featuredIdx]!.quote.length) {
      featuredIdx = i;
    }
  });
  const featured = section.items[featuredIdx]!;
  const rest = section.items.filter((_, i) => i !== featuredIdx);

  return (
    <section className="bg-muted/50 px-6 py-16 sm:px-16 sm:py-24 lg:px-32">
      <div className="mx-auto max-w-4xl">
        {section.title && (
          <h2 className="mb-10 text-center text-3xl font-semibold tracking-tight sm:mb-14 sm:text-4xl">
            {section.title}
          </h2>
        )}
        <div className="flex flex-col gap-6">
          <TestimonialCard item={featured} styleIndex={0} featured />
          {rest.length > 0 && (
            <div className="grid gap-6 sm:grid-cols-2">
              {rest.map((item, i) => (
                <TestimonialCard key={item.name} item={item} styleIndex={i + 1} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
