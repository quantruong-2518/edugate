import Image from "next/image";

import type { AboutSection } from "@shared/landing";

import { Reveal } from "./reveal";

export function AboutSection({ section }: { section: AboutSection }) {
  if (!section.image) {
    return (
      <section className="mx-auto max-w-3xl px-6 py-24 text-center">
        <Reveal>
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {section.title}
          </h2>
          <p className="mt-5 text-pretty text-lg leading-relaxed text-muted-foreground">
            {section.body}
          </p>
        </Reveal>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-6xl px-6 py-24">
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <Reveal>
          <div className="relative">
            {/* Brand glow behind the framed image */}
            <div className="absolute -inset-4 -z-10 rounded-[2rem] bg-primary/20 blur-2xl" />
            <div className="overflow-hidden rounded-3xl shadow-xl ring-1 ring-border/40">
              <Image
                src={section.image}
                alt=""
                width={1200}
                height={900}
                sizes="(min-width: 1024px) 36rem, 100vw"
                className="aspect-[4/3] size-full object-cover transition-transform duration-700 hover:scale-105"
              />
            </div>
          </div>
        </Reveal>
        <Reveal delay={120}>
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {section.title}
          </h2>
          <p className="mt-5 text-pretty text-lg leading-relaxed text-muted-foreground">
            {section.body}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
