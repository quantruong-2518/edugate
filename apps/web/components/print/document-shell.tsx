import type { ReactNode } from "react";
import { useTranslations } from "next-intl";

import type { TenantBranding } from "@shared/branding";

/**
 * Printable A4 document frame, shared by the application profile and the
 * receipt. Pha 1: rendered client-side and printed via `window.print()`.
 * Pha 2: a NestJS worker loads this same `/track/[code]/print` route with
 * Puppeteer to produce the stored/emailed PDF — so the template stays the
 * single source of truth (see ADR-009).
 *
 * Colors here are deliberately NOT tenant tokens for the paper surface
 * (white bg + neutral ink) — a document must print legibly regardless of the
 * tenant's light/dark theme, the same reasoning as the hardcoded state-tone
 * palette (task 8). Brand accent still flows through `text-primary` so the
 * school's color shows on the header.
 */

const PRINTED_AT_FORMATTER = new Intl.DateTimeFormat("vi-VN", {
  dateStyle: "medium",
  timeStyle: "short",
});

export function DocumentShell({
  branding,
  title,
  code,
  children,
}: {
  branding: TenantBranding;
  title: string;
  code: string;
  children: ReactNode;
}) {
  const t = useTranslations("print");

  return (
    <div className="print-document mx-auto my-8 w-full max-w-[210mm] bg-white p-10 text-neutral-900 shadow-sm print:my-0 print:max-w-none print:p-0 print:shadow-none">
      <header className="flex items-start justify-between gap-4 border-b border-neutral-200 pb-4">
        <div className="flex items-center gap-3">
          {branding.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- print doc uses a raw img, no Next optimization needed
            <img src={branding.logoUrl} alt="" className="h-11 w-auto" />
          ) : (
            <span className="grid size-11 place-items-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
              {branding.shortName.slice(0, 3)}
            </span>
          )}
          <div>
            <p className="text-base font-semibold leading-tight">
              {branding.name}
            </p>
            <p className="text-xs text-neutral-500">{title}</p>
          </div>
        </div>
        <p className="shrink-0 font-mono text-sm font-bold tracking-wider text-primary">
          {code}
        </p>
      </header>

      <main className="space-y-7 py-6">{children}</main>

      <footer className="border-t border-neutral-200 pt-3 text-[11px] text-neutral-400">
        {t("printedAt", { date: PRINTED_AT_FORMATTER.format(new Date()) })} ·{" "}
        {branding.name}
      </footer>
    </div>
  );
}

/** A titled block inside a document. */
export function DocSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
        {title}
      </h2>
      {children}
    </section>
  );
}

/** A label / value definition row. */
export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs text-neutral-500">{label}</dt>
      <dd className="text-sm font-medium text-neutral-900">{children}</dd>
    </div>
  );
}
