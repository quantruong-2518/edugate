import type { CSSProperties } from "react";

import { MarketingFooter } from "./marketing-footer";
import { MarketingHeader } from "./marketing-header";
import {
  Cta,
  Features,
  Hero,
  Modules,
  Proof,
  Steps,
  Trust,
} from "./marketing-sections";

/**
 * The Ghi Danh product marketing site — served at the root host (no tenant
 * resolved). Distinct concern from a tenant's admission landing: this sells the
 * platform to schools.
 *
 * Ghi Danh's own brand accent (Tailwind indigo-600) is scoped here via CSS
 * variable overrides, so every `bg-primary` / `text-primary` token resolves to
 * indigo inside this subtree without touching the per-tenant theme system that
 * powers school landings.
 */
const GHIDANH_BRAND = {
  "--primary": "oklch(0.511 0.262 276.966)",
  "--primary-foreground": "oklch(0.985 0 0)",
  "--ring": "oklch(0.511 0.262 276.966)",
} as CSSProperties;

export function MarketingHome() {
  return (
    <div style={GHIDANH_BRAND} className="min-h-dvh">
      <MarketingHeader />
      <main>
        <Hero />
        <Proof />
        <Trust />
        <Features />
        <Modules />
        <Steps />
        <Cta />
      </main>
      <MarketingFooter />
    </div>
  );
}
