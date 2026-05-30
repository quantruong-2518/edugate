import { GraduationCap } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { LocaleSwitcher } from "@/components/i18n/locale-switcher";
import { Button } from "@ui/components/button";

import { CONTACT_HREF, DEMO_PATH } from "./constants";

export async function MarketingHeader() {
  const t = await getTranslations("marketing.nav");

  return (
    <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href={"/" as Route} className="flex items-center gap-2 font-semibold">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <GraduationCap className="size-5" />
          </span>
          Ghi Danh
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
          <a href="#features" className="transition-colors hover:text-foreground">
            {t("features")}
          </a>
          <a href="#modules" className="transition-colors hover:text-foreground">
            {t("modules")}
          </a>
          <Link
            href={DEMO_PATH as Route}
            className="transition-colors hover:text-foreground"
          >
            {t("demo")}
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <LocaleSwitcher />
          <Button asChild size="sm">
            <a href={CONTACT_HREF}>{t("tryFree")}</a>
          </Button>
        </div>
      </div>
    </header>
  );
}
