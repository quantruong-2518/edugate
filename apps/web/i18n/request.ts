import { getRequestConfig } from "next-intl/server";

// Fixed locale for Phase 1 — no locale routing (see ADR-008), so the tenant
// resolver middleware (subdomain + /t/:code) stays untouched. Task 14 adds the
// real EN messages + a locale switcher; this only wires the runtime.
export const DEFAULT_LOCALE = "vi" as const;

export type AppLocale = typeof DEFAULT_LOCALE;

export default getRequestConfig(async () => {
  const locale: AppLocale = DEFAULT_LOCALE;

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
