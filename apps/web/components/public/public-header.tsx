import { GraduationCap } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { getTenantBranding, getTenantCode } from "@/lib/tenants/branding";

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

  const [branding, t] = await Promise.all([
    getTenantBranding(code),
    getTranslations("common.nav"),
  ]);

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70 print:hidden">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href={"/" as Route}
          className="flex min-w-0 items-center gap-2.5"
        >
          <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-primary text-primary-foreground">
            {branding.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={branding.logoUrl}
                alt=""
                className="size-full object-cover"
              />
            ) : (
              <GraduationCap className="size-5" aria-hidden />
            )}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-xs text-muted-foreground leading-tight">
              Trang tuyển sinh chính thức của:
            </span>
            <span className="block truncate text-sm font-semibold leading-tight">
              {branding.name}
            </span>
          </span>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          <Link
            href={"/register" as Route}
            className="rounded-md px-2.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:px-3"
          >
            {t("register")}
          </Link>
          <Link
            href={"/track" as Route}
            className="rounded-md px-2.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:px-3"
          >
            {t("track")}
          </Link>
        </nav>
      </div>
    </header>
  );
}
