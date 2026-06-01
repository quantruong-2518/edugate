import { z } from "zod";

/**
 * Tenant theme contract.
 *
 * Each tenant ships one TenantTheme. The token names mirror the shadcn
 * semantic system so components in packages/ui pick them up automatically
 * via Tailwind v4 `@theme inline` mappings (see apps/web/app/globals.css).
 *
 * Values are CSS color expressions (we use oklch but any valid CSS color
 * works). The runtime injector (task 6) calls `tenantThemeToCss` and writes
 * the result into a `<style>` tag in the RSC root layout.
 */

export type TenantColorTokens = {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  popover: string;
  popoverForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  destructiveForeground: string;
  border: string;
  input: string;
  ring: string;
};

export type TenantTheme = {
  /** Base border radius. shadcn derives sm/md/lg/xl via calc(). */
  radius: string;
  /** CSS font-family stacks. */
  font: {
    sans: string;
    mono?: string;
    /** Optional override for the display face (prominent names/headings). */
    display?: string;
  };
  light: TenantColorTokens;
  dark: TenantColorTokens;
};

/**
 * Default theme — matches the shadcn `neutral` baseColor light + dark palette.
 * Used as fallback when a tenant has no overrides.
 */
export const DEFAULT_TENANT_THEME: TenantTheme = {
  radius: "0.625rem",
  font: {
    sans: "var(--font-sans), ui-sans-serif, system-ui, -apple-system, sans-serif",
    mono: "ui-monospace, SFMono-Regular, Menlo, monospace",
  },
  light: {
    background: "oklch(1 0 0)",
    foreground: "oklch(0.145 0 0)",
    card: "oklch(1 0 0)",
    cardForeground: "oklch(0.145 0 0)",
    popover: "oklch(1 0 0)",
    popoverForeground: "oklch(0.145 0 0)",
    primary: "oklch(0.205 0 0)",
    primaryForeground: "oklch(0.985 0 0)",
    secondary: "oklch(0.97 0 0)",
    secondaryForeground: "oklch(0.205 0 0)",
    muted: "oklch(0.97 0 0)",
    mutedForeground: "oklch(0.556 0 0)",
    accent: "oklch(0.97 0 0)",
    accentForeground: "oklch(0.205 0 0)",
    destructive: "oklch(0.577 0.245 27.325)",
    destructiveForeground: "oklch(0.985 0 0)",
    border: "oklch(0.922 0 0)",
    input: "oklch(0.922 0 0)",
    ring: "oklch(0.708 0 0)",
  },
  dark: {
    background: "oklch(0.145 0 0)",
    foreground: "oklch(0.985 0 0)",
    card: "oklch(0.205 0 0)",
    cardForeground: "oklch(0.985 0 0)",
    popover: "oklch(0.205 0 0)",
    popoverForeground: "oklch(0.985 0 0)",
    primary: "oklch(0.922 0 0)",
    primaryForeground: "oklch(0.205 0 0)",
    secondary: "oklch(0.269 0 0)",
    secondaryForeground: "oklch(0.985 0 0)",
    muted: "oklch(0.269 0 0)",
    mutedForeground: "oklch(0.708 0 0)",
    accent: "oklch(0.269 0 0)",
    accentForeground: "oklch(0.985 0 0)",
    destructive: "oklch(0.704 0.191 22.216)",
    destructiveForeground: "oklch(0.985 0 0)",
    border: "oklch(1 0 0 / 10%)",
    input: "oklch(1 0 0 / 15%)",
    ring: "oklch(0.556 0 0)",
  },
};

const COLOR_KEY_TO_CSS: Record<keyof TenantColorTokens, string> = {
  background: "--background",
  foreground: "--foreground",
  card: "--card",
  cardForeground: "--card-foreground",
  popover: "--popover",
  popoverForeground: "--popover-foreground",
  primary: "--primary",
  primaryForeground: "--primary-foreground",
  secondary: "--secondary",
  secondaryForeground: "--secondary-foreground",
  muted: "--muted",
  mutedForeground: "--muted-foreground",
  accent: "--accent",
  accentForeground: "--accent-foreground",
  destructive: "--destructive",
  destructiveForeground: "--destructive-foreground",
  border: "--border",
  input: "--input",
  ring: "--ring",
};

function colorBlock(tokens: TenantColorTokens): string {
  return (Object.keys(COLOR_KEY_TO_CSS) as Array<keyof TenantColorTokens>)
    .map((key) => `${COLOR_KEY_TO_CSS[key]}: ${tokens[key]};`)
    .join("");
}

/**
 * Serialize a TenantTheme to a CSS string ready to drop inside a `<style>`
 * tag. Produces `:root { ... light + radius + font ... } .dark { ... dark ... }`.
 *
 * Idempotent and side-effect-free; safe to call from RSC.
 */
/**
 * Zod validator for TenantTheme. Used at the admin settings PATCH boundary
 * so a malformed theme can't poison `tenants.theme` and crash future RSC
 * renders. Token values are CSS color expressions — accept any non-empty
 * string; the browser/PostCSS will reject invalid ones at render time.
 */
const cssColor = z.string().min(1).max(120);

const colorTokensSchema = z.object({
  background: cssColor,
  foreground: cssColor,
  card: cssColor,
  cardForeground: cssColor,
  popover: cssColor,
  popoverForeground: cssColor,
  primary: cssColor,
  primaryForeground: cssColor,
  secondary: cssColor,
  secondaryForeground: cssColor,
  muted: cssColor,
  mutedForeground: cssColor,
  accent: cssColor,
  accentForeground: cssColor,
  destructive: cssColor,
  destructiveForeground: cssColor,
  border: cssColor,
  input: cssColor,
  ring: cssColor,
}) satisfies z.ZodType<TenantColorTokens>;

export const tenantThemeSchema = z.object({
  radius: z.string().min(1).max(40),
  font: z.object({
    sans: z.string().min(1).max(500),
    mono: z.string().min(1).max(500).optional(),
  }),
  light: colorTokensSchema,
  dark: colorTokensSchema,
}) satisfies z.ZodType<TenantTheme>;

export function tenantThemeToCss(theme: TenantTheme): string {
  const root = [
    `--radius: ${theme.radius};`,
    `--font-sans-tenant: ${theme.font.sans};`,
    theme.font.mono ? `--font-mono-tenant: ${theme.font.mono};` : "",
    theme.font.display ? `--font-display-tenant: ${theme.font.display};` : "",
    colorBlock(theme.light),
  ].join("");

  const dark = colorBlock(theme.dark);

  return `:root{${root}}.dark{${dark}}`;
}
