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
});

export const heroSectionSchema = z.object({
  type: z.literal("hero"),
  eyebrow: z.string().optional(),
  headline: z.string(),
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

export const infoTabsSectionSchema = z.object({
  type: z.literal("infoTabs"),
  title: z.string().optional(),
  tabs: z.array(
    z.object({ id: z.string(), label: z.string(), body: z.string() }),
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

export const landingSectionSchema = z.discriminatedUnion("type", [
  heroSectionSchema,
  statsSectionSchema,
  processSectionSchema,
  infoTabsSectionSchema,
  aboutSectionSchema,
  testimonialsSectionSchema,
  faqSectionSchema,
  footerSectionSchema,
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
export type LandingSection = z.infer<typeof landingSectionSchema>;
export type LandingConfig = z.infer<typeof landingConfigSchema>;
