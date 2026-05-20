import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";

import { DEFAULT_LOCALE, isAppLocale, LOCALE_COOKIE } from "./locale";

// No locale routing (ADR-008): the active locale comes from a cookie, not a
// URL prefix, so the tenant resolver middleware stays untouched. Defaults to
// VI when the cookie is absent or invalid.
export default getRequestConfig(async () => {
  const cookieLocale = (await cookies()).get(LOCALE_COOKIE)?.value;
  const locale = isAppLocale(cookieLocale) ? cookieLocale : DEFAULT_LOCALE;

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
