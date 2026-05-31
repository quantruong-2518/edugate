"use client";

import { FileSearch } from "lucide-react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { StateBadge, StateTimeline } from "@ui/components/admission";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@ui/components/card";
import { EmptyState } from "@ui/components/empty-state";
import { ErrorState } from "@ui/components/error-state";
import { Skeleton } from "@ui/components/skeleton";

import { useApplication } from "@/lib/api/queries";

export default function TrackDetailPage() {
  const t = useTranslations("track");
  const tErrors = useTranslations("errors");
  const params = useParams<{ code: string }>();
  const code = decodeURIComponent(params.code ?? "");
  const { data: application, isPending, isError, refetch } =
    useApplication(code);
  const notFound = !isPending && !isError && !application;

  return (
    <main className="container mx-auto px-4 py-12 sm:px-6 sm:py-16">
      <Card className="mx-auto w-full max-w-2xl">
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle className="text-base tracking-wider">
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
          {isError && (
            <ErrorState
              title={tErrors("generic.title")}
              description={tErrors("generic.description")}
              retryLabel={tErrors("retry")}
              onRetry={() => void refetch()}
              className="py-6"
            />
          )}
          {notFound && (
            <EmptyState
              icon={FileSearch}
              title={t("notFound.title")}
              description={t("notFound.description")}
              className="py-6"
            />
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
