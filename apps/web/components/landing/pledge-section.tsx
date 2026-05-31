"use client";

import { useTranslations } from "next-intl";
import { type CSSProperties, useEffect, useState } from "react";

import type { PledgeSection as PledgeSectionType } from "@shared/landing";

type Pledge = PledgeSectionType["items"][number];

// Per-slide asymmetric corners + an offset, bamboo-tinted shadow — the "phá
// cách" look the brief asks for (large/small radii mixed, no two slides alike).
const CARD_SHAPES: CSSProperties[] = [
  {
    borderRadius: "2.75rem 1rem 2.25rem 0.75rem",
    boxShadow: "20px 26px 60px -22px rgba(16,68,52,0.38)",
  },
  {
    borderRadius: "1rem 2.75rem 0.75rem 2.5rem",
    boxShadow: "-18px 28px 58px -20px rgba(16,68,52,0.34)",
  },
  {
    borderRadius: "2.5rem 0.75rem 2.75rem 1rem",
    boxShadow: "14px 30px 62px -24px rgba(16,68,52,0.36)",
  },
];

const ROTATE_MS = 2000;

/** Last two name words' initials — the placeholder avatar before real photos. */
function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  return words
    .slice(-2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase();
}

function Portrait({ item }: { item: Pledge }) {
  if (item.photoUrl) {
    // Cut-out portrait (transparent background) — no ring/shadow; the figure
    // itself overlaps the card. Uniform height, width follows each photo.
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={item.photoUrl}
        alt={item.name}
        draggable={false}
        className="block h-56 w-auto select-none sm:h-72"
      />
    );
  }
  return (
    <div
      aria-hidden
      className="grid size-24 place-items-center self-center rounded-full bg-primary/15 font-display text-3xl font-bold text-primary sm:size-28"
    >
      {initials(item.name)}
    </div>
  );
}

export function PledgeSection({ section }: { section: PledgeSectionType }) {
  const t = useTranslations("landing");
  const items = section.items;
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  // Fully automatic rotation — one speaker per slide. Pauses on hover/focus and
  // when the visitor prefers reduced motion.
  useEffect(() => {
    if (items.length <= 1 || paused) return;
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }
    const id = window.setInterval(
      () => setActive((a) => (a + 1) % items.length),
      ROTATE_MS,
    );
    return () => window.clearInterval(id);
  }, [items.length, paused]);

  if (items.length === 0) return null;

  const current = items[active] ?? items[0]!;

  return (
    <section
      data-section="pledge"
      className="bg-muted/40 px-4 py-16 sm:px-6 sm:py-24"
    >
      <div className="mx-auto max-w-2xl">
        {section.title && (
          <h2 className="text-center text-3xl font-semibold tracking-tight sm:text-4xl">
            {section.title}
          </h2>
        )}

        <div
          className="relative mt-12 min-h-[26rem] sm:mt-14 sm:min-h-[20rem]"
          role="group"
          aria-roledescription="carousel"
          aria-label={section.title}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocusCapture={() => setPaused(true)}
          onBlurCapture={() => setPaused(false)}
        >
          <article
            key={active}
            style={CARD_SHAPES[active % CARD_SHAPES.length]}
            aria-roledescription="slide"
            aria-label={`${active + 1} / ${items.length}`}
            className="flex animate-in flex-col items-center gap-1 bg-gradient-to-br from-card to-muted/30 fade-in-0 zoom-in-95 duration-500 sm:flex-row sm:items-stretch sm:gap-2"
          >
            {/* Cut-out figure overlaps the card; stands on its base (desktop). */}
            <div className="shrink-0 sm:self-end">
              <Portrait item={current} />
            </div>

            <div className="flex flex-1 flex-col justify-center px-7 pb-8 pt-1 text-center sm:py-10 sm:pl-1 sm:pr-9 sm:text-left">
              <blockquote className="text-pretty text-base italic leading-relaxed text-foreground/85 before:content-['“'] after:content-['”'] sm:text-lg">
                {current.quote}
              </blockquote>
              <figcaption className="mt-5">
                <p className="font-display text-lg font-bold text-foreground">
                  {current.name}
                </p>
                {current.role && (
                  <p className="mt-0.5 text-xs font-semibold uppercase tracking-wider text-primary">
                    {current.role}
                  </p>
                )}
              </figcaption>
            </div>
          </article>
        </div>

        {/* Passive progress dots — no prev/next controls (auto only). */}
        {items.length > 1 && (
          <div className="mt-8 flex justify-center gap-2.5">
            {items.map((item, i) => (
              <button
                key={item.name}
                type="button"
                aria-label={t("pledge.goto", { index: i + 1 })}
                aria-current={i === active}
                onClick={() => setActive(i)}
                className={`h-2 rounded-full transition-all ${
                  i === active
                    ? "w-7 bg-primary"
                    : "w-2 bg-primary/25 hover:bg-primary/50"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
