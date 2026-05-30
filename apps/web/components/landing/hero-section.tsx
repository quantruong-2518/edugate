import { ArrowRight } from "lucide-react";
import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";

import type { HeroSection } from "@shared/landing";
import { Button } from "@ui/components/button";

export function HeroSection({ section }: { section: HeroSection }) {
  return (
    <section className="relative isolate overflow-hidden">
      {section.image && (
        <>
          <Image
            src={section.image}
            alt=""
            fill
            priority
            sizes="100vw"
            className="-z-10 object-cover"
          />
          {/* Legibility + brand tint over the photo, blended to the page bg. */}
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-background/95 via-background/80 to-primary/15" />
        </>
      )}

      {/* One soft brand glow — the single warm moment on an otherwise calm page. */}
      <div className="pointer-events-none absolute -left-24 top-0 -z-10 size-72 rounded-full bg-primary/20 blur-[110px]" />

      <div className="mx-auto flex max-w-4xl flex-col items-center px-4 py-16 text-center sm:px-6 sm:py-20 lg:py-24">
        {section.eyebrow && (
          <p className="mb-6 rounded-full bg-gradient-to-r from-primary/15 to-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
            {section.eyebrow}
          </p>
        )}
        <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-6xl">
          {section.headline}
        </h1>
        {section.subheadline && (
          <p className="mx-auto mt-6 max-w-2xl text-pretty bg-gradient-to-r from-primary via-foreground to-foreground bg-clip-text text-xl font-semibold leading-snug tracking-tight text-transparent sm:text-2xl">
            {section.subheadline}
          </p>
        )}

        {(section.ctaPrimary || section.ctaSecondary) && (
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            {section.ctaPrimary && (
              <Button asChild size="lg" className="group gap-2">
                <Link href={section.ctaPrimary.href as Route}>
                  {section.ctaPrimary.label}
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
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
