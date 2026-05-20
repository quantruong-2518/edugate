import { ArrowRight } from "lucide-react";
import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";

import type { HeroSection } from "@shared/landing";
import { Button } from "@ui/components/button";

import { Reveal } from "./reveal";

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
            className="-z-10 scale-105 object-cover"
          />
          {/* Legibility + brand tint over the photo, blended to the page bg. */}
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-background/92 via-background/70 to-primary/20" />
          <div className="absolute inset-0 -z-10 bg-background/30" />
        </>
      )}

      {/* Soft brand blobs */}
      <div className="pointer-events-none absolute -left-24 top-0 -z-10 size-72 rounded-full bg-primary/30 blur-[100px]" />
      <div className="pointer-events-none absolute -right-20 bottom-0 -z-10 size-80 rounded-full bg-primary/20 blur-[110px]" />

      <div className="mx-auto flex max-w-4xl flex-col items-center px-6 py-28 text-center sm:py-40">
        <Reveal>
          {section.eyebrow && (
            <p className="mb-6 inline-flex items-center gap-2 rounded-full bg-background/60 px-4 py-1.5 text-sm font-medium text-primary shadow-sm ring-1 ring-primary/15 backdrop-blur">
              <span className="size-1.5 animate-pulse rounded-full bg-primary" />
              {section.eyebrow}
            </p>
          )}
          <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-6xl">
            {section.headline}
          </h1>
          {section.subheadline && (
            <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground">
              {section.subheadline}
            </p>
          )}
        </Reveal>

        {(section.ctaPrimary || section.ctaSecondary) && (
          <Reveal
            delay={120}
            className="mt-10 flex flex-wrap justify-center gap-3"
          >
            {section.ctaPrimary && (
              <Button
                asChild
                size="lg"
                className="group gap-2 shadow-lg shadow-primary/20"
              >
                <Link href={section.ctaPrimary.href as Route}>
                  {section.ctaPrimary.label}
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </Button>
            )}
            {section.ctaSecondary && (
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-border/50 bg-background/60 backdrop-blur"
              >
                <Link href={section.ctaSecondary.href as Route}>
                  {section.ctaSecondary.label}
                </Link>
              </Button>
            )}
          </Reveal>
        )}
      </div>
    </section>
  );
}
