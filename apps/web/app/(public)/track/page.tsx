"use client";

import type { Route } from "next";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@ui/components/button";
import { Card, CardContent } from "@ui/components/card";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";

export default function TrackIndexPage() {
  const t = useTranslations("track");
  const router = useRouter();
  const pathname = usePathname();
  const [code, setCode] = useState("");

  // Preserve `/t/:code/` when the tenant came from the path so the resulting
  // URL stays shareable — otherwise this page is reached via `/t/:code/track`
  // but pushes to a bare `/track/CODE`, dropping the prefix.
  const tenantMatch = pathname.match(/^(\/t\/[^/]+)\//);
  const prefix = tenantMatch?.[1] ?? "";

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = code.trim().toUpperCase();
    if (trimmed) router.push(`${prefix}/track/${trimmed}` as Route);
  };

  return (
    <main className="mx-auto max-w-md px-4 py-16 sm:py-24">
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {t("title")}
        </h1>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
          {t("subtitle")}
        </p>
      </div>
      <Card className="mt-8">
        <CardContent className="p-6">
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">{t("codeLabel")}</Label>
              <Input
                id="code"
                placeholder={t("codePlaceholder")}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                autoComplete="off"
                className="text-center text-base font-medium uppercase tracking-wider"
              />
            </div>
            <Button type="submit" className="w-full" disabled={!code.trim()}>
              {t("search")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
