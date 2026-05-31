import {
  BookOpen,
  Building2,
  Landmark,
  Sparkles,
  Trophy,
  Users,
  type LucideIcon,
} from "lucide-react";

import type { StoryCardIcon, StoryCardsSection } from "@shared/landing";

const ICONS: Record<StoryCardIcon, LucideIcon> = {
  landmark: Landmark,
  building: Building2,
  users: Users,
  trophy: Trophy,
  bookOpen: BookOpen,
  sparkles: Sparkles,
};

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
 * A horizontal, snap-scrolling carousel of story cards (e.g. a school's
 * "Truyền thống"). Each card leads with a square, rounded image slot (~1/3 of
 * the card) — an icon-on-gradient placeholder when no photo is set — then a
 * title and a short body with key facts emphasised. Pure CSS scroll-snap, so it
 * stays a server component. Inherits the tenant tint via `data-section`.
 */
export function StoryCardsSection({ section }: { section: StoryCardsSection }) {
  if (section.cards.length === 0) return null;

  return (
    <section
      data-section="storyCards"
      className="bg-muted/40 px-4 py-16 sm:px-6 sm:py-24"
    >
      <div className="mx-auto max-w-6xl">
        {section.title && (
          <h2 className="mb-8 text-center text-3xl font-semibold tracking-tight sm:mb-12 sm:text-4xl">
            {section.title}
          </h2>
        )}

        {/* Edge-to-edge snap carousel; hidden scrollbar, drag/swipe to slide. */}
        <ul className="-mx-4 flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-4 [-ms-overflow-style:none] [scrollbar-width:none] sm:-mx-6 sm:px-6 [&::-webkit-scrollbar]:hidden">
          {section.cards.map((card, i) => {
            const Icon = (card.icon && ICONS[card.icon]) || Sparkles;
            return (
              <li
                key={card.title}
                className="flex min-w-[78%] max-w-[22rem] shrink-0 snap-start flex-col rounded-3xl bg-gradient-to-br from-card to-muted/40 p-6 shadow-sm ring-1 ring-border/50 sm:min-w-[20rem] sm:p-7"
              >
                <div className="flex items-center gap-4">
                  {/* Square image slot (~1/3 of the card) — photo or icon. */}
                  <div className="aspect-square w-[34%] min-w-[5.5rem] shrink-0 overflow-hidden rounded-2xl ring-1 ring-border/60">
                    {card.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={card.image}
                        alt={card.title}
                        className="size-full object-cover"
                      />
                    ) : (
                      <div className="grid size-full place-items-center bg-gradient-to-br from-primary to-primary/55 text-primary-foreground">
                        <Icon className="size-8" aria-hidden />
                      </div>
                    )}
                  </div>
                  <div>
                    <span className="font-display text-sm font-bold text-primary">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <h3 className="font-display text-lg font-bold leading-tight tracking-tight text-foreground sm:text-xl">
                      {card.title}
                    </h3>
                  </div>
                </div>

                <p className="mt-5 text-pretty text-[15px] leading-relaxed text-muted-foreground">
                  <Emphasized text={card.body} emphasis={card.emphasis} />
                </p>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
