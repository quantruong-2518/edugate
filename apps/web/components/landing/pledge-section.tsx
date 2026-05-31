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
  if (item.photoUrl && item.portrait === "framed") {
    // Regular photo (still has its background) → a rounded, object-cover frame.
    // objectPosition biases the crop toward the subject (right-of-centre here).
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={item.photoUrl}
        alt={item.name}
        draggable={false}
        style={{ objectPosition: "58% 50%" }}
        className="h-64 w-52 select-none rounded-[2rem] object-cover shadow-xl ring-1 ring-border/60 sm:h-80 sm:w-64"
      />
    );
  }
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

// Cut-out figure treatment: eight offset white drop-shadows trace a thin
// "sticker" border around the silhouette; the last is a soft cast shadow so the
// figure reads as lifted off the card it overlaps.
const CUTOUT_FILTER = (() => {
  const s = "#ffffff";
  const d = "2px";
  return [
    `drop-shadow(${d} 0 0 ${s})`,
    `drop-shadow(-${d} 0 0 ${s})`,
    `drop-shadow(0 ${d} 0 ${s})`,
    `drop-shadow(0 -${d} 0 ${s})`,
    `drop-shadow(${d} ${d} 0 ${s})`,
    `drop-shadow(-${d} ${d} 0 ${s})`,
    `drop-shadow(${d} -${d} 0 ${s})`,
    `drop-shadow(-${d} -${d} 0 ${s})`,
    "drop-shadow(0 18px 24px rgba(15,40,80,0.32))",
  ].join(" ");
})();

/**
 * Single speaker → a "lời ngỏ" feature card. Mobile: a flex row — the cut-out
 * beside the quote. Desktop: the figure is pulled out to the far left, overlaps
 * the card and rises past its top border (sticker outline + lifted shadow). The
 * card reserves left space so the figure never sits on the text. Inherits the
 * section's tenant tint via `data-section="pledge"`.
 */
function FeatureMessage({ title, item }: { title?: string; item: Pledge }) {
  return (
    <section
      data-section="pledge"
      className="bg-muted/40 px-4 py-16 sm:px-6 sm:py-24"
    >
      <div className="mx-auto max-w-4xl">
        {title && (
          <h2 className="text-center text-3xl font-semibold tracking-tight sm:text-4xl">
            {title}
          </h2>
        )}

        <article
          style={{ borderRadius: "2.25rem 1rem 2.25rem 1rem" }}
          className="relative mt-16 grid grid-cols-[8rem_minmax(0,1fr)] items-end gap-4 bg-gradient-to-br from-card to-muted/30 px-4 py-7 shadow-[0_30px_60px_-28px_rgba(15,40,80,0.5)] sm:mt-24 sm:block sm:min-h-[19rem] sm:px-12 sm:py-12 sm:pl-[22rem]"
        >
          {/* Figure: a grid column on mobile, pulled out to the far left and
              rising above the card on desktop. No `relative` here so the
              desktop `absolute` img anchors to the card, not this wrapper. */}
          <div className="self-end">
            {item.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.photoUrl}
                alt={item.name}
                draggable={false}
                style={{ filter: CUTOUT_FILTER }}
                className="pointer-events-none block h-auto w-full max-w-[12rem] select-none sm:absolute sm:-left-2 sm:bottom-0 sm:h-[23rem] sm:w-auto sm:max-w-none"
              />
            ) : (
              <div
                aria-hidden
                className="mx-auto grid size-24 place-items-center rounded-full bg-primary/15 font-display text-3xl font-bold text-primary sm:absolute sm:bottom-10 sm:left-16 sm:size-32"
              >
                {initials(item.name)}
              </div>
            )}
          </div>

          {/* Message */}
          <div className="min-w-0 text-left">
            <span
              aria-hidden
              className="block select-none font-display text-6xl leading-[0.5] text-primary/20 sm:text-8xl"
            >
              &ldquo;
            </span>
            <blockquote className="mt-3 text-pretty text-base italic leading-relaxed text-foreground/85 sm:text-2xl sm:leading-relaxed">
              {item.quote}
            </blockquote>
            <figcaption className="mt-6 flex items-center gap-3 sm:gap-4">
              <span
                aria-hidden
                className="h-px w-8 shrink-0 bg-gradient-to-r from-primary to-transparent sm:w-10"
              />
              <span>
                <span className="block font-display text-lg font-bold text-foreground sm:text-2xl">
                  {item.name}
                </span>
                {item.role && (
                  <span className="mt-0.5 block text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-primary sm:text-xs">
                    {item.role}
                  </span>
                )}
              </span>
            </figcaption>
          </div>
        </article>
      </div>
    </section>
  );
}

/** Multiple speakers → an auto-rotating carousel of clipped pledge cards. */
function PledgeCarousel({ section }: { section: PledgeSectionType }) {
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
            {/* Cut-out figure overlaps the card and stands on its base; a framed
                photo instead sits centred with breathing room. */}
            <div
              className={
                current.portrait === "framed"
                  ? "shrink-0 p-5 sm:self-center sm:py-7 sm:pl-7 sm:pr-0"
                  : "shrink-0 sm:self-end"
              }
            >
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

export function PledgeSection({ section }: { section: PledgeSectionType }) {
  if (section.items.length === 0) return null;
  // A lone speaker reads as a "lời ngỏ" feature; several rotate in a carousel.
  if (section.items.length === 1) {
    return <FeatureMessage title={section.title} item={section.items[0]!} />;
  }
  return <PledgeCarousel section={section} />;
}
