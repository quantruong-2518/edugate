import type { LandingSection } from "@shared/landing";

import { AboutSection } from "./about-section";
import { EnrollmentQuotaSection } from "./enrollment-quota-section";
import { FaqSection } from "./faq-section";
import { HeroSection } from "./hero-section";
import { InfoTabsSection } from "./info-tabs-section";
import { PledgeSection } from "./pledge-section";
import { ProcessSection } from "./process-section";
import { Reveal } from "./reveal";
import { StatsSection } from "./stats-section";
import { StoryCardsSection } from "./story-cards-section";
import { TestimonialsSection } from "./testimonials-section";

/**
 * Maps a section to its renderer. Unknown types (a pha 2 config may carry a
 * section type this FE build does not know yet) are skipped with a dev warning
 * rather than crashing the page.
 *
 * Each section (except the hero, which has its own load-in) is wrapped in
 * <Reveal> so it animates as it scrolls into view. The reveal is only *visible*
 * on tenants whose CSS opts in (see globals.css) — elsewhere it is an inert
 * wrapper. `enrollmentQuota` / `process` use no wrapper variant because their
 * inner cards/steps stagger themselves via `data-reveal-item`.
 */
export function LandingSectionRenderer({
  section,
  hrefPrefix = "",
}: {
  section: LandingSection;
  /** Prepended to internal CTA hrefs when the URL needs `/t/:code/` to be
   * shareable (see `getTenantHrefPrefix`). Only sections with CTAs read it. */
  hrefPrefix?: string;
}) {
  switch (section.type) {
    case "hero":
      return <HeroSection section={section} hrefPrefix={hrefPrefix} />;
    case "stats":
      return (
        <Reveal variant="up">
          <StatsSection section={section} />
        </Reveal>
      );
    case "enrollmentQuota":
      return (
        <Reveal>
          <EnrollmentQuotaSection section={section} />
        </Reveal>
      );
    case "process":
      return (
        <Reveal>
          <ProcessSection section={section} />
        </Reveal>
      );
    case "infoTabs":
      return (
        <Reveal variant="up">
          <InfoTabsSection section={section} />
        </Reveal>
      );
    case "about":
      return (
        <Reveal variant="up">
          <AboutSection section={section} />
        </Reveal>
      );
    case "testimonials":
      return (
        <Reveal variant="up">
          <TestimonialsSection section={section} />
        </Reveal>
      );
    case "pledge":
      return (
        <Reveal variant="up">
          <PledgeSection section={section} />
        </Reveal>
      );
    case "storyCards":
      return (
        <Reveal variant="up">
          <StoryCardsSection section={section} />
        </Reveal>
      );
    case "faq":
      return (
        <Reveal variant="up">
          <FaqSection section={section} />
        </Reveal>
      );
    case "footer":
      // Footer is rendered by (public)/layout.tsx so it appears on all public
      // pages (register, track, landing). Skip here to avoid double-render.
      return null;
    default: {
      if (process.env.NODE_ENV !== "production") {
        const unknownType = (section as { type: string }).type;
        console.warn(`[landing] Bỏ qua section type không hỗ trợ: ${unknownType}`);
      }
      return null;
    }
  }
}
