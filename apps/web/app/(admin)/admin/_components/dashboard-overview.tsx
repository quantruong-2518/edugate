"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  APPLICATION_STATES,
  APPLICATION_STATE_CODES,
} from "@shared/admission";
import { TONE_DOT_CLASS, TONE_HEX } from "@ui/components/admission";
import { Button } from "@ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@ui/components/card";
import { Input } from "@ui/components/input";
import { Skeleton } from "@ui/components/skeleton";
import { cn } from "@ui/lib/utils";

import type { AnalyticsRange } from "@/lib/api";
import { useApplicationAnalytics } from "@/lib/api/queries";

const DAY_MS = 86_400_000;

type Preset = "all" | "30" | "90" | "custom";

const PRESET_DAYS: Record<Exclude<Preset, "all" | "custom">, number> = {
  "30": 30,
  "90": 90,
};

/** Today (UTC `yyyy-mm-dd`) — fallback anchor before analytics resolves. */
function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Shift an ISO day key by N days (tz-safe via UTC). */
function shiftKey(key: string, days: number): string {
  return new Date(Date.parse(`${key}T00:00:00.000Z`) + days * DAY_MS)
    .toISOString()
    .slice(0, 10);
}

/** Format `yyyy-mm-dd` → `dd/mm` (or `dd/mm/yyyy`) without tz drift. */
function formatDay(key: string, withYear = false): string {
  const [y, m, d] = key.split("-");
  return withYear ? `${d}/${m}/${y}` : `${d}/${m}`;
}

// --- Submissions-per-day area chart ----------------------------------------

/** Minimal shape of the props recharts hands to a custom Tooltip content. */
type TooltipContentProps = {
  active?: boolean;
  label?: string | number;
  payload?: { value?: number; payload?: unknown }[];
};

function SubmissionsTooltip({
  active,
  payload,
  label,
  unit,
}: TooltipContentProps & { unit: string }) {
  if (!active || !payload?.length) return null;
  const count = payload[0]?.value ?? 0;
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="font-medium text-popover-foreground">
        {formatDay(String(label), true)}
      </p>
      <p className="tabular-nums text-muted-foreground">
        {count} {unit}
      </p>
    </div>
  );
}

function SubmissionsChart({
  data,
  unit,
}: {
  data: { date: string; count: number }[];
  unit: string;
}) {
  return (
    <ResponsiveContainer width="100%" height="100%" minHeight={220}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <defs>
          <linearGradient id="submissionsFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--foreground)" stopOpacity={0.18} />
            <stop offset="100%" stopColor="var(--foreground)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid
          vertical={false}
          stroke="var(--border)"
          strokeDasharray="3 3"
        />
        <XAxis
          dataKey="date"
          tickFormatter={(v: string) => formatDay(v)}
          tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
          tickLine={false}
          axisLine={false}
          minTickGap={28}
        />
        <YAxis
          allowDecimals={false}
          width={40}
          tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
          content={<SubmissionsTooltip unit={unit} />}
        />
        <Area
          type="monotone"
          dataKey="count"
          stroke="var(--foreground)"
          strokeWidth={2}
          fill="url(#submissionsFill)"
          dot={false}
          activeDot={{
            r: 3,
            fill: "var(--foreground)",
            stroke: "var(--background)",
            strokeWidth: 2,
          }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// --- Status distribution donut ---------------------------------------------

type DistEntry = {
  code: (typeof APPLICATION_STATE_CODES)[number];
  label: string;
  tone: keyof typeof TONE_HEX;
  count: number;
  pct: number;
};

function StatusDonut({
  distribution,
  total,
  totalLabel,
}: {
  distribution: DistEntry[];
  total: number;
  totalLabel: string;
}) {
  return (
    <div className="relative h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0]?.payload as DistEntry | undefined;
              if (!d) return null;
              return (
                <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-md">
                  <p className="font-medium text-popover-foreground">{d.label}</p>
                  <p className="tabular-nums text-muted-foreground">
                    {d.count} · {d.pct}%
                  </p>
                </div>
              );
            }}
          />
          <Pie
            data={distribution}
            dataKey="count"
            nameKey="label"
            innerRadius="62%"
            outerRadius="92%"
            paddingAngle={2}
            stroke="var(--card)"
            strokeWidth={2}
          >
            {distribution.map((d) => (
              <Cell key={d.code} fill={TONE_HEX[d.tone]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-semibold tabular-nums tracking-tight">
          {total}
        </span>
        <span className="text-xs text-muted-foreground">{totalLabel}</span>
      </div>
    </div>
  );
}

// --- Date range controls ----------------------------------------------------

function RangeControls({
  preset,
  range,
  resolved,
  onPreset,
  onCustom,
}: {
  preset: Preset;
  range: AnalyticsRange;
  resolved: { from: string; to: string } | undefined;
  onPreset: (p: Exclude<Preset, "custom">) => void;
  onCustom: (next: AnalyticsRange) => void;
}) {
  const t = useTranslations("admin.dashboard.range");

  const PRESETS: { id: Exclude<Preset, "custom">; label: string }[] = [
    { id: "all", label: t("all") },
    { id: "30", label: t("last30") },
    { id: "90", label: t("last90") },
  ];

  return (
    <div className="flex shrink-0 flex-col gap-3 rounded-xl border bg-card p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-medium">{t("label")}</span>
        {resolved && (
          <span className="text-xs text-muted-foreground tabular-nums">
            {formatDay(resolved.from, true)} → {formatDay(resolved.to, true)}
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-lg border p-0.5">
          {PRESETS.map((p) => (
            <Button
              key={p.id}
              type="button"
              size="sm"
              variant={preset === p.id ? "secondary" : "ghost"}
              className="h-7 px-3 text-xs"
              onClick={() => onPreset(p.id)}
            >
              {p.label}
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          <Input
            type="date"
            aria-label={t("from")}
            value={range.from ?? ""}
            max={range.to ?? resolved?.to}
            onChange={(e) =>
              onCustom({ ...range, from: e.target.value || undefined })
            }
            className="h-8 w-[9.5rem] text-xs"
          />
          <span className="text-xs text-muted-foreground">→</span>
          <Input
            type="date"
            aria-label={t("to")}
            value={range.to ?? ""}
            min={range.from}
            onChange={(e) =>
              onCustom({ ...range, to: e.target.value || undefined })
            }
            className="h-8 w-[9.5rem] text-xs"
          />
        </div>
      </div>
    </div>
  );
}

// --- Dashboard --------------------------------------------------------------

export function DashboardOverview({ tenantCode }: { tenantCode: string }) {
  const t = useTranslations("admin.dashboard");
  const [preset, setPreset] = useState<Preset>("all");
  const [range, setRange] = useState<AnalyticsRange>({});

  const { data, isPending } = useApplicationAnalytics(tenantCode, range);

  const total = data?.total ?? 0;
  const hasSubmissions = data?.series.some((p) => p.count > 0) ?? false;

  const distribution: DistEntry[] = APPLICATION_STATE_CODES.map((code) => {
    const meta = APPLICATION_STATES[code]!;
    const count = data?.byState[code] ?? 0;
    return {
      code,
      label: meta.label,
      tone: meta.tone,
      count,
      pct: total > 0 ? Math.round((count / total) * 100) : 0,
    };
  }).filter((d) => d.count > 0);

  function applyPreset(p: Exclude<Preset, "custom">) {
    setPreset(p);
    if (p === "all") {
      setRange({});
      return;
    }
    const anchor = data?.range.to ?? todayKey();
    setRange({ from: shiftKey(anchor, -(PRESET_DAYS[p] - 1)), to: anchor });
  }

  function applyCustom(next: AnalyticsRange) {
    setPreset("custom");
    setRange(next);
  }

  return (
    <div className="flex flex-col gap-4">
      <RangeControls
        preset={preset}
        range={range}
        resolved={data?.range}
        onPreset={applyPreset}
        onCustom={applyCustom}
      />

      {/* Row 1 — submissions per day, 16:9 */}
      <Card className="flex aspect-[16/9] flex-col">
        <CardHeader className="shrink-0 pb-3">
          <CardTitle className="text-base">{t("trend.title")}</CardTitle>
          <CardDescription>{t("trend.description")}</CardDescription>
        </CardHeader>
        <CardContent className="min-h-0 flex-1 pb-5">
          {isPending ? (
            <Skeleton className="size-full" />
          ) : hasSubmissions && data ? (
            <SubmissionsChart data={data.series} unit={t("trend.unit")} />
          ) : (
            <div className="flex h-full items-center justify-center text-center text-sm text-muted-foreground">
              {t("trend.empty")}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Row 2 — status breakdown (donut + two legend columns), 16:9 */}
      <Card className="flex aspect-[16/9] flex-col">
        <CardHeader className="shrink-0 pb-3">
          <CardTitle className="text-base">{t("distribution.title")}</CardTitle>
          <CardDescription>{t("distribution.description")}</CardDescription>
        </CardHeader>
        <CardContent className="flex min-h-0 flex-1 items-center justify-center gap-8 pb-6 lg:gap-12">
          {isPending ? (
            <>
              <Skeleton className="aspect-square h-full max-h-[260px] shrink-0 rounded-full" />
              <div className="grid w-full max-w-xl flex-1 grid-cols-2 gap-x-10 gap-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={`legend-skeleton-${i}`} className="h-4 w-full" />
                ))}
              </div>
            </>
          ) : total > 0 ? (
            <>
              <div className="aspect-square h-full max-h-[280px] shrink-0">
                <StatusDonut
                  distribution={distribution}
                  total={total}
                  totalLabel={t("distribution.total")}
                />
              </div>
              <ul className="grid w-full max-w-xl flex-1 grid-cols-2 gap-x-10 gap-y-3 self-center">
                {distribution.map((d) => (
                  <li
                    key={d.code}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <span className="flex min-w-0 items-center gap-2.5">
                      <span
                        className={cn(
                          "size-2.5 shrink-0 rounded-full",
                          TONE_DOT_CLASS[d.tone],
                        )}
                        aria-hidden
                      />
                      <span className="truncate text-foreground">{d.label}</span>
                    </span>
                    <span className="shrink-0 tabular-nums text-muted-foreground">
                      {d.count} · {d.pct}%
                    </span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <div className="flex h-full w-full items-center justify-center text-center text-sm text-muted-foreground">
              {t("distribution.empty")}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
