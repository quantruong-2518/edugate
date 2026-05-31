"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import type { StoryCardsSection } from "@shared/landing";

/** One story every this many ms. */
const ROTATE_MS = 3000;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Renders `text`, wrapping any `emphasis` substring in the tenant gradient + bold. */
function Emphasized({ text, emphasis }: { text: string; emphasis?: string[] }) {
  const terms = (emphasis ?? []).filter(Boolean);
  if (terms.length === 0) return <>{text}</>;

  // Longest-first so overlapping terms match the most specific phrase.
  const pattern = terms
    .slice()
    .sort((a, b) => b.length - a.length)
    .map(escapeRegExp)
    .join("|");
  const parts = text.split(new RegExp(`(${pattern})`, "g"));
  const set = new Set(terms);

  return (
    <>
      {parts.map((part, i) =>
        set.has(part) ? (
          <strong
            key={i}
            className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text font-bold text-transparent"
          >
            {part}
          </strong>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

/**
 * Editorial "Truyền thống" feature, styled as a newspaper column: one story at
 * a time, no headline — just a short accent rule and the body led by a large
 * drop cap spanning several lines, with key facts emphasised. Auto-advances
 * every 3s, pausing on hover/focus and when the visitor prefers reduced motion.
 * Inherits the tenant tint via `data-section`.
 */
export function StoryCardsSection({ section }: { section: StoryCardsSection }) {
  const t = useTranslations("landing");
  const cards = section.cards;
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (cards.length <= 1 || paused) return;
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }
    const id = window.setInterval(
      () => setActive((a) => (a + 1) % cards.length),
      ROTATE_MS,
    );
    return () => window.clearInterval(id);
  }, [cards.length, paused, active]);

  if (cards.length === 0) return null;

  const current = cards[active] ?? cards[0]!;

  return (
    <section
      data-section="storyCards"
      className="bg-muted/40 px-4 py-16 sm:px-6 sm:py-24"
    >
      <div className="mx-auto max-w-2xl">
        {section.title && (
          <h2 className="mb-10 text-center text-3xl font-semibold tracking-tight sm:mb-14 sm:text-4xl">
            {section.title}
          </h2>
        )}

        <div
          className="min-h-[14rem] sm:min-h-[10rem]"
          role="group"
          aria-roledescription="carousel"
          aria-label={section.title}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocusCapture={() => setPaused(true)}
          onBlurCapture={() => setPaused(false)}
        >
          {/* Re-mounting on `active` replays the fade for each story. */}
          <article
            key={active}
            aria-roledescription="slide"
            aria-label={`${active + 1} / ${cards.length}`}
            className="animate-in fade-in-0 slide-in-from-right-4 duration-500"
          >
            <div className="h-1 w-12 rounded-full bg-primary" />
            {/* Drop cap on the first letter — the newspaper lede look. */}
            <p className="mt-6 text-pretty text-lg leading-relaxed text-foreground/85 [&::first-letter]:float-left [&::first-letter]:mr-3 [&::first-letter]:mt-1 [&::first-letter]:font-display [&::first-letter]:text-7xl [&::first-letter]:font-bold [&::first-letter]:leading-[0.85] [&::first-letter]:text-primary sm:text-xl sm:[&::first-letter]:text-8xl">
              <Emphasized text={current.body} emphasis={current.emphasis} />
            </p>
          </article>
        </div>

        {/* Passive progress ticks — no prev/next controls (auto only). */}
        {cards.length > 1 && (
          <div className="mt-10 flex justify-center gap-2.5">
            {cards.map((card, i) => (
              <button
                key={card.title}
                type="button"
                aria-label={t("storyCards.goto", { index: i + 1 })}
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
