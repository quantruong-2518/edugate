"use client";

import { Check, Globe } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { Button } from "@ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@ui/components/dropdown-menu";

import { setUserLocale } from "@/i18n/locale-actions";
import { LOCALES, type AppLocale } from "@/i18n/locale";

export function LocaleSwitcher() {
  const t = useTranslations("common.language");
  const active = useLocale() as AppLocale;
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function select(locale: AppLocale) {
    if (locale === active) return;
    startTransition(async () => {
      await setUserLocale(locale);
      // Re-render server components with the new cookie-derived messages.
      router.refresh();
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={t("label")}
          className="relative"
          disabled={isPending}
        >
          <Globe className="size-4" />
          <span className="absolute -bottom-0.5 -right-0.5 rounded bg-muted px-1 text-[9px] font-semibold uppercase">
            {active}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {LOCALES.map((locale) => (
          <DropdownMenuItem key={locale} onSelect={() => select(locale)}>
            {t(locale)}
            {locale === active && <Check className="ml-auto size-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
