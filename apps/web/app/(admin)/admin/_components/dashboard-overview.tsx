"use client";

import {
  CheckCircle2,
  ClipboardList,
  Clock,
  FileWarning,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import type { Route } from "next";
import { useTranslations } from "next-intl";

import {
  APPLICATION_STATES,
  APPLICATION_STATE_CODES,
} from "@shared/admission";
import { StateBadge, TONE_DOT_CLASS } from "@ui/components/admission";
import { Button } from "@ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@ui/components/card";
import { Skeleton } from "@ui/components/skeleton";
import { cn } from "@ui/lib/utils";

import { studentNameOf } from "@/lib/api";
import {
  useApplicationAnalytics,
  useApplications,
} from "@/lib/api/queries";

const SHORT_DATE = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
});

function StatCard({
  label,
  value,
  Icon,
  loading,
}: {
  label: string;
  value: number;
  Icon: LucideIcon;
  loading: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <CardDescription>{label}</CardDescription>
        <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-[18px]" aria-hidden />
        </span>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-9 w-16" />
        ) : (
          <p className="text-3xl font-semibold tracking-tight">{value}</p>
        )}
      </CardContent>
    </Card>
  );
}

export function DashboardOverview({ tenantCode }: { tenantCode: string }) {
  const t = useTranslations("admin.dashboard");
  const { data, isPending } = useApplicationAnalytics(tenantCode);
  const recent = useApplications({
    tenantCode,
    sort: "createdAt:desc",
    page: 1,
    pageSize: 5,
  });

  const byState = data?.byState;
  const total = data?.total ?? 0;
  const maxSeries = Math.max(1, ...(data?.series.map((p) => p.count) ?? [0]));
  const maxFunnel = data?.funnel[0]?.count ?? 1;

  // States that actually occur, ordered by the canonical state list, for the
  // distribution breakdown.
  const distribution = APPLICATION_STATE_CODES.map((code) => ({
    code,
    count: byState?.[code] ?? 0,
  })).filter((d) => d.count > 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={t("stats.today")}
          value={data?.todaySubmissions ?? 0}
          Icon={ClipboardList}
          loading={isPending}
        />
        <StatCard
          label={t("stats.inReview")}
          value={byState?.UNDER_REVIEW ?? 0}
          Icon={Clock}
          loading={isPending}
        />
        <StatCard
          label={t("stats.needsInfo")}
          value={byState?.NEEDS_INFO ?? 0}
          Icon={FileWarning}
          loading={isPending}
        />
        <StatCard
          label={t("stats.approved")}
          value={byState?.APPROVED ?? 0}
          Icon={CheckCircle2}
          loading={isPending}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Submissions-over-time mini chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t("trend.title")}</CardTitle>
            <CardDescription>{t("trend.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            {isPending ? (
              <Skeleton className="h-40 w-full" />
            ) : data && data.series.some((p) => p.count > 0) ? (
              <div
                className="flex h-40 items-end gap-1"
                role="img"
                aria-label={t("trend.title")}
              >
                {data.series.map((point) => (
                  <div
                    key={point.date}
                    className="group flex flex-1 flex-col items-center justify-end gap-1"
                  >
                    <span className="text-[10px] font-medium text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
                      {point.count}
                    </span>
                    <div
                      className="w-full rounded-t bg-primary/80 transition-colors group-hover:bg-primary"
                      style={{
                        height: `${Math.max(4, (point.count / maxSeries) * 100)}%`,
                      }}
                      title={`${point.date}: ${point.count}`}
                    />
                    <span className="text-[9px] text-muted-foreground">
                      {SHORT_DATE.format(new Date(point.date))}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-12 text-center text-sm text-muted-foreground">
                {t("trend.empty")}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Status distribution */}
        <Card>
          <CardHeader>
            <CardTitle>{t("distribution.title")}</CardTitle>
            <CardDescription>{t("distribution.description")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {isPending &&
              Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={`dist-skeleton-${i}`} className="h-4 w-full" />
              ))}
            {!isPending &&
              distribution.map(({ code, count }) => {
                const meta = APPLICATION_STATES[code]!;
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                  <div key={code} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-foreground">
                        <span
                          className={cn(
                            "size-2 rounded-full",
                            TONE_DOT_CLASS[meta.tone]!,
                          )}
                          aria-hidden
                        />
                        {meta.label}
                      </span>
                      <span className="tabular-nums text-muted-foreground">
                        {count} · {pct}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn("h-full rounded-full", TONE_DOT_CLASS[meta.tone]!)}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Funnel */}
        <Card>
          <CardHeader>
            <CardTitle>{t("funnel.title")}</CardTitle>
            <CardDescription>{t("funnel.description")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {isPending &&
              Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={`funnel-skeleton-${i}`} className="h-6 w-full" />
              ))}
            {!isPending &&
              data?.funnel.map((step) => {
                const meta = APPLICATION_STATES[step.state]!;
                const width =
                  maxFunnel > 0 ? Math.round((step.count / maxFunnel) * 100) : 0;
                return (
                  <div key={step.state} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-foreground">{meta.label}</span>
                      <span className="tabular-nums text-muted-foreground">
                        {step.count}
                      </span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-md bg-muted">
                      <div
                        className="h-full rounded-md bg-primary"
                        style={{ width: `${Math.max(4, width)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </CardContent>
        </Card>

        {/* Recent applications */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-start justify-between gap-2 space-y-0">
            <div className="space-y-1.5">
              <CardTitle>{t("recent.title")}</CardTitle>
              <CardDescription>{t("recent.description")}</CardDescription>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href={"/admin/applications" as Route}>{t("viewAll")}</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <ul className="divide-y">
              {recent.isPending &&
                Array.from({ length: 5 }).map((_, i) => (
                  <li key={`recent-skeleton-${i}`} className="py-2.5">
                    <Skeleton className="h-5 w-full" />
                  </li>
                ))}
              {!recent.isPending &&
                recent.data?.items.map((app) => (
                  <li
                    key={app.code}
                    className="flex items-center justify-between gap-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {studentNameOf(app)}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {app.code} · {app.applicant.fullName}
                      </p>
                    </div>
                    <StateBadge state={app.state} />
                  </li>
                ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
