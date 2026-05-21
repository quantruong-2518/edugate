"use client";

import type { CSSProperties } from "react";

import type { LandingSection } from "@shared/landing";

import { RevealStaticContext } from "@/components/landing/reveal";
import { LandingSectionRenderer } from "@/components/landing/section-registry";
import type { BrandingDraft } from "@/lib/api/appearance";

/**
 * Live, in-page preview. Reuses the real landing section renderers so it is
 * truly WYSIWYG, scoped to a wrapper:
 *  - branding tokens are applied as inline CSS vars (light set only — the admin
 *    shell runs light in pha 1), echoing the marketing-site override pattern;
 *  - `RevealStaticContext` disables the scroll-reveal animation so sections
 *    aren't stuck hidden inside the constrained preview panel.
 */
export function LandingPreview({
  sections,
  branding,
}: {
  sections: LandingSection[];
  branding: BrandingDraft;
}) {
  const style = {
    "--primary": branding.primaryLight,
    "--primary-foreground": branding.primaryForegroundLight,
    "--ring": branding.primaryLight,
    "--radius": branding.radius,
    "--font-sans-tenant": branding.fontSans,
  } as CSSProperties;

  return (
    <RevealStaticContext.Provider value={true}>
      <div style={style} className="bg-background font-sans text-foreground">
        {sections.map((section, index) => (
          <LandingSectionRenderer
            key={`${section.type}-${index}`}
            section={section}
          />
        ))}
      </div>
    </RevealStaticContext.Provider>
  );
}
