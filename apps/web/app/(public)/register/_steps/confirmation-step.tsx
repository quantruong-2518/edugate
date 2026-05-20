"use client";

import type { Route } from "next";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { CheckCircle2 } from "lucide-react";

import { Button } from "@ui/components/button";

export function ConfirmationStep({ code }: { code: string }) {
  const t = useTranslations("apply.confirmation");

  return (
    <div className="flex flex-col items-center gap-5 py-4 text-center">
      <CheckCircle2 className="size-12 text-primary" aria-hidden />
      <h3 className="text-lg font-semibold">{t("title")}</h3>
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">{t("codeLabel")}</p>
        <p className="font-mono text-2xl font-bold tracking-wider text-primary">
          {code}
        </p>
      </div>
      <p className="text-sm text-muted-foreground">{t("trackHint")}</p>
      <Button asChild>
        <Link href={`/track/${code}` as Route}>{t("trackCta")}</Link>
      </Button>
    </div>
  );
}
