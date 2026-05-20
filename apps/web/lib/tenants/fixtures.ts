import type { TenantBranding } from "@shared/branding";
import { DEFAULT_TENANT_THEME, type TenantTheme } from "@shared/theme";

/**
 * Hardcoded tenant registry for pha 1. Swap to a `tenants` table query in
 * pha 2 — the returned shape stays `TenantBranding`. Codes here must match
 * the subdomain / path pattern accepted by the middleware (`[a-z0-9-]`).
 *
 * Each tenant overrides only the brand-defining tokens (primary, ring,
 * accent, sidebar-ish) on top of `DEFAULT_TENANT_THEME` so neutral tokens
 * (background, muted, border) stay consistent across tenants.
 */

function tenantTheme(overrides: {
  light: { primary: string; primaryForeground: string };
  dark: { primary: string; primaryForeground: string };
}): TenantTheme {
  return {
    radius: DEFAULT_TENANT_THEME.radius,
    font: DEFAULT_TENANT_THEME.font,
    light: {
      ...DEFAULT_TENANT_THEME.light,
      primary: overrides.light.primary,
      primaryForeground: overrides.light.primaryForeground,
      ring: overrides.light.primary,
    },
    dark: {
      ...DEFAULT_TENANT_THEME.dark,
      primary: overrides.dark.primary,
      primaryForeground: overrides.dark.primaryForeground,
      ring: overrides.dark.primary,
    },
  };
}

export const TENANT_FIXTURES: Readonly<Record<string, TenantBranding>> = {
  "cva-edu": {
    code: "cva-edu",
    name: "Trường Tiểu học & THCS Cầu Vàng",
    shortName: "CVA",
    logoUrl: null,
    theme: tenantTheme({
      // Tailwind blue-600 / blue-400 in oklch.
      light: {
        primary: "oklch(0.546 0.215 262.881)",
        primaryForeground: "oklch(0.985 0 0)",
      },
      dark: {
        primary: "oklch(0.707 0.165 254.624)",
        primaryForeground: "oklch(0.205 0 0)",
      },
    }),
  },
  "tran-dai-nghia": {
    code: "tran-dai-nghia",
    name: "Trường THPT Trần Đại Nghĩa",
    shortName: "TĐN",
    logoUrl: null,
    theme: tenantTheme({
      // Tailwind rose-700 / rose-400 in oklch — warm burgundy.
      light: {
        primary: "oklch(0.514 0.222 16.935)",
        primaryForeground: "oklch(0.985 0 0)",
      },
      dark: {
        primary: "oklch(0.712 0.194 13.428)",
        primaryForeground: "oklch(0.205 0 0)",
      },
    }),
  },
};

export const DEFAULT_BRANDING: TenantBranding = {
  code: "default",
  name: "Edu SaaS",
  shortName: "Edu",
  logoUrl: null,
  theme: DEFAULT_TENANT_THEME,
};
