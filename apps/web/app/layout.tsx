import type { Metadata } from "next";
import { Be_Vietnam_Pro, Fraunces, Inter, Space_Grotesk } from "next/font/google";
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

export async function generateMetadata(): Promise<Metadata> {
  const branding = await getTenantBranding(await getTenantCode());
  return {
    title: {
      default: branding.name,
      template: `%s · ${branding.shortName}`,
    },
    description: "Nền tảng tuyển sinh đa tenant.",
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
