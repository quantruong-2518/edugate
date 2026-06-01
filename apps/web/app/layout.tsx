import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro, Fraunces, Inter, Space_Grotesk } from "next/font/google";
import { headers } from "next/headers";
import { NextIntlClientProvider } from "next-intl";
import { getLocale } from "next-intl/server";
import type { ReactNode } from "react";

import { tenantThemeToCss } from "@shared/theme";
import { Toaster } from "@ui/components/sonner";

import { QueryProvider } from "@/components/providers/query-provider";
import { getTenantBranding, getTenantCode } from "@/lib/tenants/branding";

import "./globals.css";

const fontSans = Inter({
  subsets: ["latin", "vietnamese"],
  display: "swap",
  variable: "--font-sans",
});

// Modern display grotesk, reserved for prominent names on the applicant surfaces.
const fontDisplay = Space_Grotesk({
  subsets: ["latin", "vietnamese"],
  display: "swap",
  variable: "--font-display",
});

// Per-tenant opt-in display face (Vietnamese-first, modern). A tenant theme
// points `font.display` at this variable; tenants that don't keep Space Grotesk.
const fontBrandDisplay = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["600", "700", "800"],
  display: "swap",
  variable: "--font-be-vietnam-pro",
});

// Per-tenant editorial serif (a modern "tài liệu chính luận" face). Fraunces is
// a contemporary high-contrast serif with optical sizing — at display sizes the
// browser's `font-optical-sizing: auto` picks its dramatic display cut. Variable
// font up to 900, so the heavy display utilities (800) render natively.
const fontEditorialDisplay = Fraunces({
  subsets: ["latin", "vietnamese"],
  display: "swap",
  variable: "--font-fraunces",
});

/**
 * Build a 32×32 SVG favicon painted in the tenant's primary token, with the
 * first letter of the short name centred on top. Kept inline (data URL) so we
 * never need a per-tenant asset on disk and the icon updates the moment a
 * tenant changes its theme. `style="fill: …"` (not the bare `fill=` attribute)
 * lets modern browsers resolve `oklch(…)` values inside SVG.
 */
function tenantFaviconDataUrl(primary: string, shortName: string): string {
  const letter = (shortName.trim().charAt(0) || "G").toUpperCase();
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">` +
    `<rect width="32" height="32" rx="7" style="fill:${primary}"/>` +
    `<text x="16" y="22" text-anchor="middle" font-family="system-ui,sans-serif" font-size="18" font-weight="700" fill="#fff">${letter}</text>` +
    `</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Resolve the canonical site origin for this request — used as `metadataBase`
 * so Next can turn relative URLs in `openGraph.images` / `alternates` into
 * absolute ones. Read from `x-forwarded-*` first (Caddy / Vercel terminate
 * TLS upstream and forward the original scheme + host), then plain `host`,
 * then the dev fallback. Falls back to a localhost URL rather than throwing
 * so a misconfigured proxy never crashes the layout.
 */
async function getRequestOrigin(): Promise<URL> {
  const h = await headers();
  const protocol =
    h.get("x-forwarded-proto") ??
    (process.env.NODE_ENV === "production" ? "https" : "http");
  const host =
    h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  try {
    return new URL(`${protocol}://${host}`);
  } catch {
    return new URL("http://localhost:3000");
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const [branding, origin, locale] = await Promise.all([
    getTenantBranding(await getTenantCode()),
    getRequestOrigin(),
    getLocale(),
  ]);
  const favicon = tenantFaviconDataUrl(
    branding.theme.light.primary,
    branding.shortName,
  );
  const description = `${branding.name} — cổng tuyển sinh trực tuyến. Nộp hồ sơ và tra cứu kết quả nhanh chóng, minh bạch.`;

  return {
    metadataBase: origin,
    applicationName: branding.name,
    title: {
      default: branding.name,
      template: `%s · ${branding.shortName}`,
    },
    description,
    keywords: [
      "tuyển sinh",
      "nộp hồ sơ trực tuyến",
      "tra cứu hồ sơ",
      branding.name,
      branding.shortName,
    ],
    authors: [{ name: branding.name }],
    creator: branding.name,
    publisher: branding.name,
    formatDetection: {
      telephone: false,
      email: false,
      address: false,
    },
    openGraph: {
      type: "website",
      siteName: branding.name,
      title: branding.name,
      description,
      url: origin.toString(),
      locale: locale === "vi" ? "vi_VN" : "en_US",
      // TODO: dynamic og:image via app/opengraph-image.tsx once we have an
      // OKLCH→RGB conversion (Satori in `next/og` doesn't parse oklch yet).
    },
    twitter: {
      card: "summary",
      title: branding.name,
      description,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    icons: {
      icon: [{ url: favicon, type: "image/svg+xml" }],
      shortcut: [{ url: favicon, type: "image/svg+xml" }],
      apple: [{ url: favicon, type: "image/svg+xml" }],
    },
  };
}

/**
 * Browser chrome tint (Android Chrome address bar, iOS status bar in PWA
 * mode). Painted with the tenant's primary token so the OS chrome matches
 * the in-app hero gradient. Next 14+ requires this in a separate `viewport`
 * export rather than `metadata`.
 */
export async function generateViewport(): Promise<Viewport> {
  const branding = await getTenantBranding(await getTenantCode());
  return {
    themeColor: branding.theme.light.primary,
    colorScheme: "light",
  };
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const branding = await getTenantBranding(await getTenantCode());
  const themeCss = tenantThemeToCss(branding.theme);
  const locale = await getLocale();

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${fontSans.variable} ${fontDisplay.variable} ${fontBrandDisplay.variable} ${fontEditorialDisplay.variable}`}
    >
      <body className="min-h-dvh font-sans antialiased" data-tenant={branding.code}>
        {/*
          Per-tenant token override. React 19 hoists this <style> into <head>
          during SSR; placement after globals.css gives tenant tokens precedence.
          Content is built from server-controlled fixtures — no user input.
        */}
        <style
          id="tenant-theme"
          dangerouslySetInnerHTML={{ __html: themeCss }}
        />
        <NextIntlClientProvider>
          <QueryProvider>
            {children}
            <Toaster richColors position="top-right" />
          </QueryProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
