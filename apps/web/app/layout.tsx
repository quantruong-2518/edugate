import type { Metadata } from "next";
import { Inter } from "next/font/google";
import type { ReactNode } from "react";

import { tenantThemeToCss } from "@shared/theme";
import { Toaster } from "@ui/components/sonner";

import { getTenantBranding, getTenantCode } from "@/lib/tenants/branding";

import "./globals.css";

const fontSans = Inter({
  subsets: ["latin", "vietnamese"],
  display: "swap",
  variable: "--font-sans",
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

  return (
    <html lang="vi" suppressHydrationWarning className={fontSans.variable}>
      <body className="min-h-dvh font-sans antialiased">
        {/*
          Per-tenant token override. React 19 hoists this <style> into <head>
          during SSR; placement after globals.css gives tenant tokens precedence.
          Content is built from server-controlled fixtures — no user input.
        */}
        <style
          id="tenant-theme"
          dangerouslySetInnerHTML={{ __html: themeCss }}
        />
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
