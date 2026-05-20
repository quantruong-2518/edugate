"use client";

import { useTranslations } from "next-intl";

import { ErrorState } from "@ui/components/error-state";

// Route-level error boundary. Rendered inside the root layout, so the
// providers (incl. NextIntlClientProvider) are still mounted and i18n works.
// global-error.tsx handles the rarer case where the root layout itself throws.
export default function RouteError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("errors");
  return (
    <main className="grid min-h-dvh place-items-center px-6">
      <ErrorState
        title={t("generic.title")}
        description={t("generic.description")}
        retryLabel={t("retry")}
        onRetry={reset}
      />
    </main>
  );
}
