"use client";

import { useEffect, useMemo, useState } from "react";
import { FileX2, Search, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import {
  type Application,
  type ApplicationState,
  type Transition,
} from "@shared/admission";
import type { FormSchema } from "@shared/form";
import { StateBadge } from "@ui/components/admission";
import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";
import { Card, CardContent } from "@ui/components/card";
import { EmptyState } from "@ui/components/empty-state";
import { ErrorState } from "@ui/components/error-state";
import { Input } from "@ui/components/input";
import { Label } from "@ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@ui/components/select";
import { Skeleton } from "@ui/components/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@ui/components/table";

import {
  applicationScore,
  studentNameOf,
  type ApplicationSort,
} from "@/lib/api";
import {
  useApplicationAnalytics,
  useApplications,
  useTransitionApplication,
} from "@/lib/api/queries";

import { ApplicationDetailSheet } from "./application-detail-sheet";
import { StateFilter } from "./state-filter";

const DATE_FORMATTER = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const PAGE_SIZES = [10, 20, 50] as const;
const SORT_OPTIONS: readonly ApplicationSort[] = [
  "createdAt:desc",
  "createdAt:asc",
  "score:desc",
  "score:asc",
];

const SORT_KEY: Record<ApplicationSort, string> = {
  "createdAt:desc": "createdAtDesc",
  "createdAt:asc": "createdAtAsc",
  "score:desc": "scoreDesc",
  "score:asc": "scoreAsc",
};

function StatPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border bg-card px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}

export function ApplicationsView({
  tenantCode,
  formSchema,
}: {
  tenantCode: string;
  formSchema: FormSchema | null;
}) {
  const t = useTranslations("admin.applications");
  const tFilters = useTranslations("admin.applications.filters");

  // Filter / query state
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [states, setStates] = useState<ApplicationState[]>([]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [scoreMin, setScoreMin] = useState("");
  const [scoreMax, setScoreMax] = useState("");
  const [sort, setSort] = useState<ApplicationSort>("createdAt:desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Detail sheet
  const [selected, setSelected] = useState<Application | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const transitionMutation = useTransitionApplication();
  const tCommon = useTranslations("common");

  // Debounce search input → reset to page 1 on change.
  useEffect(() => {
    const id = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(id);
  }, [searchInput]);

  // Reset to page 1 whenever any filter (other than page) changes.
  useEffect(() => {
    setPage(1);
  }, [states, dateFrom, dateTo, scoreMin, scoreMax, sort, pageSize]);

  const input = useMemo(
    () => ({
      tenantCode,
      search: search.trim() || undefined,
      states: states.length > 0 ? states : undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      scoreMin: scoreMin !== "" ? Number(scoreMin) : undefined,
      scoreMax: scoreMax !== "" ? Number(scoreMax) : undefined,
      sort,
      page,
      pageSize,
    }),
    [
      tenantCode,
      search,
      states,
      dateFrom,
      dateTo,
      scoreMin,
      scoreMax,
      sort,
      page,
      pageSize,
    ],
  );

  const { data, isPending, isError, refetch, isPlaceholderData } =
    useApplications(input);

  // Unfiltered counts for the quick-stat row come from the analytics endpoint
  // so the pills don't change when the user filters and we don't hit the
  // applications list pageSize cap (≤100 rows server-side).
  const baseline = useApplicationAnalytics(tenantCode);
  const baselineCounts = useMemo(() => {
    const byState = baseline.data?.byState;
    return {
      total: baseline.data?.total ?? 0,
      submitted: byState?.SUBMITTED ?? 0,
      underReview: byState?.UNDER_REVIEW ?? 0,
      needsInfo: byState?.NEEDS_INFO ?? 0,
      approved: byState?.APPROVED ?? 0,
    };
  }, [baseline.data]);

  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const rangeFrom = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeTo = Math.min(page * pageSize, total);

  const hasActiveFilters =
    search.trim() !== "" ||
    states.length > 0 ||
    dateFrom !== "" ||
    dateTo !== "" ||
    scoreMin !== "" ||
    scoreMax !== "";

  function clearAll() {
    setSearchInput("");
    setSearch("");
    setStates([]);
    setDateFrom("");
    setDateTo("");
    setScoreMin("");
    setScoreMax("");
  }

  function openDetail(app: Application) {
    setSelected(app);
    setSheetOpen(true);
  }

  // BE drives the transition (state machine + history + audit). On success
  // the `useTransitionApplication` hook patches the query cache; we mirror
  // the same update into the locally-selected app so the detail sheet's
  // timeline + StateActions buttons refresh without a refetch.
  async function handleTransition(
    app: Application,
    transition: Transition,
    reason: string | null,
  ) {
    try {
      const updated = await transitionMutation.mutateAsync({
        tenantCode,
        code: app.code,
        to: transition.to,
        reason,
      });
      setSelected(updated);
      toast.success(t("transitionSuccess"));
    } catch (err) {
      const message =
        err instanceof Error && err.message ? err.message : tCommon("genericError");
      toast.error(message);
      throw err;
    }
  }

  return (
    <div className="space-y-5">
      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        <StatPill label={t("stats.total")} value={baselineCounts.total} />
        <StatPill label={t("stats.submitted")} value={baselineCounts.submitted} />
        <StatPill
          label={t("stats.underReview")}
          value={baselineCounts.underReview}
        />
        <StatPill label={t("stats.needsInfo")} value={baselineCounts.needsInfo} />
        <StatPill label={t("stats.approved")} value={baselineCounts.approved} />
      </div>

      {/* Controls */}
      <Card>
        <CardContent className="space-y-3 p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder={t("searchPlaceholder")}
                aria-label={t("search")}
                className="pl-9"
              />
            </div>
            <StateFilter selected={states} onChange={setStates} />
            <Select
              value={sort}
              onValueChange={(v) => setSort(v as ApplicationSort)}
            >
              <SelectTrigger
                className="w-full sm:w-44"
                aria-label={t("sort.label")}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {t(`sort.${SORT_KEY[s]}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div className="space-y-1">
              <Label htmlFor="date-from" className="text-xs text-muted-foreground">
                {tFilters("dateFrom")}
              </Label>
              <Input
                id="date-from"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="date-to" className="text-xs text-muted-foreground">
                {tFilters("dateTo")}
              </Label>
              <Input
                id="date-to"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="score-min" className="text-xs text-muted-foreground">
                {tFilters("scoreMin")}
              </Label>
              <Input
                id="score-min"
                type="number"
                min={0}
                max={10}
                step={0.1}
                inputMode="decimal"
                value={scoreMin}
                onChange={(e) => setScoreMin(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="score-max" className="text-xs text-muted-foreground">
                {tFilters("scoreMax")}
              </Label>
              <Input
                id="score-max"
                type="number"
                min={0}
                max={10}
                step={0.1}
                inputMode="decimal"
                value={scoreMax}
                onChange={(e) => setScoreMax(e.target.value)}
              />
            </div>
          </div>

          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-xs text-muted-foreground">
                {tFilters("active")}:
              </span>
              {states.map((s) => (
                <FilterChip
                  key={s}
                  label={<StateBadge state={s} className="ring-0" />}
                  onClear={() => setStates(states.filter((x) => x !== s))}
                />
              ))}
              {dateFrom && (
                <FilterChip
                  label={`${tFilters("dateFrom")}: ${dateFrom}`}
                  onClear={() => setDateFrom("")}
                />
              )}
              {dateTo && (
                <FilterChip
                  label={`${tFilters("dateTo")}: ${dateTo}`}
                  onClear={() => setDateTo("")}
                />
              )}
              {scoreMin !== "" && (
                <FilterChip
                  label={`${tFilters("scoreMin")}: ${scoreMin}`}
                  onClear={() => setScoreMin("")}
                />
              )}
              {scoreMax !== "" && (
                <FilterChip
                  label={`${tFilters("scoreMax")}: ${scoreMax}`}
                  onClear={() => setScoreMax("")}
                />
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={clearAll}
              >
                {tFilters("clearAll")}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {isError ? (
        <ErrorState
          title={t("error.title")}
          description={t("error.description")}
          onRetry={() => void refetch()}
          className="py-12"
        />
      ) : !isPending && total === 0 ? (
        <EmptyState
          icon={FileX2}
          title={t("empty.title")}
          description={t("empty.description")}
          className="py-12"
          action={
            hasActiveFilters ? (
              <Button variant="outline" size="sm" onClick={clearAll}>
                {tFilters("clearAll")}
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          {/* Desktop table */}
          <div
            className={`hidden overflow-x-auto rounded-lg border md:block ${
              isPlaceholderData ? "opacity-60" : ""
            }`}
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("columns.code")}</TableHead>
                  <TableHead>{t("columns.applicant")}</TableHead>
                  <TableHead>{t("columns.student")}</TableHead>
                  <TableHead>{t("columns.state")}</TableHead>
                  <TableHead className="whitespace-nowrap">
                    {t("columns.submittedAt")}
                  </TableHead>
                  <TableHead className="text-right">
                    {t("columns.score")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isPending &&
                  Array.from({ length: pageSize > 10 ? 10 : pageSize }).map(
                    (_, i) => (
                      <TableRow key={`skeleton-${i}`}>
                        {Array.from({ length: 6 }).map((__, j) => (
                          <TableCell key={`skeleton-${i}-${j}`}>
                            <Skeleton className="h-4 w-20" />
                          </TableCell>
                        ))}
                      </TableRow>
                    ),
                  )}
                {!isPending &&
                  data?.items.map((app) => {
                    const score = applicationScore(app);
                    return (
                      <TableRow
                        key={app.code}
                        className="cursor-pointer"
                        onClick={() => openDetail(app)}
                      >
                        <TableCell className="font-mono text-xs font-medium">
                          {app.code}
                        </TableCell>
                        <TableCell>{app.applicant.fullName}</TableCell>
                        <TableCell>{studentNameOf(app)}</TableCell>
                        <TableCell>
                          <StateBadge state={app.state} />
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-muted-foreground">
                          {DATE_FORMATTER.format(new Date(app.createdAt))}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {score ?? "—"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </div>

          {/* Mobile cards */}
          <div
            className={`space-y-2 md:hidden ${isPlaceholderData ? "opacity-60" : ""}`}
          >
            {isPending &&
              Array.from({ length: 5 }).map((_, i) => (
                <Card key={`card-skeleton-${i}`}>
                  <CardContent className="space-y-2 p-4">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-5 w-20" />
                  </CardContent>
                </Card>
              ))}
            {!isPending &&
              data?.items.map((app) => {
                const score = applicationScore(app);
                return (
                  <button
                    key={app.code}
                    type="button"
                    onClick={() => openDetail(app)}
                    className="w-full text-left"
                  >
                    <Card className="transition-colors hover:bg-muted/40">
                      <CardContent className="space-y-2 p-4">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-xs font-medium">
                            {app.code}
                          </span>
                          <StateBadge state={app.state} />
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            {studentNameOf(app)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {app.applicant.fullName}
                          </p>
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>
                            {DATE_FORMATTER.format(new Date(app.createdAt))}
                          </span>
                          <span>
                            {t("columns.score")}: {score ?? "—"}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </button>
                );
              })}
          </div>

          {/* Pagination */}
          <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">
                {t("pagination.pageSize")}
              </span>
              <Select
                value={String(pageSize)}
                onValueChange={(v) => setPageSize(Number(v))}
              >
                <SelectTrigger className="h-8 w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_SIZES.map((size) => (
                    <SelectItem key={size} value={String(size)}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <span className="text-muted-foreground">
                {t("pagination.range", {
                  from: rangeFrom,
                  to: rangeTo,
                  total,
                })}
              </span>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1 || isPending}
                >
                  {t("pagination.prev")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages || isPending}
                >
                  {t("pagination.next")}
                </Button>
              </div>
            </div>
          </div>
        </>
      )}

      <ApplicationDetailSheet
        application={selected}
        formSchema={formSchema}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onTransition={handleTransition}
      />
    </div>
  );
}

function FilterChip({
  label,
  onClear,
}: {
  label: React.ReactNode;
  onClear: () => void;
}) {
  return (
    <Badge variant="secondary" className="gap-1 py-1 pr-1 font-normal">
      <span className="flex items-center">{label}</span>
      <button
        type="button"
        onClick={onClear}
        className="rounded-full p-0.5 hover:bg-foreground/10"
        aria-label="Clear filter"
      >
        <X className="size-3" />
      </button>
    </Badge>
  );
}
