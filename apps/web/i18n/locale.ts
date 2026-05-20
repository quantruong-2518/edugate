// Pure locale constants — safe to import from client components. The
// server-only cookie reader lives in request.ts (it pulls next/headers).
//
// Phase 1 ships VI + EN. Locale is persisted in a cookie (not the URL) so the
// tenant resolver middleware (subdomain + /t/:code) stays untouched — see
// ADR-008. Adding a locale later is just one more entry here + its messages.
export const LOCALES = ["vi", "en"] as const;

export type AppLocale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: AppLocale = "vi";

export const LOCALE_COOKIE = "EDUGATE_LOCALE";

export function isAppLocale(value: unknown): value is AppLocale {
  return (
    typeof value === "string" && (LOCALES as readonly string[]).includes(value)
  );
}
