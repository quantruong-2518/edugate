"use server";

import { cookies } from "next/headers";

import { isAppLocale, LOCALE_COOKIE, type AppLocale } from "./locale";

/**
 * Persist the chosen locale in a long-lived cookie. The client switcher calls
 * this then `router.refresh()` to re-render server components with the new
 * messages. No URL routing involved (ADR-008).
 */
export async function setUserLocale(locale: AppLocale): Promise<void> {
  if (!isAppLocale(locale)) return;
  const store = await cookies();
  store.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1 year
    sameSite: "lax",
  });
}
