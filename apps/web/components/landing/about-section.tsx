import Image from "next/image";

import type { AboutSection } from "@shared/landing";

export function AboutSection({ section }: { section: AboutSection }) {
  if (!section.image) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 sm:py-24">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {section.title}
        </h2>
        <p className="mt-5 text-pretty text-lg leading-relaxed text-muted-foreground">
          {section.body}
        </p>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
      <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-12">
        <div className="overflow-hidden rounded-3xl border border-border">
          <Image
            src={section.image}
            alt=""
            width={1200}
            height={900}
            sizes="(min-width: 1024px) 36rem, 100vw"
            className="aspect-[4/3] size-full object-cover"
          />
        </div>
        <div>
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {section.title}
          </h2>
          <p className="mt-5 text-pretty text-lg leading-relaxed text-muted-foreground">
            {section.body}
          </p>
        </div>
      </div>
    </section>
  );
}
