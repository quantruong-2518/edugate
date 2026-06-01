import { GraduationCap } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";

import { getTenantBranding, getTenantCode } from "@/lib/tenants/branding";
import { getTenantHrefPrefix, tenantHref } from "@/lib/tenants/href";

/**
 * Slim per-tenant header for the applicant journey (landing, register, track).
 * Keeps the school's identity present after the visitor leaves the landing
 * hero, so the flow never drops to an unbranded form mid-way. One line, 64px
 * tall (tasteskill nav rule). Renders nothing on the root marketing site, which
 * has its own header.
 */
export async function PublicHeader() {
  const code = await getTenantCode();
  if (!code) return null;

  const branding = await getTenantBranding(code);
  const prefix = await getTenantHrefPrefix();

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70 print:hidden">
      <div className="mx-auto flex h-16 max-w-6xl items-center px-4 sm:px-6">
        <Link
          href={tenantHref("/", prefix) as Route}
          className="flex min-w-0 items-center gap-2.5"
        >
          {branding.logoUrl ? (
            // Bare logo image — no chip/border, sits straight on the header.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={branding.logoUrl}
              alt=""
              className="h-10 w-auto shrink-0 object-contain"
            />
          ) : (
            <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-primary text-primary-foreground">
              <GraduationCap className="size-5" aria-hidden />
            </span>
          )}
          <span className="min-w-0">
            <span className="block truncate text-xs text-muted-foreground leading-tight">
              Trang tuyển sinh chính thức của:
            </span>
            <span className="block truncate text-sm font-semibold leading-tight">
              {branding.name}
            </span>
          </span>
        </Link>
      </div>
    </header>
  );
}
