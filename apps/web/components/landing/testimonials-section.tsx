import { Quote } from "lucide-react";
import Image from "next/image";

import type { TestimonialsSection } from "@shared/landing";

import { Reveal } from "./reveal";

export function TestimonialsSection({
  section,
}: {
  section: TestimonialsSection;
}) {
  return (
    <section className="bg-muted/30 px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-6xl">
        {section.title && (
          <Reveal>
            <h2 className="mb-10 text-center text-3xl font-semibold tracking-tight sm:mb-14 sm:text-4xl">
              {section.title}
            </h2>
          </Reveal>
        )}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {section.items.map((item, index) => (
            <Reveal key={item.name} delay={index * 90}>
              <figure className="relative h-full rounded-3xl bg-card/80 p-6 shadow-sm ring-1 ring-border/40 backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:shadow-lg sm:p-7">
                <Quote className="size-8 text-primary/25" aria-hidden />
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
                      className="size-11 rounded-full object-cover ring-2 ring-primary/15"
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
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
