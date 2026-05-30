import { Quote } from "lucide-react";
import Image from "next/image";

import type { TestimonialsSection } from "@shared/landing";

export function TestimonialsSection({
  section,
}: {
  section: TestimonialsSection;
}) {
  return (
    <section className="bg-muted/40 px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-6xl">
        {section.title && (
          <h2 className="mb-10 text-center text-3xl font-semibold tracking-tight sm:mb-14 sm:text-4xl">
            {section.title}
          </h2>
        )}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {section.items.map((item) => (
            <figure
              key={item.name}
              className="h-full rounded-3xl border border-border bg-card p-6 sm:p-7"
            >
              <Quote className="size-8 text-primary/30" aria-hidden />
              <blockquote className="mt-3 text-pretty leading-relaxed">
                {item.quote}
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-3">
                {item.avatarUrl && (
                  <Image
                    src={item.avatarUrl}
                    alt=""
                    width={44}
                    height={44}
                    className="size-11 rounded-full object-cover"
                  />
                )}
                <div>
                  <div className="text-sm font-semibold">{item.name}</div>
                  {item.role && (
                    <div className="text-sm text-muted-foreground">
                      {item.role}
                    </div>
                  )}
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
