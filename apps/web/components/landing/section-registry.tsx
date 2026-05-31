import type { LandingSection } from "@shared/landing";

import { AboutSection } from "./about-section";
import { FaqSection } from "./faq-section";
import { HeroSection } from "./hero-section";
import { InfoTabsSection } from "./info-tabs-section";
import { ProcessSection } from "./process-section";
import { StatsSection } from "./stats-section";
import { TestimonialsSection } from "./testimonials-section";

/**
 * Maps a section to its renderer. Unknown types (a pha 2 config may carry a
 * section type this FE build does not know yet) are skipped with a dev warning
 * rather than crashing the page.
 */
export function LandingSectionRenderer({
  section,
}: {
  section: LandingSection;
}) {
  switch (section.type) {
    case "hero":
      return <HeroSection section={section} />;
    case "stats":
      return <StatsSection section={section} />;
    case "process":
      return <ProcessSection section={section} />;
    case "infoTabs":
      return <InfoTabsSection section={section} />;
    case "about":
      return <AboutSection section={section} />;
    case "testimonials":
      return <TestimonialsSection section={section} />;
    case "faq":
      return <FaqSection section={section} />;
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
