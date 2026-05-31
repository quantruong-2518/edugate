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
export const ENROLLMENT_QUOTA_ICONS = ["graduationCap", "globe"] as const;
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
export type LandingSection = z.infer<typeof landingSectionSchema>;
export type LandingConfig = z.infer<typeof landingConfigSchema>;
