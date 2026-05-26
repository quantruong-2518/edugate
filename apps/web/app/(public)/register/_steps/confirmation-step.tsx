"use client";

import type { Route } from "next";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { CheckCircle2, Clock, Receipt } from "lucide-react";

import { Button } from "@ui/components/button";

import { useApplication } from "@/lib/api/queries";

export function ConfirmationStep({ code }: { code: string }) {
  const t = useTranslations("apply.confirmation");
  const tPrint = useTranslations("print");
  const { data: application } = useApplication(code);
  const parentName = application?.applicant.fullName;

  return (
    <div className="flex flex-col items-center gap-5 py-2 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
        <CheckCircle2 className="size-9" aria-hidden />
      </span>

      <div className="space-y-2">
        <h2 className="text-xl font-semibold tracking-tight">
          {parentName
            ? t("greeting", { name: parentName })
            : t("greetingNoName")}
        </h2>
        <p className="mx-auto max-w-md text-sm text-muted-foreground">
          {t("await")}
        </p>
      </div>

      <div className="w-full max-w-xs rounded-xl border bg-muted/40 p-4">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          {t("codeLabel")}
        </p>
        <p className="mt-1 font-mono text-3xl font-bold tracking-[0.2em] text-primary">
          {code}
        </p>
      </div>

      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Clock className="size-3.5" aria-hidden />
        {t("trackHint")}
      </p>

      <div className="flex w-full max-w-xs flex-col gap-2 sm:max-w-md sm:flex-row sm:justify-center">
        <Button size="lg" className="sm:flex-1" asChild>
          <Link href={`/track/${code}` as Route}>{t("trackCta")}</Link>
        </Button>
        <Button size="lg" variant="outline" className="sm:flex-1" asChild>
          <Link
            href={`/track/${code}/print?doc=receipt` as Route}
            target="_blank"
          >
            <Receipt className="size-4" aria-hidden />
            {tPrint("download.receipt")}
          </Link>
        </Button>
      </div>
    </div>
  );
}
