"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import type { Application } from "@shared/admission";
import { StateBadge, StateTimeline } from "@ui/components/admission";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@ui/components/card";
import { Skeleton } from "@ui/components/skeleton";

import { getApplicationByCode } from "@/lib/api/admission";

type LoadState =
  | { status: "loading" }
  | { status: "found"; application: Application }
  | { status: "not-found" };

export default function TrackDetailPage() {
  const t = useTranslations("track");
  const params = useParams<{ code: string }>();
  const code = decodeURIComponent(params.code ?? "");
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    let active = true;
    setState({ status: "loading" });
    getApplicationByCode(code).then((application) => {
      if (!active) return;
      setState(
        application ? { status: "found", application } : { status: "not-found" },
      );
    });
    return () => {
      active = false;
    };
  }, [code]);

  return (
    <main className="container mx-auto px-4 py-10">
      <Card className="mx-auto w-full max-w-2xl">
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle className="font-mono text-base tracking-wider">
            {code}
          </CardTitle>
          {state.status === "found" && (
            <StateBadge state={state.application.state} />
          )}
        </CardHeader>
        <CardContent>
          {state.status === "loading" && (
            <div className="space-y-3">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-20 w-full" />
            </div>
          )}
          {state.status === "not-found" && (
            <div className="py-6 text-center">
              <p className="font-medium">{t("notFound.title")}</p>
              <p className="text-sm text-muted-foreground">
                {t("notFound.description")}
              </p>
            </div>
          )}
          {state.status === "found" && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">
                {t("timeline.title")}
              </h3>
              <StateTimeline
                history={state.application.history.map((entry) => ({
                  state: entry.state,
                  at: entry.at,
                  reason: entry.note,
                }))}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
