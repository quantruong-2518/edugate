import { z } from "zod";

/**
 * Configurable landing-page section model. Stored per-tenant in the DB (pha 2)
 * so a school reorders/edits sections without a redeploy. Zod-first: the editor
 * (task 17) validates against these schemas, and the render types are inferred
 * here so they never drift.
 *
 * Section *content* is data (per-tenant, editable VI strings) — not next-intl
 * keys. Only shared app chrome (CTA route labels, nav) goes through next-intl.
 */

const linkSchema = z.object({
  label: z.string(),
  href: z.string(),
  gradient: z.boolean().optional(),
});

export const heroSectionSchema = z.object({
  type: z.literal("hero"),
  eyebrow: z.string().optional(),
  headline: z.string(),
  /**
   * Optional trailing emphasis (e.g. the school name) rendered on its own line
   * in the display face with a brand gradient — `headline` becomes a small lead.
   */
  headlineHighlight: z.string().optional(),
  subheadline: z.string().optional(),
  /** Full-bleed background image URL (optional). */
  image: z.string().optional(),
  ctaPrimary: linkSchema.optional(),
  ctaSecondary: linkSchema.optional(),
});

export const statsSectionSchema = z.object({
  type: z.literal("stats"),
  items: z.array(z.object({ label: z.string(), value: z.string() })),
});

export const processSectionSchema = z.object({
  type: z.literal("process"),
  title: z.string().optional(),
  steps: z.array(z.object({ title: z.string(), description: z.string() })),
});

/**
 * Curated icon set for `infoTabs.list` layout. Keep the list short so the
 * editor (task 17) can offer a picker. Adding a name here is the *only* way
 * to extend it — the renderer maps it to a Lucide component statically so the
 * bundle doesn't pull in every icon.
 */
export const INFO_TABS_ICONS = [
  "users",
  "calendar",
  "fileText",
  "mapPin",
  "graduationCap",
  "info",
] as const;
export type InfoTabIcon = (typeof INFO_TABS_ICONS)[number];

export const infoTabsSectionSchema = z.object({
  type: z.literal("infoTabs"),
  title: z.string().optional(),
  /**
   * "tabs" (default) shows a tab strip; "list" stacks all items as a guide;
   * "cards" lays them out as a card row (carousel on small screens).
   */
  layout: z.enum(["tabs", "list", "cards"]).optional(),
  tabs: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      body: z.string(),
      /** Short key fact (date, place, count) surfaced in bold above the body. */
      highlight: z.string().optional(),
      /** Optional leading icon. */
      icon: z.enum(INFO_TABS_ICONS).optional(),
    }),
  ),
});

export const aboutSectionSchema = z.object({
  type: z.literal("about"),
  title: z.string(),
  body: z.string(),
  /** Side image URL (optional). */
  image: z.string().optional(),
});

export const testimonialsSectionSchema = z.object({
  type: z.literal("testimonials"),
  title: z.string().optional(),
  items: z.array(
    z.object({
      name: z.string(),
      role: z.string().optional(),
      quote: z.string(),
      /** Avatar image URL (optional). */
      avatarUrl: z.string().optional(),
    }),
  ),
});

export const faqSectionSchema = z.object({
  type: z.literal("faq"),
  title: z.string().optional(),
  items: z.array(z.object({ question: z.string(), answer: z.string() })),
});

export const footerSectionSchema = z.object({
  type: z.literal("footer"),
  columns: z
    .array(z.object({ title: z.string(), links: z.array(linkSchema) }))
    .optional(),
  copyright: z.string().optional(),
});

/**
 * Curated icon set for `enrollmentQuota.items`. Kept short so the editor (task
 * 17) can offer a picker; the renderer maps each name to a Lucide component
 * statically so the bundle does not pull in every icon.
 */
export const ENROLLMENT_QUOTA_ICONS = ["graduationCap", "globe", "users", "award"] as const;
export type EnrollmentQuotaIcon = (typeof ENROLLMENT_QUOTA_ICONS)[number];

/**
 * Admission targets — "Chỉ tiêu tuyển sinh". A school-year banner above a row of
 * program cards, each stating how many classes / seats are offered. Models the
 * NGT-style quota block (6 high-quality + 2 Cambridge classes).
 */
export const enrollmentQuotaSectionSchema = z.object({
  type: z.literal("enrollmentQuota"),
  /** Small centred label above the year, e.g. "Năm học". */
  eyebrow: z.string().optional(),
  /** Prominent school year, e.g. "2026 – 2027". */
  year: z.string(),
  /** Section subtitle, e.g. "Chỉ tiêu tuyển sinh lớp 6". */
  title: z.string().optional(),
  items: z
    .array(
      z.object({
        /** Headline count, e.g. "06". */
        value: z.string(),
        /** Program name, e.g. "Lớp chất lượng cao". */
        label: z.string(),
        /** Capacity note, e.g. "35 - 40 học sinh/lớp". */
        note: z.string().optional(),
        /** Optional leading icon. */
        icon: z.enum(ENROLLMENT_QUOTA_ICONS).optional(),
      }),
    )
    .min(1),
  /** Optional footer pill, e.g. "Năm học 2026 – 2027". */
  footnote: z.string().optional(),
});

/**
 * "Quan điểm giáo dục" — a carousel of staff quality pledges. Each slide is a
 * clipped ("lẹm") card with the speaker's portrait overlapping the top edge, the
 * pledge in italic, and the speaker's name + role beneath. Distinct from
 * `testimonials` (parent quotes, static grid).
 */
export const pledgeSectionSchema = z.object({
  type: z.literal("pledge"),
  title: z.string().optional(),
  /**
   * How multiple speakers are shown: "carousel" (default — one auto-rotating
   * slide) or "stacked" (all cards visible, stacked vertically with alternating
   * left/right portraits + horizontal offset). A single speaker always renders
   * as a feature card regardless.
   */
  layout: z.enum(["carousel", "stacked"]).optional(),
  items: z
    .array(
      z.object({
        quote: z.string(),
        name: z.string(),
        /** Speaker position, e.g. "Hiệu trưởng". */
        role: z.string().optional(),
        /** Portrait URL; falls back to an initials avatar when absent. */
        photoUrl: z.string().optional(),
        /**
         * How the portrait sits on the card: "cutout" (default — a transparent
         * PNG whose figure overlaps the card edge) or "framed" (a regular photo
         * shown in a rounded, object-cover frame). Use "framed" for ordinary
         * photos that still have their background.
         */
        portrait: z.enum(["cutout", "framed"]).optional(),
      }),
    )
    .min(1),
});

/**
 * Curated icon set for `storyCards` (used as the square image slot's fallback /
 * accent). Mapped to Lucide components statically in the renderer.
 */
export const STORY_CARD_ICONS = [
  "landmark",
  "building",
  "users",
  "trophy",
  "bookOpen",
  "sparkles",
] as const;
export type StoryCardIcon = (typeof STORY_CARD_ICONS)[number];

/**
 * "Truyền thống"-style storytelling: a horizontal carousel of sliding cards,
 * each with a square image slot (~1/3 of the card) and a short body. Key facts
 * in the body are emphasised (tenant gradient + bold) via the `emphasis` list.
 */
export const storyCardsSectionSchema = z.object({
  type: z.literal("storyCards"),
  title: z.string().optional(),
  cards: z
    .array(
      z.object({
        title: z.string(),
        body: z.string(),
        /** Square image URL shown in the card's image slot. */
        image: z.string().optional(),
        /** Fallback / accent icon shown when there is no image. */
        icon: z.enum(STORY_CARD_ICONS).optional(),
        /** Substrings of `body` rendered with the tenant gradient + bold. */
        emphasis: z.array(z.string()).optional(),
      }),
    )
    .min(1),
});

export const landingSectionSchema = z.discriminatedUnion("type", [
  heroSectionSchema,
  statsSectionSchema,
  processSectionSchema,
  infoTabsSectionSchema,
  aboutSectionSchema,
  testimonialsSectionSchema,
  faqSectionSchema,
  footerSectionSchema,
  enrollmentQuotaSectionSchema,
  pledgeSectionSchema,
  storyCardsSectionSchema,
]);

export const landingConfigSchema = z.object({
  sections: z.array(landingSectionSchema),
});

export const LANDING_SECTION_TYPES = [
  "hero",
  "stats",
  "process",
  "infoTabs",
  "about",
  "testimonials",
  "faq",
  "footer",
  "enrollmentQuota",
  "pledge",
  "storyCards",
] as const;

export type LandingSectionType = (typeof LANDING_SECTION_TYPES)[number];

export type LandingLink = z.infer<typeof linkSchema>;
export type HeroSection = z.infer<typeof heroSectionSchema>;
export type StatsSection = z.infer<typeof statsSectionSchema>;
export type ProcessSection = z.infer<typeof processSectionSchema>;
export type InfoTabsSection = z.infer<typeof infoTabsSectionSchema>;
export type AboutSection = z.infer<typeof aboutSectionSchema>;
export type TestimonialsSection = z.infer<typeof testimonialsSectionSchema>;
export type FaqSection = z.infer<typeof faqSectionSchema>;
export type FooterSection = z.infer<typeof footerSectionSchema>;
export type EnrollmentQuotaSection = z.infer<
  typeof enrollmentQuotaSectionSchema
>;
export type PledgeSection = z.infer<typeof pledgeSectionSchema>;
export type StoryCardsSection = z.infer<typeof storyCardsSectionSchema>;
export type LandingSection = z.infer<typeof landingSectionSchema>;
export type LandingConfig = z.infer<typeof landingConfigSchema>;
