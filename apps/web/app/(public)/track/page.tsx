"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@ui/components/card";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";

export default function TrackIndexPage() {
  const t = useTranslations("track");
  const router = useRouter();
  const [code, setCode] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = code.trim().toUpperCase();
    if (trimmed) router.push(`/track/${trimmed}` as Route);
  };

  return (
    <main className="container mx-auto px-4 py-10">
      <Card className="mx-auto w-full max-w-md">
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">{t("codeLabel")}</Label>
              <Input
                id="code"
                placeholder={t("codePlaceholder")}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                autoComplete="off"
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
