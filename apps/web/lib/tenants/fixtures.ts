import type { TenantBranding } from "@shared/branding";
import { DEFAULT_TENANT_THEME, type TenantTheme } from "@shared/theme";

/**
 * Hardcoded tenant registry for pha 1. Swap to a `tenants` table query in
 * pha 2, the returned shape stays `TenantBranding`. Codes here must match
 * the subdomain / path pattern accepted by the middleware (`[a-z0-9-]`).
 *
 * Each tenant overrides only the brand-defining tokens (primary, ring,
 * accent, sidebar-ish) on top of `DEFAULT_TENANT_THEME` so neutral tokens
 * (background, muted, border) stay consistent across tenants.
 */

function tenantTheme(overrides: {
  light: { primary: string; primaryForeground: string };
  dark: { primary: string; primaryForeground: string };
  /** Optional CSS font-family stack for the display face (prominent names). */
  display?: string;
}): TenantTheme {
  return {
    radius: DEFAULT_TENANT_THEME.radius,
    font: overrides.display
      ? { ...DEFAULT_TENANT_THEME.font, display: overrides.display }
      : DEFAULT_TENANT_THEME.font,
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
      // Tailwind rose-700 / rose-400 in oklch, warm burgundy.
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
  "nguyen-huy-tuong": {
    code: "nguyen-huy-tuong",
    name: "Trường THCS Nguyễn Huy Tưởng, Đông Anh, Hà Nội",
    shortName: "NHT",
    logoUrl: null,
    theme: tenantTheme({
      // Jade ("xanh ngọc") — a cooler, gemstone green leaning teal (hue ~178),
      // the bamboo identity of NHT. Pairs with the grain + bamboo gradient set
      // in globals.css ([data-tenant="nguyen-huy-tuong"]).
      light: {
        primary: "oklch(0.58 0.118 178)",
        primaryForeground: "oklch(0.985 0 0)",
      },
      dark: {
        primary: "oklch(0.78 0.14 178)",
        primaryForeground: "oklch(0.205 0 0)",
      },
      // Modern, Vietnamese-first display face (Be Vietnam Pro, loaded in layout).
      display:
        "var(--font-be-vietnam-pro), var(--font-sans), ui-sans-serif, system-ui, sans-serif",
    }),
  },
  "nguyen-van-huyen": {
    code: "nguyen-van-huyen",
    name: "Trường THCS Nguyễn Văn Huyên, Sơn Đồng, Hà Nội",
    shortName: "NVH",
    logoUrl: "/tenants/nguyen-van-huyen/nvh-logo-cutout.png",
    theme: tenantTheme({
      // Jade ("xanh ngọc bích", hue ~172 — a cool, slightly blue jade to set it
      // apart from NHT's warmer bamboo green). Pairs with the polished-gem
      // gradient + specular "ngọc sáng" sheen set in globals.css
      // ([data-tenant="nguyen-van-huyen"]).
      light: {
        primary: "oklch(0.52 0.13 172)",
        primaryForeground: "oklch(0.985 0 0)",
      },
      dark: {
        primary: "oklch(0.74 0.13 174)",
        primaryForeground: "oklch(0.205 0 0)",
      },
      // Modern editorial serif (Fraunces) for prominent names — the "tài liệu
      // chính luận" feel for this heritage school named after GS-TS Nguyễn Văn
      // Huyên, but contemporary (high-contrast, optical display cut).
      display: "var(--font-fraunces), ui-serif, Georgia, 'Times New Roman', serif",
    }),
  },
  "nguyen-gia-thieu": {
    code: "nguyen-gia-thieu",
    name: "Trường THCS Nguyễn Gia Thiều, Phúc Lợi, Hà Nội",
    shortName: "NGT",
    logoUrl: null,
    description:
      "TUYỂN SINH TRỰC TUYẾN TRƯỜNG THCS NGUYỄN GIA THIỀU NĂM HỌC 2026 - 2027. " +
      "Nộp trực tuyến: 7h00 ngày 03/6/2026 đến 24h00 ngày 08/6/2026. " +
      "Kiểm tra đánh giá năng lực: Sáng 14/6/2026.",
    theme: tenantTheme({
      // Tailwind amber-700 / amber-400 in oklch, gold for a heritage school.
      light: {
        primary: "oklch(0.555 0.163 48.998)",
        primaryForeground: "oklch(0.985 0 0)",
      },
      dark: {
        primary: "oklch(0.828 0.189 84.429)",
        primaryForeground: "oklch(0.205 0 0)",
      },
    }),
  },
};

export const DEFAULT_BRANDING: TenantBranding = {
  code: "default",
  name: "Ghi Danh",
  shortName: "Ghi Danh",
  logoUrl: null,
  theme: DEFAULT_TENANT_THEME,
};
