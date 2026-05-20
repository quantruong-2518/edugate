import type { Route } from "next";
import Link from "next/link";

import type { HeroSection } from "@shared/landing";
import { Button } from "@ui/components/button";

export function HeroSection({ section }: { section: HeroSection }) {
  return (
    <section className="bg-primary/5">
      <div className="mx-auto max-w-5xl px-6 py-20 text-center sm:py-28">
        {section.eyebrow && (
          <p className="mb-3 text-sm font-medium text-primary">
            {section.eyebrow}
          </p>
        )}
        <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl">
          {section.headline}
        </h1>
        {section.subheadline && (
          <p className="mx-auto mt-4 max-w-2xl text-pretty text-lg text-muted-foreground">
            {section.subheadline}
          </p>
        )}
        {(section.ctaPrimary || section.ctaSecondary) && (
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {section.ctaPrimary && (
              <Button asChild size="lg">
                <Link href={section.ctaPrimary.href as Route}>
                  {section.ctaPrimary.label}
                </Link>
              </Button>
            )}
            {section.ctaSecondary && (
              <Button asChild size="lg" variant="outline">
                <Link href={section.ctaSecondary.href as Route}>
                  {section.ctaSecondary.label}
                </Link>
              </Button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
