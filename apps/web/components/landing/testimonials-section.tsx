import { Quote } from "lucide-react";
import Image from "next/image";

import type { TestimonialsSection } from "@shared/landing";

type Item = TestimonialsSection["items"][number];

function TestimonialCard({
  item,
  featured = false,
}: {
  item: Item;
  featured?: boolean;
}) {
  return (
    <figure className="flex h-full flex-col rounded-3xl bg-gradient-to-br from-card to-muted/40 p-6 shadow-sm sm:p-7">
      <Quote className="size-7 shrink-0 text-primary/25" aria-hidden />
      <blockquote
        className={`mt-3 flex-1 text-pretty italic leading-relaxed text-foreground/90 ${featured ? "text-base sm:text-lg" : "text-[15px]"}`}
      >
        {item.quote}
      </blockquote>
      <figcaption className="mt-6 flex items-center gap-3">
        {item.avatarUrl ? (
          <Image
            src={item.avatarUrl}
            alt=""
            width={44}
            height={44}
            className="size-11 shrink-0 rounded-full object-cover"
          />
        ) : (
          <span
            className="flex size-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/60 font-display text-lg font-semibold text-primary-foreground"
            aria-hidden
          >
            {item.name.charAt(0)}
          </span>
        )}
        <div className="min-w-0">
          <div className="truncate font-display text-base font-semibold leading-tight">
            {item.name}
          </div>
          {item.role && (
            <div className="text-xs text-muted-foreground">{item.role}</div>
          )}
        </div>
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

  // Feature the longest quote full-width on top; the rest sit in a 2-col grid
  // below. Length-driven so the one verbose review never starves a tiny one.
  let featuredIdx = 0;
  section.items.forEach((item, i) => {
    if (item.quote.length > section.items[featuredIdx]!.quote.length) {
      featuredIdx = i;
    }
  });
  const featured = section.items[featuredIdx]!;
  const rest = section.items.filter((_, i) => i !== featuredIdx);

  return (
    <section className="bg-muted/30 px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-6xl">
        {section.title && (
          <h2 className="mb-10 text-center text-3xl font-semibold tracking-tight sm:mb-14 sm:text-4xl">
            {section.title}
          </h2>
        )}
        <div className="flex flex-col gap-6">
          <TestimonialCard item={featured} featured />
          {rest.length > 0 && (
            <div className="grid gap-6 sm:grid-cols-2">
              {rest.map((item) => (
                <TestimonialCard key={item.name} item={item} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
