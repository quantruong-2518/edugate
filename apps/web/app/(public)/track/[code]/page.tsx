"use client";

import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { StateBadge, StateTimeline } from "@ui/components/admission";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@ui/components/card";
import { Skeleton } from "@ui/components/skeleton";

import { useApplication } from "@/lib/api/queries";

export default function TrackDetailPage() {
  const t = useTranslations("track");
  const params = useParams<{ code: string }>();
  const code = decodeURIComponent(params.code ?? "");
  const { data: application, isPending } = useApplication(code);
  const notFound = !isPending && !application;

  return (
    <main className="container mx-auto px-4 py-10">
      <Card className="mx-auto w-full max-w-2xl">
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle className="font-mono text-base tracking-wider">
            {code}
          </CardTitle>
          {application && <StateBadge state={application.state} />}
        </CardHeader>
        <CardContent>
          {isPending && (
            <div className="space-y-3">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-20 w-full" />
            </div>
          )}
          {notFound && (
            <div className="py-6 text-center">
              <p className="font-medium">{t("notFound.title")}</p>
              <p className="text-sm text-muted-foreground">
                {t("notFound.description")}
              </p>
            </div>
          )}
          {application && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">
                {t("timeline.title")}
              </h3>
              <StateTimeline
                history={application.history.map((entry) => ({
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
